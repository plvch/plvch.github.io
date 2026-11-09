#!/usr/bin/env python3
"""
Check dist/ before it is deployed.

1. Every internal link and resource resolves to a file in dist/ or to a rule in
   _redirects (anchors and query strings are ignored).
2. No page loads anything from another host: scripts, styles, images, frames and
   fonts must come from plvch.com. Links to other sites are fine. This keeps the
   Datenschutzerklärung true: § 3 promises no third-party services.

    python3 build.py && python3 scripts/check_site.py
"""
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urlparse

DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
OWN_HOSTS = {"plvch.com", "www.plvch.com"}
# (tag, attribute) pairs that make the browser fetch something.
LOADS = {("script", "src"), ("img", "src"), ("iframe", "src"), ("source", "src"),
         ("video", "src"), ("audio", "src"), ("video", "poster"), ("embed", "src"), ("object", "data")}
LOADING_LINK_RELS = {"stylesheet", "icon", "preload", "modulepreload", "manifest", "apple-touch-icon"}


class Refs(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links, self.loads = [], []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and a.get("href"):
            self.links.append(a["href"])
        if tag == "link" and a.get("href"):
            rels = set((a.get("rel") or "").lower().split())
            (self.loads if rels & LOADING_LINK_RELS else self.links).append(a["href"])
        for t, attr in LOADS:
            if tag == t and a.get(attr):
                self.loads.append(a[attr])


def redirect_sources():
    path = os.path.join(DIST, "_redirects")
    prefixes = []
    for line in open(path, encoding="utf-8") if os.path.exists(path) else []:
        line = line.strip()
        if line and not line.startswith("#"):
            prefixes.append(line.split()[0].rstrip("*"))
    return prefixes


def resolves(page, url, redirects):
    u = urlparse(url)
    if u.scheme in ("mailto", "tel", "javascript", "data"):
        return True
    if u.netloc and u.netloc not in OWN_HOSTS:
        return True  # an external link, checked elsewhere if at all
    path = unquote(u.path)
    if not path:
        return True  # same-page anchor
    if not path.startswith("/"):
        path = "/" + os.path.relpath(os.path.join(os.path.dirname(page), path), DIST).replace(os.sep, "/")
        path = os.path.normpath(path)
    if any(path.startswith(p) for p in redirects):
        return True
    full = os.path.join(DIST, path.lstrip("/"))
    return (os.path.isfile(full) or os.path.isfile(os.path.join(full, "index.html"))
            or os.path.isfile(full.rstrip("/") + ".html"))


def main():
    redirects = redirect_sources()
    errors, pages = [], 0
    for root, _, files in os.walk(DIST):
        for name in files:
            if not name.endswith(".html"):
                continue
            page = os.path.join(root, name)
            pages += 1
            p = Refs()
            p.feed(open(page, encoding="utf-8").read())
            rel = os.path.relpath(page, DIST)
            for url in p.loads:
                host = urlparse(url).netloc
                if host and host not in OWN_HOSTS:
                    errors.append("{}: loads from another host: {}".format(rel, url))
                elif not resolves(page, url, redirects):
                    errors.append("{}: missing resource: {}".format(rel, url))
            for url in p.links:
                if not resolves(page, url, redirects):
                    errors.append("{}: broken link: {}".format(rel, url))
            # Inline CSS can load fonts or images too.
            for m in re.finditer(r'url\(\s*["\']?(https?://[^"\')]+)', open(page, encoding="utf-8").read()):
                if urlparse(m.group(1)).netloc not in OWN_HOSTS:
                    errors.append("{}: CSS loads from another host: {}".format(rel, m.group(1)))
    for e in errors:
        print(e)
    print("{} pages checked, {} problems".format(pages, len(errors)))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
