# ProtoLab fidelity target

The target is a reusable Docusign prototyping playground. The user clarified on
2026-10-20 that matching every production detail to 100% is unnecessary. Live
Docusign is a read-only reference; do not create, edit, send, or delete account
data to make a prototype more complete.

The user further clarified the priority: **key screens before complete flows**.
Home, Agreements and Templates are the first screen targets. Content insets and
row density may vary, as they also vary in production. Check readability and
recognizable structure instead of treating those differences as blocking defects.

## Where fidelity matters

| Area | Target |
|---|---|
| Shared foundation | Use the installed Ink components and tokens consistently. Navigation, page structure, typography, tables and forms should feel native to Docusign. |
| The flow being explored | Make the intended path, relevant alternatives, validation and result state convincing enough to evaluate the idea. Keep mock state consistent across the screens used in that flow. |
| Content | Use plausible fixtures with enough variety to exercise the decision being tested. Production account data and counts are unnecessary. |
| Surrounding product | Give the flow credible context and working entry/exit paths. Expand unrelated screens only when the experiment needs them. |
| Engineering | Keep startup and build reliable, preserve component contracts and make changes easy to compose. Use simulated services when realistic UI behavior is sufficient for the experiment. |

Fidelity can differ across visuals, content and interaction. This approach follows
[NN/g's distinction between those dimensions](https://www.nngroup.com/articles/ux-prototype-hi-lo-fidelity/)
and the [GOV.UK guidance on code prototypes for realistic interactions](https://www.gov.uk/service-manual/design/making-prototypes).
The table above is this project's recommendation, not a universal numerical
threshold or a measured percentage of completeness.

## Decide whether a gap needs work

Prioritize a gap when it could change research feedback, misrepresent a user
decision, break the explored flow, or force people to invent one-off UI instead
of using the system. Defer cosmetic differences and unrelated features that do
not affect the experiment.

Before calling a scoped prototype ready:

1. State the question and the flow being evaluated.
2. Check the screen against the closest Docusign pattern and the current Ink API.
3. Exercise that flow with representative data, including its important state
   changes and error/empty cases.
4. Compare the relevant rendered pattern at a matching viewport. Check that
   content is legible, controls are usable, and the tested layout fits.
5. Run the appropriate build and contract checks. Report real failures and
   limitations; do not suppress them or lower a baseline to manufacture a pass.

There is no whole-product pixel-match gate for every prototype. Revisit a shared
pattern when new product or Figma evidence changes what users would perceive.
The generated design-system folders remain protected by AGENTS.md: repair
shared contracts upstream and deliver a compatible refresh.

## Current implementation evidence

See [the key-screen alignment pass](key-screen-alignment-2026-10-20.md)
for verified changes and remaining gaps. Shared type/token contract health is a
higher priority than reconstructing additional production settings screens.

The [comprehensive Figma component review](figma-library-review-2026-10-20.md)
covers all 164 current owners and 1,389 actual specimens across the file. Its
coverage ledger separates metadata/source checks, representative Figma images
and unperformed runtime parity checks. Use the current-screen findings first;
conditional variants are a backlog for experiments that need them.
