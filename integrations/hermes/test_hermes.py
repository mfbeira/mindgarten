#!/usr/bin/env python3
"""
Automated Hermes Integration Test Suite.
Verifies all capabilities required by Hermes Agent.
"""

import os
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = os.environ.get("MINDGARTEN_URL", "http://localhost:3000")
HERMES_TOKEN = os.environ.get("MINDGARTEN_TOKEN", "hermes-agent-token")

PASSED = 0
FAILED = 0

def log_test(name, success, detail=""):
    global PASSED, FAILED
    status_label = "[PASS]" if success else "[FAIL]"
    if success:
        PASSED += 1
        print(f"  + {status_label} {name} {detail}")
    else:
        FAILED += 1
        print(f"  - {status_label} {name} - {detail}")

def req(path, method="GET", token=None, payload=None):
    url = f"{BASE_URL.rstrip('/')}{path}"
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    if data:
        headers["Content-Type"] = "application/json"

    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=8) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}
    except Exception as e:
        return 0, {"error": str(e)}

def run():
    print(f"\n==========================================")
    print(f" MindGarten <-> Hermes Agent Test Suite")
    print(f" Target: {BASE_URL}")
    print(f" Token:  {HERMES_TOKEN[:6]}... (Hermes Named Token)")
    print(f"==========================================\n")

    # 1. Health
    status, res = req("/health")
    log_test("GET /health", status == 200 and res.get("status") == "ok", f"(Version: {res.get('version')})")

    # 2. Ready
    status, res = req("/ready")
    log_test("GET /ready (Database connected)", status == 200 and res.get("database") == "connected")

    # 3. Auth rejection on wrong token
    status, res = req("/api/v1/links", token="invalid-token-12345")
    log_test("Auth Middleware: Rejects invalid token", status == 401)

    # 4. Auth acceptance with Hermes token
    status, res = req("/api/v1/links", token=HERMES_TOKEN)
    log_test("Auth Middleware: Accepts Hermes token", status == 200)

    # 5. Create link as Hermes
    unique_ts = int(time.time())
    test_url = f"https://arxiv.org/abs/2401.0{unique_ts}"
    payload = {
        "url": test_url,
        "title": f"Hermes Paper {unique_ts}",
        "description": "Integration verification document",
        "tags": ["hermes-test", "paper"]
    }
    status, res = req("/api/v1/links", method="POST", token=HERMES_TOKEN, payload=payload)
    is_created = status in (200, 201) and res.get("success") is True
    created_by = res.get("data", {}).get("createdBy") if is_created else ""
    log_test(
        "POST /api/v1/links (Save bookmark)",
        is_created and created_by == "hermes",
        f"(Created ID {res.get('data', {}).get('id')}, createdBy='{created_by}')"
    )

    # 6. Duplicate conflict handling (409)
    status, res_dup = req("/api/v1/links", method="POST", token=HERMES_TOKEN, payload={"url": test_url})
    log_test("Duplicate Link Handling (409 Conflict)", status == 409 and "already exists" in res_dup.get("error", ""))

    # 7. Search
    status, res_search = req(f"/api/v1/links/search?q=Paper%20{unique_ts}", token=HERMES_TOKEN)
    found = len(res_search.get("data", [])) > 0
    log_test(f"GET /api/v1/links/search (Full-text search)", status == 200 and found)

    # 8. Filter by tag
    status, res_tag = req("/api/v1/links?tag=hermes-test", token=HERMES_TOKEN)
    has_tag = any(item.get("url") == test_url for item in res_tag.get("data", []))
    log_test("GET /api/v1/links?tag= (Filter by tag)", status == 200 and has_tag)

    # 9. List Tags
    status, res_tags = req("/api/v1/tags", token=HERMES_TOKEN)
    log_test("GET /api/v1/tags (Tag aggregation)", status == 200 and len(res_tags.get("data", [])) > 0)

    print("\n------------------------------------------")
    print(f" Summary: {PASSED} Passed, {FAILED} Failed")
    print(f"------------------------------------------\n")

    return 0 if FAILED == 0 else 1

if __name__ == "__main__":
    sys.exit(run())
