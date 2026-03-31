# ProtoLab Starter

Build Docusign prototypes with AI. 63 Ink Design System components, ready to go.

## Quick Start

### Option 1: Open in VS Code (recommended)

[Open in VS Code](vscode://vscode.git/clone?url=https://github.com/akshat10-ds/protolab-starter.git)

VS Code will clone the project, recommend AI extensions (Claude Code or GitHub Copilot), and auto-connect to the ProtoLab MCP server.

### Option 2: Command line

```bash
git clone https://github.com/akshat10-ds/protolab-starter.git
cd protolab-starter
npm install
npm run dev
```

## What's Included

- **63 Ink Design System components** — buttons, inputs, modals, data tables, navigation, layouts
- **Design tokens** — colors, spacing, typography as CSS custom properties
- **DS Indigo fonts** — Docusign's brand typeface
- **ProtoLab MCP** — auto-connected AI composition intelligence

## Using with AI

Open the project in VS Code with Claude Code or GitHub Copilot. The MCP server connects automatically — just describe what you want:

> "Build me a participant portal with a table of agreements and filtering"

The AI knows all 63 components, their props, composition rules, and design tokens.

## Skills

| Skill | What it does |
|-------|-------------|
| `/deploy` | Ship your prototype to a shareable Vercel URL |
| `/fork` | Build on top of someone else's prototype |
| `/handoff` | Generate engineer handoff document |
| `/update` | Update design system components |
| `/onboard` | Verify setup and show getting-started guide |

## Browse Prototypes

See what the team has built: [ProtoLab Gallery](https://protolab-mcp.vercel.app/prototypes)

## Component Layers

| Layer | Components | Examples |
|-------|-----------|----------|
| Layouts | 2 | DocuSignShell, AgreementTableView |
| Patterns | 7 | DataTable, GlobalNav, LocalNav, PageHeader |
| Composites | 19 | Modal, Tabs, ComboBox, Accordion, Dropdown |
| Primitives | 21 | Button, Input, Card, Icon, Badge, Select |
| Utilities | 5 | Stack, Grid, Inline, Container, Spacer |
| Tokens | 1 | CSS custom properties (colors, spacing, type) |
