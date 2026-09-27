#!/usr/bin/env python3
"""
MindGarten CLI Client for Hermes Agent and scripts.
Zero external dependencies (uses standard library urllib and json).
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
import urllib.error

DEFAULT_URL = os.environ.get("MINDGARTEN_URL", "http://localhost:3000")
DEFAULT_TOKEN = os.environ.get("MINDGARTEN_TOKEN", "hermes-agent-token")

def make_request(base_url, endpoint, method="GET", token=None, payload=None):
    url = f"{base_url.rstrip('/')}{endpoint}"
    headers = {
        "Accept": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data_bytes = None
    if payload is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.status
            body = response.read().decode("utf-8")
            return status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        try:
            return status, json.loads(body)
        except Exception:
            return status, {"error": body or str(e)}
    except Exception as e:
        return 0, {"error": str(e)}

def cmd_health(args):
    status, data = make_request(args.url, "/health")
    if status == 200:
        print(f"OK: MindGarten is online ({data.get('version', 'unknown')})")
        return 0
    else:
        print(f"ERROR ({status}): {data.get('error', 'Could not reach server')}")
        return 1

def cmd_save(args):
    tags = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else []
    payload = {
        "url": args.link_url,
        "tags": tags,
    }
    if args.title:
        payload["title"] = args.title
    if args.description:
        payload["description"] = args.description

    status, resp = make_request(args.url, "/api/v1/links", method="POST", token=args.token, payload=payload)

    if status in (200, 201):
        data = resp.get("data", {})
        tags_str = ", ".join(t["name"] for t in data.get("tags", [])) or "none"
        print(f"SAVED: [{data.get('id')}] {data.get('title')} ({data.get('url')})")
        print(f"Tags: [{tags_str}] | Saved by: {data.get('createdBy')}")
        return 0
    elif status == 409:
        data = resp.get("data", {})
        print(f"ALREADY_EXISTS: Link already saved as ID {data.get('id')} ({data.get('title')})")
        return 0
    elif status == 401:
        print("ERROR: Unauthorized. Check MINDGARTEN_TOKEN.")
        return 1
    else:
        print(f"ERROR ({status}): {resp.get('error')}")
        return 1

def cmd_search(args):
    q = urllib.parse.quote(args.query)
    status, resp = make_request(args.url, f"/api/v1/links/search?q={q}", token=args.token)

    if status == 200:
        links = resp.get("data", [])
        print(f"Found {len(links)} results for '{args.query}':\n")
        for link in links:
            tags_str = ", ".join(t["name"] for t in link.get("tags", []))
            print(f"- [{link['id']}] {link.get('title')}")
            print(f"  URL: {link.get('url')}")
            if tags_str:
                print(f"  Tags: {tags_str}")
            if link.get("description"):
                print(f"  Note: {link.get('description')}")
        return 0
    else:
        print(f"ERROR ({status}): {resp.get('error')}")
        return 1

def cmd_list(args):
    params = []
    if args.take:
        params.append(f"take={args.take}")
    if args.tag:
        params.append(f"tag={urllib.parse.quote(args.tag)}")
    query_str = f"?{'&'.join(params)}" if params else ""

    status, resp = make_request(args.url, f"/api/v1/links{query_str}", token=args.token)

    if status == 200:
        links = resp.get("data", [])
        total = resp.get("total", len(links))
        print(f"Total bookmarks: {total} (showing {len(links)}):\n")
        for link in links:
            tags_str = ", ".join(t["name"] for t in link.get("tags", []))
            author = f" [{link.get('createdBy')}]" if link.get("createdBy") else ""
            print(f"- [{link['id']}] {link.get('title')}{author}")
            print(f"  URL: {link.get('url')}")
            if tags_str:
                print(f"  Tags: {tags_str}")
        return 0
    else:
        print(f"ERROR ({status}): {resp.get('error')}")
        return 1

def main():
    parser = argparse.ArgumentParser(description="MindGarten CLI Client for Hermes Agent")
    parser.add_argument("--url", default=DEFAULT_URL, help=f"MindGarten API URL (default: {DEFAULT_URL})")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="API Bearer Token")

    subparsers = parser.add_subparsers(dest="command", required=True)

    # health
    subparsers.add_parser("health", help="Check server health")

    # save
    p_save = subparsers.add_parser("save", help="Save a new link")
    p_save.add_argument("link_url", help="URL to bookmark")
    p_save.add_argument("--title", help="Optional title")
    p_save.add_argument("--description", "--desc", help="Optional description/notes")
    p_save.add_argument("--tags", help="Comma-separated tags (e.g. 'ai,dev,docs')")

    # search
    p_search = subparsers.add_parser("search", help="Search links")
    p_search.add_argument("query", help="Text to search")

    # list
    p_list = subparsers.add_parser("list", help="List recent links")
    p_list.add_argument("--take", type=int, default=10, help="Number of links to show (default 10)")
    p_list.add_argument("--tag", help="Filter by tag name or ID")

    args = parser.parse_args()

    if args.command == "health":
        sys.exit(cmd_health(args))
    elif args.command == "save":
        sys.exit(cmd_save(args))
    elif args.command == "search":
        sys.exit(cmd_search(args))
    elif args.command == "list":
        sys.exit(cmd_list(args))

if __name__ == "__main__":
    main()
