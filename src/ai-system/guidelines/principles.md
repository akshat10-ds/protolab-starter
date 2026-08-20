# Principles — the chat's standing rules

**Akshat authors this file.** It is the canonical statement of how the chat
behaves, rendered on the spec site and read every time a prototype composes the
chat. Agents may propose edits; only positions Akshat has actually taken belong
here.

## Decided — encoded in components, proven in the panel prototype

1. **Judged in the real app, never a skeleton.** In Akshat's words: "the
   context in which it shows up — that should be the real app."
2. **The panel is a sibling of the host page, never its parent.** The page
   reflows around the panel's width; a panel that wraps the page can never
   push it.
3. **Fullscreen is a width, not a mode.** Dragging to the edge enters it;
   dragging back leaves it.
4. **The chat never resizes itself.** It renders affordances and reports
   intent upward; the host owns the space.
5. **Closing never loses state.** A closed panel is zero-width, not
   unmounted — scroll, draft, and streamed replies survive.
6. **Opening always lands in the same place.** Sidebar width, every time.

## Akshat's key rules

_He is writing these. Do not fill this section for him._
