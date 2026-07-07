/**
 * Eval: button-accessible-labels skill
 *
 * Tests that Claude correctly applies the button-accessible-labels skill rules.
 * Requires ANTHROPIC_API_KEY in the environment.
 *
 * Run: npx tsx evals/button-skill.eval.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

const client = new Anthropic();

const SKILL_PATH = path.resolve(
  ".github/skills/button-accessible-labels/SKILL.md"
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

const cases: TestCase[] = [
  {
    name: "text button has label inside element",
    prompt: "Add a button to save the form.",
    check: (out) => {
      const hasInnerText = /<Button[^>]*>[^<]+<\/Button>/i.test(out);
      return {
        pass: hasInnerText,
        reason: hasInnerText
          ? "label is inside the button"
          : "expected label text inside <Button>",
      };
    },
  },
  {
    name: "icon-only button uses sr-only span",
    prompt:
      "Add a help icon button next to the 'Account Settings' heading. Use a HelpIcon.",
    check: (out) => {
      const hasSrOnly = /sr-only/i.test(out);
      const hasHelp = /help/i.test(out);
      const pass = hasSrOnly && hasHelp;
      return {
        pass,
        reason: pass
          ? "sr-only span with help label found"
          : `missing: ${!hasSrOnly ? "sr-only span" : ""}${!hasHelp ? " help label" : ""}`,
      };
    },
  },
  {
    name: "duplicate buttons same functionality — no aria-label added",
    prompt: `Two identical "Save" buttons both submit the same form. Render them.`,
    check: (out) => {
      // aria-label on same-function duplicates is NOT required per rule 6
      const ariaLabelCount = (out.match(/aria-label/g) ?? []).length;
      const pass = ariaLabelCount === 0;
      return {
        pass,
        reason: pass
          ? "no aria-label — correct for same-function duplicates"
          : "incorrectly added aria-label to same-function duplicate buttons",
      };
    },
  },
  {
    name: "duplicate buttons different functionality — numbered aria-label only",
    prompt: `Render two "Edit" buttons: the first edits the user profile, the second edits the document title. Keep visible text unchanged.`,
    check: (out) => {
      const hasEdit2 = /aria-label="Edit 2"/i.test(out);
      const visibleUnchanged = (out.match(/>Edit</g) ?? []).length >= 2;
      const pass = hasEdit2 && visibleUnchanged;
      return {
        pass,
        reason: pass
          ? 'aria-label="Edit 2" added; visible text preserved'
          : `missing: ${!hasEdit2 ? 'aria-label="Edit 2"' : ""}${!visibleUnchanged ? " visible text not preserved" : ""}`,
      };
    },
  },
  {
    name: "vague label 'Click' is not used",
    prompt: "Add a CTA button at the bottom of the page.",
    check: (out) => {
      const hasVague = />\s*(click|submit|open)\s*</i.test(out);
      return {
        pass: !hasVague,
        reason: !hasVague
          ? "no vague label found"
          : "used a vague label (Click / Submit / Open)",
      };
    },
  },
  {
    name: "three duplicate 'Delete' buttons with different targets are numbered 1-3",
    prompt: `Render three "Delete" buttons: one deletes the envelope, one deletes the document, one deletes the recipient. Keep visible text unchanged.`,
    check: (out) => {
      const hasFirst = /aria-label="Delete"/i.test(out);
      const hasSecond = /aria-label="Delete 2"/i.test(out);
      const hasThird = /aria-label="Delete 3"/i.test(out);
      const pass = hasFirst && hasSecond && hasThird;
      return {
        pass,
        reason: pass
          ? "Delete / Delete 2 / Delete 3 aria-labels found"
          : `missing: ${[!hasFirst && "Delete", !hasSecond && "Delete 2", !hasThird && "Delete 3"].filter(Boolean).join(", ")}`,
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
    console.log(`      output : ${output.slice(0, 200).replace(/\n/g, " ")}`);
  }
  return pass;
}

async function main() {
  console.log("button-accessible-labels — eval\n");
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
