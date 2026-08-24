#!/usr/bin/env python3
import json
import os
import re
import subprocess
import sys
import time
import urllib.request


CLOSED_STATES = {"Closed", "Done", "Removed"}
TAG_PATTERN = re.compile(r"\d+(?:\.\d+)*")


def run(cmd):
    result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.stdout


def docker_compose_images():
    try:
        output = run(["docker", "compose", "config", "--format", "json"])
    except Exception as exc:
        raise RuntimeError(f"Failed to run docker compose config: {exc}") from exc
    data = json.loads(output)
    images = []
    for svc in data.get("services", {}).values():
        image = svc.get("image")
        if image:
            images.append(image)
    return images


def dockerfile_base_images():
    images = []
    try:
        with open("Dockerfile", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.upper().startswith("FROM "):
                    image = line.split()[1]
                    images.append(image)
    except FileNotFoundError:
        return []
    return images


def parse_image_ref(ref):
    if "@" in ref:
        ref = ref.split("@", 1)[0]
    registry = "docker.io"
    remainder = ref
    if "/" in ref:
        first = ref.split("/", 1)[0]
        if "." in first or ":" in first:
            registry = first
            remainder = ref.split("/", 1)[1]
    name = remainder
    tag = "latest"
    if ":" in remainder:
        name, tag = remainder.rsplit(":", 1)
    if registry == "docker.io" and "/" not in name:
        name = f"library/{name}"
    return registry, name, tag


def tag_signature(tag):
    parts = TAG_PATTERN.findall(tag)
    if not parts:
        return None, None
    pattern = TAG_PATTERN.sub("{v}", tag)
    return pattern, parts


def version_key(version_parts):
    values = []
    for part in version_parts:
        values.extend(int(x) for x in part.split("."))
        values.append(-1)
    return tuple(values)


def fetch_tags_docker_hub(name):
    tags = []
    url = f"https://registry.hub.docker.com/v2/repositories/{name}/tags?page_size=100"
    while url:
        with urllib.request.urlopen(url) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        tags.extend([item["name"] for item in payload.get("results", [])])
        url = payload.get("next")
        time.sleep(0.1)
    return tags


def fetch_tags_ghcr(name):
    url = f"https://ghcr.io/v2/{name}/tags/list"
    with urllib.request.urlopen(url) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("tags", []) or []


def fetch_tags(registry, name):
    if registry == "docker.io":
        return fetch_tags_docker_hub(name)
    if registry == "ghcr.io":
        return fetch_tags_ghcr(name)
    return []


def find_latest_tag(current_tag, tags):
    pattern, current_parts = tag_signature(current_tag)
    if not pattern:
        return None
    current_key = version_key(current_parts)
    best_tag = None
    best_key = current_key
    for tag in tags:
        if tag == current_tag:
            continue
        if TAG_PATTERN.sub("{v}", tag) != pattern:
            continue
        other_pattern, other_parts = tag_signature(tag)
        if not other_parts or other_pattern != pattern:
            continue
        if len(other_parts) != len(current_parts):
            continue
        other_key = version_key(other_parts)
        if other_key > best_key:
            best_key = other_key
            best_tag = tag
    return best_tag


def build_update_report(images):
    updates = []
    for ref in images:
        registry, name, tag = parse_image_ref(ref)
        tags = fetch_tags(registry, name)
        if not tags:
            continue
        latest = find_latest_tag(tag, tags)
        if latest:
            updates.append(
                {
                    "image": f"{registry}/{name}",
                    "current": tag,
                    "latest": latest,
                }
            )
    return updates


def azure_request(method, url, token, payload=None, content_type="application/json"):
    data = None
    headers = {"Authorization": f"Bearer {token}"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = content_type
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def wiql_query(base_url, project, token, title):
    url = f"{base_url}{project}/_apis/wit/wiql?api-version=7.1-preview.2"
    query = {
        "query": (
            "Select [System.Id] From WorkItems "
            "Where [System.TeamProject] = @project "
            "And [System.WorkItemType] = 'Bug' "
            f"And [System.Title] = '{title}' "
            "Order By [System.ChangedDate] Desc"
        )
    }
    result = azure_request("POST", url, token, query)
    work_items = result.get("workItems", [])
    return work_items[0]["id"] if work_items else None


def get_work_item(base_url, project, token, work_item_id):
    url = f"{base_url}{project}/_apis/wit/workitems/{work_item_id}?api-version=7.1-preview.3"
    return azure_request("GET", url, token)


def patch_work_item(base_url, project, token, work_item_id, patch):
    url = f"{base_url}{project}/_apis/wit/workitems/{work_item_id}?api-version=7.1-preview.3"
    return azure_request("PATCH", url, token, patch, "application/json-patch+json")


def create_work_item(base_url, project, token, patch):
    url = f"{base_url}{project}/_apis/wit/workitems/$Bug?api-version=7.1-preview.3"
    return azure_request("POST", url, token, patch, "application/json-patch+json")


def main():
    token = os.getenv("SYSTEM_ACCESSTOKEN")
    if not token:
        print("SYSTEM_ACCESSTOKEN is not available. Enable OAuth token access.", file=sys.stderr)
        sys.exit(1)

    base_url = os.getenv("SYSTEM_COLLECTIONURI", "")
    project = os.getenv("SYSTEM_TEAMPROJECT", "")
    repo_name = os.getenv("BUILD_REPOSITORY_NAME", "repository")
    assignee = os.getenv("TICKET_ASSIGNEE", "").strip()

    if not base_url or not project:
        print("Azure DevOps environment variables are missing.", file=sys.stderr)
        sys.exit(1)

    images = sorted(set(docker_compose_images() + dockerfile_base_images()))
    updates = build_update_report(images)
    if not updates:
        print("No newer Docker image versions found.")
        return

    title = f"Docker image updates available for {repo_name}"
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    lines = [
        f"Image update check detected newer tags on {timestamp}.",
        "",
        "| Image | Current | Latest |",
        "| --- | --- | --- |",
    ]
    for item in updates:
        lines.append(f"| `{item['image']}` | `{item['current']}` | `{item['latest']}` |")
    description = "\n".join(lines)

    work_item_id = wiql_query(base_url, project, token, title)
    if work_item_id:
        work_item = get_work_item(base_url, project, token, work_item_id)
        state = work_item.get("fields", {}).get("System.State", "")
        if state not in CLOSED_STATES:
            patch = [{"op": "add", "path": "/fields/System.History", "value": description}]
            if assignee and assignee.lower() != "replace me":
                patch.append({"op": "add", "path": "/fields/System.AssignedTo", "value": assignee})
            patch_work_item(base_url, project, token, work_item_id, patch)
            print(f"Updated existing work item {work_item_id}.")
            return

    patch = [
        {"op": "add", "path": "/fields/System.Title", "value": title},
        {"op": "add", "path": "/fields/System.Description", "value": description},
        {"op": "add", "path": "/fields/System.Tags", "value": "docker-image-update"},
    ]
    if assignee and assignee.lower() != "replace me":
        patch.append({"op": "add", "path": "/fields/System.AssignedTo", "value": assignee})
    created = create_work_item(base_url, project, token, patch)
    new_id = created.get("id")
    print(f"Created work item {new_id}.")


if __name__ == "__main__":
    main()
