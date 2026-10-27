#!/usr/bin/env python3
"""Catch Ink names that build fine but render wrong: unknown icon names and unknown tokens.

Icon names are plain strings and CSS variables fall back silently, so neither
fails the build or the type check. A wrong icon renders as a blank square,
and a wrong token renders as the browser default. Run from the project root:

    python3 -I check-ink.py [baseline-file]

Prints "<file>: icon <name>" / "<file>: token <name>" for every unknown name,
skipping entries already listed in the baseline (known issues in the starter).
"""
import glob
import os
import re
import sys

icons_src = open("src/design-system/3-primitives/Icon/iconPaths.ts").read()
icons = set(re.findall(r"^\s*'([a-z0-9-]+)':\s*\{", icons_src, re.M))

tokens = set()
for css in glob.glob("src/**/*.css", recursive=True):
    tokens |= set(re.findall(r"(--ink-[a-z0-9-]+)\s*:", open(css).read()))

ICON_USE = re.compile(
    r"""(?:\b(?:icon|startIcon|endIcon|headerIcon|statusIcon|leadingIcon|trailingIcon)\s*[=:]\s*\{?\s*|<Icon[^>]*?\bname\s*=\s*\{?\s*)['"]([a-z0-9-]+)['"]"""
)
ICON_TERNARY = re.compile(r"<Icon[^>]*?\bname=\{[^}]*\}")  # name={cond ? 'a' : 'b'}
TOKEN_USE = re.compile(r"var\((--ink-[a-z0-9-]+)")

baseline = set()
if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
    baseline = {l.strip() for l in open(sys.argv[1]) if l.strip()}

problems = set()
for root, _, files in os.walk("src"):
    if "design-system" in root or "ai-system" in root:
        continue
    for name in files:
        if not name.endswith((".tsx", ".ts", ".css")):
            continue
        path = os.path.join(root, name)
        text = open(path).read()
        used = set(ICON_USE.findall(text))
        for m in ICON_TERNARY.findall(text):
            used |= set(re.findall(r"[?:]\s*'([a-z0-9-]+)'", m))  # only the branches, not the condition
        for icon in used - icons:
            problems.add("%s: icon %s" % (path, icon))
        for tok in set(TOKEN_USE.findall(text)) - tokens:
            problems.add("%s: token %s" % (path, tok))

for p in sorted(problems - baseline):
    print(p)
