// The structural fingerprint that gates the whole sync loop. Pure and
// dependency-free so it can be tested without a sandbox, a model, or network.
//
// The contract: a page's skeleton must change when its STRUCTURE changes
// (columns, actions, filters, headings) and must NOT change when only its DATA
// changes (new rows, different counts, new dates). Live demo data churns every
// month; structure is what the prototype mirrors.
//
// Input is Playwright's `ariaSnapshot()` output — a YAML-ish text tree.
// (`page.accessibility.snapshot()` was REMOVED from Playwright; do not go back
// to it.)
//
// Two shapes learned from the live Docusign demo, both load-bearing:
//
//  1. SORTABLE columns are `button`, not `columnheader`. Only the checkbox,
//     the first column, and the gear are true columnheaders. A naive "skip
//     everything inside a row" rule silently drops most of the table.
//  2. Header cell names are polluted with adjacent control labels
//     ("Parties Column options for Parties Width — Parties"). The clean label
//     is the cell's first `text:` descendant.
//
//   - row "…":
//     - columnheader "Original File Name Width — Original File Name":
//       - text: Original File Name
//     - button "Parties Column options for Parties Width — Parties":
//       - text: Parties

// Roles that define a page's skeleton outside of tables.
const KEEP_ROLES = new Set([
  "heading",
  "button",
  "tab",
  "link",
  "searchbox",
  "combobox",
  "textbox",
  "checkbox",
  "switch",
  "menuitem",
  "navigation",
  "radio",
  "slider",
]);

// Roles a header row's cells can take.
const HEADER_CELL_ROLES = new Set(["columnheader", "button"]);

// Counts, dates, and totals are data — mask digits so "1,659 items" and
// "1,712 items" fingerprint identically.
const mask = (s: string) => s.trim().replace(/\d[\d,.]*/g, "#");

export interface AriaNode {
  indent: number;
  role: string;
  name: string;
}

/** Parse Playwright's ariaSnapshot text into flat nodes with indentation. */
export function parseAria(snapshot: string): AriaNode[] {
  const out: AriaNode[] = [];
  for (const raw of snapshot.split("\n")) {
    const m = /^(\s*)-\s+(.*)$/.exec(raw);
    if (!m) continue;
    // A whole entry may be single-quoted when its name contains quotes:
    //   - 'row "Acme MSA … View details"':
    let body = m[2].trim().replace(/^'(.*)':?$/, "$1");
    const roleMatch = /^([a-zA-Z][\w-]*)/.exec(body);
    if (!roleMatch) continue;
    const role = roleMatch[1];
    body = body.slice(role.length);

    let name = "";
    const quoted = /^\s+"([^"]*)"/.exec(body);
    if (quoted) {
      name = quoted[1];
    } else {
      // `- text: Parties` / `- paragraph: "Upload files…"`
      const after = /^:\s*(.*)$/.exec(body);
      if (after) name = after[1].trim().replace(/^"(.*)"$/, "$1");
    }
    out.push({ indent: m[1].length, role, name: name.trim() });
  }
  return out;
}

/** The clean label for a header cell: its first `text:` descendant, else its own name. */
function headerLabel(nodes: AriaNode[], cellIdx: number): string {
  const cell = nodes[cellIdx];
  for (let i = cellIdx + 1; i < nodes.length && nodes[i].indent > cell.indent; i++) {
    if (nodes[i].role === "text" && nodes[i].name) return nodes[i].name;
  }
  // Fall back to the raw name with the adjacent-control noise stripped.
  return cell.name
    .replace(/\s*Column options for.*$/i, "")
    .replace(/\s*Width\s*—.*$/i, "")
    .trim();
}

// Global chrome — the top bar, footer, and left sidebar — is identical on every
// page. Fingerprinting it per page means one nav change trips all ~16 pages at
// once and produces 16 near-identical PRs. So it is split out and tracked once.
// Landmarks make this deterministic: `banner` and `contentinfo` wrap the top bar
// and footer, and the sidebar is a named `navigation`. The table's pagination
// nav is deliberately NOT shell — it is part of a page's DataTable spec.
const SHELL_LANDMARKS = new Set(["banner", "contentinfo"]);
const SHELL_NAV_NAME = /side ?bar|secondary/i;

const isShellRoot = (n: AriaNode) =>
  SHELL_LANDMARKS.has(n.role) ||
  (n.role === "navigation" && (n.name === "" || SHELL_NAV_NAME.test(n.name)));

type Zone = "shell" | "content" | "outside";

interface Entry {
  value: string;
  zone: Zone;
}

