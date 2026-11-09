#!/usr/bin/env python3
"""
Copy the published files of each essay from its own repository into essays/<slug>/.

The essay repositories hold the research, drafts and build scripts. Only the files
listed in essays/manifest.json are published on plvch.com; everything else stays in
the essay repo. Third-party scripts listed under "vendor" are downloaded once, checked
against the page's integrity hash, and served from plvch.com instead of the CDN, so
visitors' browsers make no requests to other hosts.

    python3 scripts/sync_essays.py             # all essays
    python3 scripts/sync_essays.py turnover-vs-gdp

Run it after an essay changes, review the diff, commit. The commit of each source
repo is recorded in the manifest.
"""
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "essays", "manifest.json")


def sri_ok(data, html, url):
    """True if the integrity attribute on the tag that loads `url` matches `data`."""
    m = re.search(re.escape(url) + r'"[^>]*integrity="(sha\d+)-([^"]+)"', html)
    if not m:
        return True
    algo, want = m.group(1), m.group(2)
    return base64.b64encode(hashlib.new(algo, data).digest()).decode() == want


def sync(slug, spec):
    out = os.path.join(ROOT, "essays", slug)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["git", "clone", "--quiet", "--depth", "1", "--branch", spec["ref"],
                        "https://github.com/{}.git".format(spec["repo"]), tmp], check=True)
        commit = subprocess.run(["git", "-C", tmp, "rev-parse", "HEAD"], check=True,
                                capture_output=True, text=True).stdout.strip()
        shutil.rmtree(out, ignore_errors=True)
        for rel in spec["files"]:
            os.makedirs(os.path.dirname(os.path.join(out, rel)), exist_ok=True)
            shutil.copy2(os.path.join(tmp, rel), os.path.join(out, rel))
    for url, rel in spec.get("vendor", {}).items():
        with urllib.request.urlopen(url) as r:
            data = r.read()
        users = [f for f in spec["files"] if f.endswith((".html", ".js", ".jsx", ".css"))]
        for f in users:
            path = os.path.join(out, f)
            text = open(path, encoding="utf-8").read()
            if url not in text:
                continue
            if not sri_ok(data, text, url):
                sys.exit("integrity mismatch for " + url)
            local = os.path.relpath(rel, os.path.dirname(f))
            open(path, "w", encoding="utf-8").write(text.replace(url, local))
        dst = os.path.join(out, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(data)
    spec["commit"] = commit
    print("{}: {}@{} ({} files, {} vendored)".format(
        slug, spec["repo"], commit[:7], len(spec["files"]), len(spec.get("vendor", {}))))


def main():
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    for slug in sys.argv[1:] or manifest:
        sync(slug, manifest[slug])
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
        f.write("\n")


if __name__ == "__main__":
    main()
