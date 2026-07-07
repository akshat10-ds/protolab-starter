/**
 * Eval: no-nested-tables skill
 *
 * Tests that Claude correctly applies the no-nested-tables skill rules.
 * Requires ANTHROPIC_API_KEY in the environment.
 *
 * Run: npx tsx evals/no-nested-tables.eval.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic();

const SKILL_PATH = path.resolve(
  ".github/skills/no-nested-tables/SKILL.md"
);
const skill = fs.readFileSync(SKILL_PATH, "utf-8");

const SYSTEM = `You are a React/TypeScript UI developer applying the following skill:

${skill}

When given a task, output ONLY the updated JSX/TSX code with no explanation.`;

interface TestCase {
  name: string;
  prompt: string;
  check: (output: string) => { pass: boolean; reason: string };
}

/**
 * Returns true if a table root (<table> or DataTable) appears as a descendant
 * of any other table element. Normal table structure (tbody inside table, tr
 * inside tbody, etc.) is NOT a violation — only a full table nested inside
 * another table's DOM tree is.
 */
function hasNestedTable(code: string): boolean {
  const tableElements = new Set([
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "datatable",
  ]);
  // Only these count as a "new table root" that triggers a violation when nested
  const tableRoots = new Set(["table", "datatable"]);

  const events: { pos: number; type: "open" | "close"; tag: string; selfClose: boolean }[] = [];

  let m: RegExpExecArray | null;

  const openRe = /<(table|thead|tbody|tfoot|tr|td|th|DataTable)(?:\s[^>]*)?\s*\/?>/gi;
  while ((m = openRe.exec(code)) !== null) {
    events.push({
      pos: m.index,
      type: "open",
      tag: m[1].toLowerCase(),
      selfClose: m[0].endsWith("/>"),
    });
  }

  const closeRe = /<\/(table|thead|tbody|tfoot|tr|td|th|DataTable)>/gi;
  while ((m = closeRe.exec(code)) !== null) {
    events.push({ pos: m.index, type: "close", tag: m[1].toLowerCase(), selfClose: false });
  }

  events.sort((a, b) => a.pos - b.pos);

  const stack: string[] = [];

  for (const evt of events) {
    if (evt.type === "open") {
      // Violation: a table root opened while any table element is on the stack
      if (tableRoots.has(evt.tag) && stack.some((t) => tableElements.has(t))) {
        return true;
      }
      if (!evt.selfClose) {
        stack.push(evt.tag);
      }
    } else {
      const idx = stack.lastIndexOf(evt.tag);
      if (idx !== -1) stack.splice(idx, 1);
    }
  }

  return false;
}

const cases: TestCase[] = [
  {
    name: "clean table — no nesting introduced",
    prompt: `Render a simple HTML table with two columns: Name and Email. Include two data rows.`,
    check: (out) => {
      const nested = hasNestedTable(out);
      return {
        pass: !nested,
        reason: !nested
          ? "no nested table elements"
          : "introduced nested table elements in a clean table",
      };
    },
  },
  {
    name: "nested DataTable inside td — must be extracted",
    prompt: `Fix this code so it follows the no-nested-tables rule:

\`\`\`tsx
<table>
  <tbody>
    <tr>
      <td>
        <DataTable columns={cols} data={rows} />
      </td>
    </tr>
  </tbody>
</table>
\`\`\``,
    check: (out) => {
      const nested = hasNestedTable(out);
      return {
        pass: !nested,
        reason: !nested
          ? "DataTable extracted out of <td>"
          : "DataTable still nested inside a table element",
      };
    },
  },
  {
    name: "nested table inside td — must be extracted",
    prompt: `Fix this code so it follows the no-nested-tables rule:

\`\`\`html
<table>
  <tbody>
    <tr>
      <td>
        <table>
          <tr><td>inner</td></tr>
        </table>
      </td>
    </tr>
  </tbody>
</table>
\`\`\``,
    check: (out) => {
      const nested = hasNestedTable(out);
      return {
        pass: !nested,
        reason: !nested
          ? "inner table extracted from <td>"
          : "inner table still nested inside a table element",
      };
    },
  },
  {
    name: "DataTable inside DataTable — must be extracted",
    prompt: `Fix this code so it follows the no-nested-tables rule:

\`\`\`tsx
<DataTable columns={outerCols} data={outerData}>
  <DataTable columns={innerCols} data={innerData} />
</DataTable>
\`\`\``,
    check: (out) => {
      // After fix, the two DataTables should be siblings (not nested)
      const nested = hasNestedTable(out);
      const hasBoth = (out.match(/DataTable/g) ?? []).length >= 2;
      const pass = !nested && hasBoth;
      return {
        pass,
        reason: pass
          ? "DataTables are now siblings"
          : !hasBoth
          ? "one DataTable was removed rather than extracted"
          : "DataTable still nested inside another DataTable",
      };
    },
  },
  {
    name: "correctly structured sibling tables — no changes needed",
    prompt: `Review this code for the no-nested-tables rule and return it unchanged if it is already correct:

\`\`\`tsx
<DataTable columns={summaryColumns} data={summaryData} />
<DataTable columns={detailColumns} data={detailData} />
\`\`\``,
    check: (out) => {
      const nested = hasNestedTable(out);
      const hasBoth = (out.match(/DataTable/g) ?? []).length >= 2;
      const pass = !nested && hasBoth;
      return {
        pass,
        reason: pass
          ? "sibling DataTables preserved without nesting"
          : "incorrectly modified valid sibling tables",
      };
    },
  },
  {
    name: "deeply nested table inside tbody — must be extracted",
    prompt: `Fix this code so it follows the no-nested-tables rule:

\`\`\`tsx
<table>
  <tbody>
    <tr>
      <td>
        <div>
          <table>
            <tbody>
              <tr><td>deep</td></tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  </tbody>
</table>
\`\`\``,
    check: (out) => {
      const nested = hasNestedTable(out);
      return {
        pass: !nested,
        reason: !nested
          ? "deeply nested table extracted"
          : "table element still nested inside another table element",
      };
    },
  },
];

async function runCase(tc: TestCase): Promise<boolean> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: SYSTEM,
    messages: [{ role: "user", content: tc.prompt }],
  });

  const output =
    response.content[0].type === "text" ? response.content[0].text : "";
  const { pass, reason } = tc.check(output);

  const icon = pass ? "✓" : "✗";
  console.log(`  ${icon} ${tc.name}`);
  if (!pass) {
    console.log(`      reason : ${reason}`);
    console.log(`      output : ${output.slice(0, 300).replace(/\n/g, " ")}`);
  }
  return pass;
}

async function main() {
  console.log("no-nested-tables — eval\n");
  let passed = 0;

  for (const tc of cases) {
    const ok = await runCase(tc);
    if (ok) passed++;
  }

  const total = cases.length;
  console.log(`\n${passed}/${total} passed`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