function walkSkeleton(snapshot: string): Entry[] {
  const nodes = parseAria(snapshot);
  const out: Entry[] = [];
  // Indent at which the current shell subtree started, if any.
  let shellIndent: number | null = null;
  let mainIndent: number | null = null;
  // Pages without a `main` landmark (hand-rolled markup, including this
  // prototype) fall back to "everything that isn't shell is content".
  const hasMain = nodes.some((n) => n.role === "main");

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (shellIndent !== null && node.indent <= shellIndent) shellIndent = null;
    if (mainIndent !== null && node.indent <= mainIndent && node.role !== "main") {
      mainIndent = null;
    }
    if (node.role === "main") mainIndent = node.indent;
    if (shellIndent === null && isShellRoot(node)) shellIndent = node.indent;

    // Anything outside every landmark is injected tooling — dev toolbars,
    // annotation overlays, extension widgets. Observed live: an annotation
    // tool renders a top-level sibling after `contentinfo` whose accessible
    // name is 300+ characters of concatenated panel text. It is not part of
    // the design and must never reach a fingerprint.
    const zone: Zone =
      shellIndent !== null ? "shell" : !hasMain || mainIndent !== null ? "content" : "outside";

    if (node.role !== "row") {
      // Plain page structure. (Anything inside a row is handled below and
      // skipped by the index jump, so no in-row check is needed here.)
      if (KEEP_ROLES.has(node.role)) {
        out.push({ value: `${node.role}:${mask(node.name)}`, zone });
      }
      continue;
    }

    // Collect the row's subtree.
    let end = i + 1;
    while (end < nodes.length && nodes[end].indent > node.indent) end++;
    const isHeaderRow = nodes
      .slice(i + 1, end)
      .some((n) => n.role === "columnheader");

    if (isHeaderRow) {
      const cellIndent = node.indent + 2;
      for (let j = i + 1; j < end; j++) {
        if (nodes[j].indent !== cellIndent) continue;
        if (!HEADER_CELL_ROLES.has(nodes[j].role)) continue;
        const label = headerLabel(nodes, j);
        if (label) out.push({ value: `columnheader:${mask(label)}`, zone });
      }
    }
    // Data rows contribute nothing; skip the whole subtree either way.
    i = end - 1;
  }
  return out;
}

/** Ordered structural fingerprint of an aria snapshot (shell + page content).
 * Nodes outside every landmark are injected tooling and never included. */
export function skeletonOf(snapshot: string): string[] {
  return walkSkeleton(snapshot)
    .filter((e) => e.zone !== "outside")
    .map((e) => e.value);
}

/**
 * Split the fingerprint into the global chrome and this page's own content.
 * `content` is what gates a page PR; `shell` is tracked once for the whole app.
 */
export function splitSkeleton(snapshot: string): { shell: string[]; content: string[] } {
  const entries = walkSkeleton(snapshot);
  return {
    shell: entries.filter((e) => e.zone === "shell").map((e) => e.value),
    content: entries.filter((e) => e.zone === "content").map((e) => e.value),
  };
}

/** Structural delta between two fingerprints. */
export function compareSkeletons(
  fresh: string[],
  baseline: string[],
): { changed: boolean; added: string[]; removed: string[] } {
  const freshSet = new Set(fresh);
  const baseSet = new Set(baseline);
  const added = fresh.filter((x) => !baseSet.has(x));
  const removed = baseline.filter((x) => !freshSet.has(x));
  return {
    changed:
      added.length > 0 ||
      removed.length > 0 ||
      JSON.stringify(fresh) !== JSON.stringify(baseline),
    added,
    removed,
  };
}

/**
 * A capture dominated by a modal is worthless: an open dialog hides the rest of
 * the page from the accessibility tree, so the fingerprint would describe the
 * popup. Capture dismisses overlays, and this is the backstop check.
 */
export function looksLikeModalCapture(snapshot: string): boolean {
  const nodes = parseAria(snapshot);
  if (nodes.length === 0) return true;
  const hasDialog = nodes.some((n) => n.role === "dialog" || n.role === "alertdialog");
  return hasDialog && nodes.length < 40;
}

// ---------------------------------------------------------------------------
// Purpose-level matching (prototype ↔ production)
//
// The monthly gate compares production against last month's production: same
// renderer, same labels, so exact comparison is right and stays exact.
//
// Comparing the PROTOTYPE against production is a different question. A
// prototype is a cheaper artifact that mirrors PURPOSE, not markup: a nav item
// may be a `link` where production ships a `button`, and "Customize columns" is
// the same affordance as "Show or Hide Fields". Demanding exactness there
// reports false gaps and would push the prototype toward pointless busywork.
// So this comparison is deliberately fuzzy, and its output is a report for a
// human — never a gate.

