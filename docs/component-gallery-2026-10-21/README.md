# Component gallery — 2026-10-21

`/components` is a standalone review surface outside the Docusign product shell.
`/componets` is accepted as a spelling alias. Both routes use the normal Vite
entry point; the application code remains in `src/App.tsx`. The prototype
continues to use its existing hash routes and its single `DocuSignShell`.

The gallery lists 89 named public Ink components in 34 examples. Search matches
component names and example titles. Category filters include mixed examples in
both relevant layers. Examples cover representative states, not every possible
property combination. DocuSignShell and GlobalNav link to their existing product
context instead of nesting another product shell.

The token preview previously paired the default medium Button with an explicit
small Button. Both actions now use medium: 40px in Standard/Inverse and 48px in
Touch. The gallery separately labels small, medium, large and extra large.
Small/medium use the exported Figma CTA dimensions; large/extra large are code
extensions. Computed browser heights are saved in `browser-checks.json`.

Verification:

- Typecheck and build passed; the existing bundle-size warning remains.
- Source-use audit: zero findings without a baseline; all 16 audit tests passed.
- All 10,844 token checks still pass.
- Browser checked direct load/reload, search, categories, empty results, four
  button modes, table density/filtering, split actions, menu selection, popover,
  modal/drawer dismissal with restored focus, and agent action/panel examples.
- At the existing 1558 × 1187 viewport, no broken images or horizontal overflow.
  Mobile dimensions were not explicitly tested.

Screenshots: `gallery.png`, `tokens.png`, `inverse-touch.png`, `modal.png`.
Only app-owned views/styles/docs changed for this work; no generated component
source, live Docusign data or Figma library was changed.
