# Evals

Opt-in checks that the `.github/skills/` rules actually hold. They are **not**
part of `npm run dev`, `npm run build`, or CI — nothing under `src/` imports
them, and `tsconfig.json` only includes `src`.

Their two dependencies (`tsx`, `@anthropic-ai/sdk`) are deliberately **not** in
`devDependencies`, so a normal `npm install` stays lean. The eval scripts
install them on demand into `node_modules` without touching `package-lock.json`.

## Running

Requires `ANTHROPIC_API_KEY` in your environment.

```bash
npm run eval:button    # button-accessible-labels skill
npm run eval:tables    # no-nested-tables skill
```

The first run pulls `tsx` and `@anthropic-ai/sdk` (~30 packages, including a
second copy of esbuild). Nothing else in the repo needs them.

## Skills

The skills themselves are plain markdown under `.github/skills/` and
`.github/instructions/`. They cost nothing and are always available — agents
pick them up whether or not you ever run these evals.
