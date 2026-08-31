import { defineSchedule } from "eve/schedules";

// Compiled by `eve build` into a Vercel Cron Job (entries land in
// .vercel/output/config.json — nothing to hand-configure).
export default defineSchedule({
  // 09:00 UTC on the 1st of every month.
  cron: "0 9 1 * *",
  markdown: `Run the monthly protolab sync.

Follow your instructions end to end: call setup_workspace once, then for every
page in specs/pages.json with sync=true and a real demoUrl, capture, diff, and
— only if changed — regenerate the view and open a PR. Finish with the run
summary (checked / unchanged / changed with PR links / skipped).`,
});
