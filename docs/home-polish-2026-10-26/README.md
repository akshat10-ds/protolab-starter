# Home hover, typography, and sample content

Reviewed against the signed-in Docusign Home screen on October 26, 2026.
Live Docusign was used only as a read-only visual reference.

1. **Overview counters — verified.** Four counters use the live translucent white
   hover, rounded end segments, dividers, soft outline, and date/context tooltips.
   The observed live hover and prototype hover both resolve to white at 50%
   opacity. See [live](02-live-summary-hover.png) and [prototype](05-home-hover.png).
2. **Typography and icons — verified.** Compared rendered text rather than relying
   on token names alone. Corrected activity links from 14px to 16px medium and
   removed their inherited 40px discrete-link height. Activity title boxes are now
   20px with a 24px timestamp row. Task count uses a small public AlertBadge.
   Task arrows use the 20px master in a 32px IconButton. Home action icons use the
   small masters; Ask Iris to Send uses the inverse Iris as requested.
3. **Sample content — verified.** Home now uses ordinary First Pixel Studio,
   Brightline Solutions, and Northstar agreement names. The author's presence is
   in owner/preparer fields, the AM-2026-001 document reference, and small PDF
   credits. No ProtoLab or Ink Library labels appear in visible Home content.
   Three sample PDFs and all six page images were regenerated and inspected.
4. **Linked tasks and templates — verified.** All four Home task titles appear in
   their destination lists. The draft opens with its matching subject; the
   design/build template opens the envelope composer with its PDF attached and
   subject prefilled. Home continues to derive favorites from shared local state.

| Text role | Live size / weight / line height | Prototype size / weight / line height |
|---|---|---|
| Welcome | 24 / 400 / 30 | 24 / 400 / 30 |
| Section and task headings | 20 / 500 / 25 | 20 / 500 / 25 |
| Task agreement name | 16 / 400 / 24 | 16 / 400 / 24 |
| Task metadata | 12 / 500 / 18 | 12 / 500 / 18 |
| Activity agreement name | 16 / 500 / 20 | 16 / 500 / 20 |
| Activity timestamp | 12 / 400 / 18 | 12 / 400 / 18 |
| Summary label | 14 / 500 / 19.6 | 14 / 500 / 19.6 |

Sizes are CSS pixels. Tracking uses the public Figma tokens; some differ from
the live percentage-based tracking by fractions of a pixel. This is a focused
Home review, not a claim of complete visual or accessibility parity.

All application UI is composed from the public design-system barrel. No generated
design-system or AI-system source was edited in this pass. Local data remains
temporary and resets on reload.

Validation: typecheck and production build pass; the static design-system audit
has zero findings; all 10,844 pinned token checks pass. Existing bundle-size and
Agentation connection fallback warnings remain.
