# Agreement previews on Home

Reviewed and implemented on October 26, 2026. Scope: the Home template cards,
their document previews, and the existing local template-to-envelope path.

1. **Home cards — verified.** Replaced the two generic favorites with NDA,
   service agreement, and offer letter samples. Cards use the public Ink
   `PreviewCard`, actual PDF page renders, owner labels, and accurate page counts.
   The grid uses the existing responsive public layout. See
   [before](01-home-before.png) and [after](02-home-after.png).
2. **Document preview — verified.** All six document pages load across the three
   templates. The cards open an Ink Modal with the complete document and a PDF
   download link. The same documents appear in the Templates preview and gallery.
   Keyboard Enter opens a card. See [preview](03-document-preview.png).
3. **Use template — verified.** NDA and offer letter samples attach their real PDF
   to the existing local envelope composer and prefill the subject and message.
   This uses a shared handler for Home and Templates and checks the PDF response.
   Fixed outdated composer CSS selectors so its close button no longer overlaps
   Advanced Options; mouse close was checked. See [composer](04-template-composer.png).
4. **Favorites — verified.** Removing Offer Letter in Templates removes its Home
   card; restoring it restores the card. Home now derives favorites from the
   parent template state. Browse opens All Templates and View all opens Favorites.
   Verification changes were restored; all three sample favorites are present.

The document fixtures are fictional samples labeled for prototype use. PDFs and
page images live in `public/template-previews/`. Regenerate them with
`scripts/generate-template-previews.py` using Python with reportlab and
pypdfium2 installed. The manifest records each document's page count and assets.
Page counts, extracted text, render existence, and all six page layouts were checked.

`npm run typecheck`, `npm run audit:design-system -- --no-baseline` (zero findings),
and `npm run build` pass. The pinned token check passes all 10,844 checks.
The existing build chunk-size warning remains. This is a focused desktop review;
it does not establish full accessibility compliance or exhaustive device coverage.
The browser console shows only the existing Agentation connection fallback warnings.
Live Docusign and Figma were not modified. Local fixture changes still reset on reload.
