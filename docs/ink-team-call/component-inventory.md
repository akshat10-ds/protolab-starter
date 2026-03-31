# ProtoLab Starter — Ink DS Component Inventory

Generated: March 31, 2026

## Home Page Component Usage

| Component | Count | Key Props |
|-----------|-------|-----------|
| **DocuSignShell** | 1 | globalNav, localNav |
| **GlobalNav** | 1 | logo, navItems, showAppSwitcher, user |
| **Stack** | 19 | gap="none", gap="medium", gap="small" |
| **Inline** | 26 | justify="between", align="center", gap="small/medium/large" |
| **Text** | 52 | size: xs/sm/lg, weight: semibold/medium/regular, color: secondary |
| **Card** | 9 | radius="large", radius="medium", noPadding |
| **Icon** | 23 | status-void, status-check, chevron-right, info, send, ai-spark-filled, templates, star, copy, help-circle, bar-chart-2, file-text, home, grid |
| **IconButton** | 3 | variant="tertiary", size="small" |
| **Heading** | 1 | level=3 |
| **Button** | 2 | kind="brand" menuTrigger, kind="secondary" size="small" |
| **Grid** | 2 | columns=3, columns=2, gap="medium" |
| **Container** | 1 | maxWidth=1120 |
| **Avatar** | 1 | size="small" (in GlobalNav) |
| **Chip** | 1 | onRemove (date filter chip) |

**14 unique Ink DS components** on a single page.

## Agreements Page Component Usage

| Component | Count | Key Props |
|-----------|-------|-----------|
| **DocuSignShell** | 1 | globalNav, localNav |
| **AgreementTableView** | 1 | pageHeader, filterBar, paddingVariant |
| **DataTable** | 1 | columns, data, selectable, stickyHeader, showColumnControl, rowHeight="tall", pagination |
| **PageHeader** | 1 | title, actions |
| **FilterBar** | 1 | search, showSearchIndicator, filters |
| **LocalNav** | 1 | headerLabel, headerIcon, headerMenuItems, activeItemId, sections |
| **Button** | 5 | kind="brand/secondary", size="small", menuTrigger, startElement |
| **Icon** | 15+ | status-void, status-check, filter, overflow-vertical, plus, chevron-right |
| **IconButton** | 11 | variant="tertiary", overflow-vertical (per row) |
| **Text** | 22+ | size: xs/sm, weight: medium, color: secondary |
| **Stack** | 11+ | gap="none" with spacing tokens |
| **Inline** | 11+ | gap="small", align="center" |
| **Chip** | 1 | "Date: Last 6 Months" with onRemove |
| **Badge** | 3 | "New" badges on sidebar items |
| **StatusLight** | - | (available but using Icon + Text instead for status) |

## All Pages Summary

| Page | Unique Components | Total Instances |
|------|-------------------|-----------------|
| Home | 14 | 140+ |
| Agreements | 14 | 100+ |
| Insights | 10 | 40+ |
| Templates | 5 | 10+ |
| Admin | 4 | 5+ |
| **Total unique across app** | **20+** | **300+** |

## Design Tokens Used

### Spacing
- `--ink-spacing-25` (2px) — micro gaps
- `--ink-spacing-50` (4px) — tight gaps
- `--ink-spacing-100` (8px) — small
- `--ink-spacing-125` (10px) — button padding
- `--ink-spacing-150` (12px) — section gaps
- `--ink-spacing-200` (16px) — card padding
- `--ink-spacing-250` (20px) — content padding
- `--ink-spacing-300` (24px) — large gaps
- `--ink-spacing-400` (32px) — container padding
- `--ink-spacing-500` (40px) — banner padding
- `--ink-spacing-600` (48px) — illustration containers
- `--ink-spacing-700` (64px) — template thumbnails

### Colors
- `--ink-cobalt-100` (#4C00FB) — primary brand, banner gradient
- `--ink-cobalt-140` (#260559) — banner gradient end
- `--ink-cobalt-90` — link colors
- `--ink-cobalt-10` — subtle backgrounds
- `--ink-font-default` — primary text
- `--ink-font-secondary` — secondary text
- `--ink-bg-default` — page background
- `--ink-bg-secondary` — card backgrounds
- `--ink-border-subtle` — dividers, borders
- `--ink-green-80` — success status icon color

### Radius
- `--ink-radius-sm` (4px) — buttons, small elements
- `--ink-radius-md` (8px) — default cards
- `--ink-radius-lg` (12px) — large cards
- Custom 16px override for home cards

### Gradient
- `gradientBlueHaze`: `linear-gradient(174deg, var(--ink-cobalt-100) 1.48%, var(--ink-cobalt-140) 97.92%)`

## DS Component Layer Usage

```
Layer 6 - Layouts:    DocuSignShell, AgreementTableView
Layer 5 - Patterns:   GlobalNav, LocalNav, DataTable, PageHeader, FilterBar
Layer 4 - Composites: Chip, Badge
Layer 3 - Primitives: Button, Card, Icon, IconButton, Text, Heading, Avatar, StatusLight
Layer 2 - Utilities:  Stack, Inline, Grid, Container
Layer 1 - Tokens:     Spacing, Colors, Radius, Gradients
```

All 6 layers of the Ink Design System are used in the starter template.
