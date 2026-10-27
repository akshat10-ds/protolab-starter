#!/usr/bin/env python3
"""Turn a Vite `dist/` folder into ONE self-contained HTML file for a visual self-check.

The Cowork file preview loads nothing over the network, not even relative files,
so the normal multi-file build renders blank there. This script inlines the CSS,
fonts, JS and every image into a single file that the preview can render and screenshot.

    python3 -I selfcheck.py <dist-dir> <out.html>

The output is only for Claude to look at. Publish the real dist/, not this.
"""
import base64
import mimetypes
import os
import re
import sys

dist, out = sys.argv[1], sys.argv[2]
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("image/svg+xml", ".svg")


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    with open(path, "rb") as f:
        return "data:%s;base64,%s" % (mime, base64.b64encode(f.read()).decode())


# Every non-code file in dist, keyed by its path relative to dist
binaries = {}
for root, _, files in os.walk(dist):
    for name in files:
        if name.endswith((".html", ".js", ".css", ".json", ".map")):
            continue
        full = os.path.join(root, name)
        if os.path.getsize(full) > 300_000:
            continue  # e.g. a 1.2 MB avatar photo: keeps the page small enough for the preview panel
        binaries[os.path.relpath(full, dist).replace(os.sep, "/")] = full


def inline_refs(text):
    # Replace quoted references like "./avatar.jpg?v=1", "assets/x.svg" or "x.svg"
    for rel, full in binaries.items():
        base = os.path.basename(rel)
        uri = data_uri(full)
        for prefix in ("./" + rel, rel, "./" + base, base):
            text = re.sub(r'(["\'`(])' + re.escape(prefix) + r'(\?[^"\'`)]*)?(?=["\'`)])',
                          lambda m: m.group(1) + uri, text)
    return text


with open(os.path.join(dist, "index.html")) as f:
    html = f.read()


def css_tag(m):
    with open(os.path.join(dist, m.group(1))) as f:
        css = f.read()
    # url(Font.woff2) inside assets/ resolves relative to the CSS file
    css = re.sub(r"url\(([^)\"']+)\)", lambda u: 'url("%s")' % u.group(1), css)
    return "<style>" + inline_refs(css) + "</style>"


html = re.sub(r'<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css_tag, html)

scripts = re.findall(r'<script type="module"[^>]*src="([^"]+)"[^>]*></script>', html)
html = re.sub(r'<script type="module"[^>]*src="[^"]+"[^>]*></script>', "", html)
body_js = ""
for src in scripts:
    with open(os.path.join(dist, src)) as f:
        js = inline_refs(f.read()).replace("</script>", "<\\/script>")
    body_js += '<script type="module">' + js + "</script>"
html = html.replace("</body>", body_js + "</body>")

# The preview panel may load the page in the background, where requestAnimationFrame
# never fires. The app's fade-ins (useFadeIn, FadeIn, useStaggerEntrance) wait on it,
# so without this everything stays at opacity 0 and the screenshot looks blank.
# We also turn off transitions so the screenshot shows the final state.
settle = (
    "<script>window.requestAnimationFrame=function(cb){return setTimeout(function(){cb(performance.now())},0)};"
    "window.cancelAnimationFrame=function(id){clearTimeout(id)};</script>"
    "<style>*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}</style>"
)
html = html.replace("<head>", "<head>" + settle, 1)

with open(out, "w") as f:
    f.write(html)
print("self-check page: %s (%.1f MB)" % (out, len(html) / 1e6))
