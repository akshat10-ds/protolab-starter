# AgentActivity

Canonical list of agent runs and their read-only records. Import `AgentActivity`
and `AgentRun` from `@ai`. The host provides runs and owns destination links in
their markdown; this component owns search, status selection, and the open run.

| Prop | Default | Purpose |
|---|---|---|
| `runs` | Required | Existing run data and transcripts. No data is generated. |
| `title` | `Activity` | List heading. |
| `subtitle` | `What your agents have been doing.` | Supporting text; pass `""` to omit it. |
| `showHeading` | `true` | Omit the section heading when the host already names the surface; workspace view buttons move to the search toolbar. |
| `appearance` | `default` | `workspace` opts into the result-led list and record layout. |
| `viewSwitcher` | `false` | In workspace appearance, offers List, Kanban, and Table. Ignored by default appearance. |
| `defaultView` | `list` | Initial workspace layout (`list`, `kanban`, or `table`). Applies when the view switcher is enabled; subsequent user switches stay in component state. |

## Workspace presentation

```tsx
<AgentActivity
  appearance="workspace"
  title="Recent activity"
  subtitle=""
  runs={runs}
/>
```

- The host owns outer padding and maximum page width. The component is top-aligned
  and fills that width, with a 16px semibold section heading.
- Search uses Ink `SearchInput`; status filtering uses Ink `FilterTag` inside
  `Dropdown`, with the current choice selected in the menu. Focus and interaction
  styles remain the Ink defaults. Layout-switcher controls remain Ink Buttons.
- Rows have an 80px minimum height. The result leads, agent identity is secondary,
  and timestamp/status share an aligned trailing column. Results wrap without
  truncation; below 600px component width, metadata moves below the result.
- Status labels use Ink `StatusLight noFill`: warning for Needs attention,
  success for Done, and the neutral component with scoped Ink cobalt tokens for Running. Supplied run icons retain their
  meaning; the workspace fallback is `data-read`.
- Run details put the result above metadata and show instructions in a quiet,
  left-aligned Ink text block. Reasoning and output continue using canonical
  `AgentThinking`, `MarkdownRenderer`, and `StreamingMarkdown`.
- When the first output paragraph exactly repeats the summary already shown in
  the header, only that paragraph is omitted. All other output and links remain.
- Opening a run focuses its Back control. Back retains the search/filter and
  restores focus to the opened row. An empty
  filtered view offers Clear filters, which resets both controls and focuses search.

The omitted/default appearance retains the original compact inbox, controls,
transcript bubbles, and spacing. Search matching, attention-first All sorting,
within-status order, and attention counts are shared and unchanged.

## Alternate activity views

Pass `viewSwitcher` with `appearance="workspace"` to add the Ink button group
beside the section heading. List is the initial view and keeps the refined rows.
With `showHeading={false}`, the same buttons sit at the end of the search/status toolbar.
Hosts can select another initial layout with `defaultView="kanban"` or `"table"`.
The optional `--ai-activity-lane-bg` surface role overrides the board lane fill;
its fallback is Ink's neutral fade-5. It does not change status colors or controls.

- **Kanban:** groups the currently filtered runs into Needs attention, Running,
  and Done. All three lanes remain visible. Counts come from those runs; empty
  lanes say when nothing is running or when current filters have no matches.
  Lane headings include the count within their StatusLight label, above the tinted card stacks.
  Cards retain the result, agent, and timestamp. There is no drag/status mutation.
- **Table:** renders the same runs through Ink Table with Result, Agent, Status,
  and Time columns. Result buttons open the shared record. On narrow surfaces,
  horizontal scrolling remains inside the labelled table region.
- **Shared state:** search, status, selected layout, and open run use the same
  component state. Detail/Back retains the layout and restores focus to the
  originating row, card, or result button. Host navigation that keeps this
  component mounted retains its state; no persistence store is added.
- **Keyboard:** switcher buttons expose `aria-pressed` and labelled view names.
  Tab and Enter/Space work natively; Left/Right, Home, and End switch and focus a
  view. Only the active layout renders interactive run controls.

The board stacks below 700px component width. The table has a 720px contained
minimum. The switcher wraps with the heading; it never widens the host surface.

## Host run conversations

`onOpenRun?: (run: AgentRun) => boolean` lets a host route a run into a contextual
conversation. Return `true` only when handled; `false` retains the built-in record.
Keep the activity mounted but hidden while the host conversation is visible so
search, status and layout survive. The host owns initial and return focus.

`viewSwitcherStyle="icons"` opts into labelled 32px Ink IconButtons for the existing
List, Kanban and Table modes. Arrow/Home/End navigation and pressed states remain
the same. Omit both props for unchanged current behavior.
