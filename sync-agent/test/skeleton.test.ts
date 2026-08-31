import { test } from "node:test";
import assert from "node:assert/strict";
import {
  compareSkeletons,
  looksLikeModalCapture,
  skeletonOf,
  matchPurpose,
  splitSkeleton,
} from "../agent/lib/skeleton.ts";

// Fixtures are in Playwright `ariaSnapshot()` format — the real capture output.
// Stand-in for the Navigator "Completed" page: header, actions, filters, and a
// table whose rows are live data.
const page = (opts: {
  totalItems: number;
  rows: Array<{ name: string; date: string }>;
  extraColumn?: string;
  extraAction?: string;
}) =>
  [
    `- heading "Completed" [level=1]`,
    `- button "Documents"`,
    ...(opts.extraAction ? [`- button "${opts.extraAction}"`] : []),
    `- searchbox "Search agreements"`,
    `- button "${opts.totalItems.toLocaleString("en-US")} items"`,
    `- table "Agreements":`,
    `  - row:`,
    `    - columnheader "Name"`,
    `    - columnheader "Date"`,
    ...(opts.extraColumn ? [`    - columnheader "${opts.extraColumn}"`] : []),
    ...opts.rows.flatMap((r) => [
      `  - row "${r.name}":`,
      `    - checkbox "Select ${r.name}"`,
      `    - link "${r.name}"`,
      `    - cell "${r.date}"`,
    ]),
  ].join("\n");

const january = page({
  totalItems: 1659,
  rows: [
    { name: "Acme MSA", date: "Jan 3, 2026" },
    { name: "Globex NDA", date: "Jan 7, 2026" },
  ],
});

test("data churn does not trip the gate", () => {
  // A month later: more agreements, a higher count, newer dates. Nothing
  // structural moved, so the prototype must not be touched.
  const february = page({
    totalItems: 1712,
    rows: [
      { name: "Initech SOW", date: "Feb 2, 2026" },
      { name: "Umbrella MSA", date: "Feb 11, 2026" },
      { name: "Stark Licence", date: "Feb 19, 2026" },
    ],
  });

  const result = compareSkeletons(skeletonOf(february), skeletonOf(january));
  assert.equal(result.changed, false, "row and count churn must not count as a change");
});

test("a new column trips the gate and is named", () => {
  const withStatus = page({
    totalItems: 1712,
    rows: [{ name: "Acme MSA", date: "Jan 3, 2026" }],
    extraColumn: "Status",
  });

  const result = compareSkeletons(skeletonOf(withStatus), skeletonOf(january));
  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ["columnheader:Status"]);
});

test("a new page action trips the gate", () => {
  const withAction = page({
    totalItems: 1659,
    rows: [{ name: "Acme MSA", date: "Jan 3, 2026" }],
    extraAction: "Ask Iris",
  });

  const result = compareSkeletons(skeletonOf(withAction), skeletonOf(january));
  assert.equal(result.changed, true);
  assert.deepEqual(result.added, ["button:Ask Iris"]);
});

test("a removed filter is reported as removed", () => {
  const noSearch = january
    .split("\n")
    .filter((l) => !l.includes("searchbox"))
    .join("\n");

  const result = compareSkeletons(skeletonOf(noSearch), skeletonOf(january));
  assert.equal(result.changed, true);
  assert.deepEqual(result.removed, ["searchbox:Search agreements"]);
});

test("row-level controls are excluded, page-level ones kept", () => {
  const skeleton = skeletonOf(january);
  // Per-row "Select <name>" checkboxes and links are data, not structure.
  assert.ok(!skeleton.some((s) => s.startsWith("checkbox:")));
  assert.ok(!skeleton.some((s) => s.includes("Acme MSA")));
  // Column headers survive even though they live inside a header row.
  assert.ok(skeleton.includes("columnheader:Name"));
  // Page-level controls survive.
  assert.ok(skeleton.includes("searchbox:Search agreements"));
});

test("counts are masked so totals never leak into the fingerprint", () => {
  const skeleton = skeletonOf(january);
  assert.ok(skeleton.includes("button:# items"));
  assert.ok(!skeleton.some((s) => s.includes("1,659")));
});

test("attributes and unnamed nodes parse without breaking", () => {
  const skeleton = skeletonOf(
    ['- heading "Completed" [level=1]', "- status", "- img", '- button "Start"'].join("\n"),
  );
  assert.deepEqual(skeleton, ["heading:Completed", "button:Start"]);
});

test("modal-dominated captures are detected", () => {
  // Verbatim shape of the real promo modal seen on the Navigator page: an open
  // dialog hides the rest of the page from the accessibility tree.
  const modal = [
    "- status",
    '- dialog "Get more value from your agreements":',
    '  - button "Close"',
    "  - img",
    '  - heading "Get more value from your agreements" [level=2]',
    '  - button "Start"',
    "- status",
  ].join("\n");

  assert.equal(looksLikeModalCapture(modal), true);
  assert.equal(looksLikeModalCapture(january), false);
  assert.equal(looksLikeModalCapture(""), true, "an empty capture is never valid");
});

