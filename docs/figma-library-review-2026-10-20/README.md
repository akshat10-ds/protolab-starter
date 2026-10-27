# Evidence guide

Start with [the combined report](../figma-library-review-2026-10-20.md) and [coverage.json](coverage.json). Group findings separate source/API comparison, current Figma specimen screenshots and unperformed runtime verification. No percentage or pixel-parity pass is inferred from metadata.

`evidence/page-<page-id>.json.gz` is the complete accepted appearance snapshot for one page. Each owner has current raw property definitions (including modern SLOT types), extant variants and deduplicated appearance signatures. For each variant, `nodeRefs[].sig` indexes its owner's `appearanceSignatures`; `nodeRefs[].id` preserves the exact descendant ID. The first node is the variant root. Text, bounds, fills, strokes, radii, layout, effects and bindings are captured. Mixed text fields are omitted; this is not a complete rich-text range or glyph path equivalence audit.

The compressed published graph records normalized properties/dependencies. Per-page definitions are authoritative for current property types: the published API can normalize a modern SLOT as INSTANCE_SWAP. Imported master identities supplement the initial nullable-parent lookup errors; all recorded errors were resolved by the supplemental read. The original errors are retained as provenance.

Other snapshots: variables/styles plus resolved mode aliases; imported-master identities; the linked System icon names/vector geometry; exact local template targets/property reads; source icon paths and bounded name mapping. `compressed-evidence-manifest.json` records byte sizes and SHA-256 hashes of each uncompressed snapshot. PNGs are local current Figma references. Contexts are sanitized text and do not embed image bytes or temporary asset URLs.

Read a snapshot with Python:

```python
import gzip, json
with gzip.open('docs/figma-library-review-2026-10-20/evidence/page-9187-6020.json.gz', 'rt') as source:
    page = json.load(source)
```

`python3 docs/figma-library-review-2026-10-20/build-coverage.py` rebuilds the coverage ledger from these saved snapshots. `compare-tokens.py` rebuilds the explicitly scoped Standard-mode token comparison. Both read saved evidence; neither contacts Figma nor modifies generated source. Role classifications distinguish family/group masters, presets and internal children; they are audit labels, not Figma schema.

The requested file's 164 owners are fully inventoried. The separate Icon Library is only a System-page supplement; every-glyph raster equivalence, other icon pages, runtime component states, inverse/touch/responsive behavior and arbitrary slot permutations remain unverified.