const ROLE_CLASS: Record<string, string> = {
  button: "action",
  link: "action",
  menuitem: "action",
  tab: "action",
  searchbox: "input",
  textbox: "input",
  combobox: "input",
  checkbox: "control",
  switch: "control",
  radio: "control",
  slider: "control",
  heading: "heading",
  columnheader: "columnheader",
  navigation: "nav",
};

/** Collapse roles that serve the same purpose (link vs button, etc.). */
export function roleClass(role: string): string {
  return ROLE_CLASS[role] ?? role;
}

// Label noise that carries no purpose: screen-reader scaffolding, i18n keys
// that leaked into accessible names, and generic verbs.
const NAME_NOISE =
  /\b(opens in new window|current selection|icon displaying your initials|accessibilitytext|headerlabel|rowlabel|datatable|checkbox)\b/gi;

/** Normalize an accessible name for purpose comparison. */
export function normalizeName(name: string): string {
  return name
    .replace(/^[a-z]+\.[a-z.]+$/i, (s) => s.split(".").pop() ?? s) // bare i18n key
    .replace(NAME_NOISE, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\d+/g, "#")
    .trim()
    .toLowerCase();
}

const parse = (entry: string) => {
  const idx = entry.indexOf(":");
  return { cls: roleClass(entry.slice(0, idx)), name: normalizeName(entry.slice(idx + 1)) };
};

export interface PurposeMatch {
  /** Same purpose, found in both. */
  matched: Array<{ production: string; prototype: string }>;
  /** Same role-class and position, different wording — a human should judge. */
  likely: Array<{ production: string; prototype: string }>;
  /** Production has this affordance and nothing in the prototype corresponds. */
  missing: string[];
  /** Prototype-only. NEVER auto-removed: this is usually deliberate design work. */
  extra: string[];
}

const STOP = new Set(["the", "a", "of", "to", "or", "and", "per", "all", "my", "#", "on"]);
const tokenize = (s: string) => s.split(" ").filter((t) => t && !STOP.has(t));

/** Tokens count as the same word if equal, or one is a prefix of the other
 * (search/searches, column/columns). Substring matching alone is wrong:
 * "manage" appears inside "manager" but means something else. */
const sameToken = (a: string, b: string) =>
  a === b || (a.length >= 4 && b.startsWith(a)) || (b.length >= 4 && a.startsWith(b));

/** Jaccard-style overlap of two names, 0..1. */
function affinity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const shared = ta.filter((x) => tb.some((y) => sameToken(x, y))).length;
  return shared / Math.max(ta.length, tb.length);
}

/** Match two content skeletons by purpose rather than markup. */
export function matchPurpose(production: string[], prototype: string[]): PurposeMatch {
  const index = (list: string[], cls: string) => {
    let n = 0;
    return list.map((v) => (parse(v).cls === cls ? n++ : -1));
  };
  const prodColIdx = index(production, "columnheader");
  const protoColIdx = index(prototype, "columnheader");

  const left = production.map((v, i) => ({ v, i, col: prodColIdx[i], ...parse(v) }));
  const right = prototype.map((v, i) => ({
    v,
    i,
    col: protoColIdx[i],
    ...parse(v),
    taken: false,
  }));
  const result: PurposeMatch = { matched: [], likely: [], missing: [], extra: [] };

  // Best match, not first match: "Open Saved Search" should claim
  // "Saved searches" rather than the bare "Search" sitting next to it.
  const best = (p: (typeof left)[number], min: number) => {
    let pick: (typeof right)[number] | undefined;
    let score = min;
    for (const r of right) {
      if (r.taken || r.cls !== p.cls) continue;
      const a = affinity(p.name, r.name);
      if (a > score || (a === score && pick && Math.abs(r.i - p.i) < Math.abs(pick.i - p.i))) {
        score = a;
        pick = r;
      }
    }
    return pick;
  };

  const unresolved: typeof left = [];
  for (const p of left) {
    const hit = best(p, 0.49); // at least half the words correspond
    if (hit) {
      hit.taken = true;
      result.matched.push({ production: p.v, prototype: hit.v });
    } else {
      unresolved.push(p);
    }
  }

  for (const p of unresolved) {
    // Columns are matched by ORDINAL: production's 5th column is the
    // prototype's 5th column, however each is worded. Absolute list position
    // is useless here because the two pages have different node counts.
    const near =
      p.cls === "columnheader"
        ? right.find((r) => !r.taken && r.cls === "columnheader" && r.col === p.col)
        : best(p, 0.19); // a weak but real word overlap
    if (near) {
      near.taken = true;
      result.likely.push({ production: p.v, prototype: near.v });
    } else {
      result.missing.push(p.v);
    }
  }

  result.extra = right.filter((r) => !r.taken).map((r) => r.v);
  return result;
}