test("sortable columns exposed as buttons are captured as column headers", () => {
  // Verbatim shape from the live Navigator table: only some header cells are
  // `columnheader`; the sortable ones are `button`, and every name is polluted
  // with adjacent control labels.
  const realHeader = [
    "- table:",
    "  - rowgroup:",
    '    - row "DataTable.Checkbox.HeaderLabelSelectAll Original File Name Parties Status":',
    '      - columnheader "DataTable.Checkbox.HeaderLabelSelectAll":',
    '        - checkbox "DataTable.Checkbox.HeaderLabelSelectAll"',
    '      - columnheader "Original File Name Width — Original File Name":',
    "        - text: Original File Name",
    '        - separator "Width — Original File Name"',
    '      - button "Parties Column options for Parties Width — Parties":',
    "        - text: Parties",
    '        - button "Column options for Parties"',
    '      - button "Status Column options for Status Width — Status":',
    "        - text: Status",
    "      - columnheader",
    '      - columnheader "Show or Hide Fields":',
    '        - button "Show or Hide Fields"',
    "  - rowgroup:",
    `    - 'row "DataTable.Checkbox.RowLabelSelect Acme MSA View details Active"':`,
    '      - cell "DataTable.Checkbox.RowLabelSelect"',
    '      - button "More Actions - Acme MSA"',
  ].join("\n");

  const skeleton = skeletonOf(realHeader);
  assert.deepEqual(skeleton, [
    "columnheader:DataTable.Checkbox.HeaderLabelSelectAll",
    "columnheader:Original File Name",
    "columnheader:Parties",
    "columnheader:Status",
    "columnheader:Show or Hide Fields",
  ]);
  // The data row's per-row action button must not leak into the fingerprint.
  assert.ok(!skeleton.some((s) => s.includes("Acme MSA")));
});

test("global chrome is split out of the page fingerprint", () => {
  // Landmark shape from the live site: top bar in `banner`, sidebar as a named
  // navigation inside `main`, footer in `contentinfo`. Pagination is a named
  // navigation too but belongs to the page, not the chrome.
  const snapshot = [
    "- banner:",
    "  - navigation:",
    '    - button "Home"',
    '    - button "Agreements"',
    "- main:",
    '  - navigation "navigation side bar":',
    '    - button "All Agreements"',
    '    - button "Completed"',
    '  - heading "Completed Documents" [level=1]',
    '  - button "Ask Iris"',
    '  - navigation "DataTable.Footer.AccessibilityText":',
    '    - button "Go to next page"',
    "- contentinfo:",
    '  - link "Privacy"',
  ].join("\n");

  const { shell, content } = splitSkeleton(snapshot);

  assert.deepEqual(shell, [
    "navigation:",
    "button:Home",
    "button:Agreements",
    "navigation:navigation side bar",
    "button:All Agreements",
    "button:Completed",
    "link:Privacy",
  ]);
  assert.deepEqual(content, [
    "heading:Completed Documents",
    "button:Ask Iris",
    "navigation:DataTable.Footer.AccessibilityText",
    "button:Go to next page",
  ]);
  // Every node lands in exactly one bucket.
  assert.equal(shell.length + content.length, skeletonOf(snapshot).length);
});

test("a nav-only change moves the shell, not any page", () => {
  const withNav = (extra) =>
    [
      "- banner:",
      "  - navigation:",
      '    - button "Home"',
      ...(extra ? [`    - button "${extra}"`] : []),
      "- main:",
      '  - heading "Completed Documents" [level=1]',
    ].join("\n");

  const before = splitSkeleton(withNav(null));
  const after = splitSkeleton(withNav("Automations"));

  assert.equal(compareSkeletons(after.content, before.content).changed, false);
  assert.deepEqual(compareSkeletons(after.shell, before.shell).added, ["button:Automations"]);
});

test("purpose matching ignores markup differences a prototype is allowed to have", () => {
  const production = [
    "button:Home",
    "columnheader:Original File Name",
    "columnheader:Show or Hide Fields",
    "button:Go to next page",
    "combobox:Results per page",
    "button:Add Documents",
  ];
  const prototype = [
    "link:Home", // role drift — same purpose
    "columnheader:Original File Name", // exact
    "columnheader:Customize columns", // different words, same slot
    "button:Next page", // containment
    "combobox:Items per page", // different words, same slot
    "button:Dark mode", // prototype-only
  ];

  const m = matchPurpose(production, prototype);
  const pairs = m.matched.map((x) => `${x.production} => ${x.prototype}`);
  assert.ok(pairs.includes("button:Home => link:Home"), "role drift must not be a gap");
  assert.ok(pairs.includes("button:Go to next page => button:Next page"));

  // Genuinely absent from the prototype.
  assert.deepEqual(m.missing, ["button:Add Documents"]);
  // A real shared word ("page") is enough to be confident.
  assert.ok(pairs.includes("combobox:Results per page => combobox:Items per page"));
  // No shared word at all, but the same column slot — flagged for judgement,
  // never silently treated as missing.
  const likely = m.likely.map((x) => x.production);
  assert.ok(likely.includes("columnheader:Show or Hide Fields"));
  // Prototype-only affordances are surfaced, never treated as errors.
  assert.deepEqual(m.extra, ["button:Dark mode"]);
});

test("injected dev tooling outside all landmarks is ignored", () => {
  const snapshot = [
    "- banner:",
    '  - button "Home"',
    "- main:",
    '  - heading "Completed" [level=1]',
    "- contentinfo:",
    '  - link "Privacy"',
    // An annotation overlay injected as a top-level sibling.
    '- button "v#.#.# Output Detail Marker Color Clear on copy/send Manage MCP & Webhooks":',
    '  - button ""',
    '- button "Switch to light mode"',
  ].join("\n");

  const { shell, content } = splitSkeleton(snapshot);
  assert.deepEqual(content, ["heading:Completed"]);
  assert.deepEqual(shell, ["button:Home", "link:Privacy"]);
  assert.ok(!skeletonOf(snapshot).some((s) => /Marker Color|light mode/.test(s)));
});
