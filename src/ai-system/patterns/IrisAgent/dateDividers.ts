/**
 * IrisAgent — the day boundaries in a transcript, as labels.
 *
 * A conversation that runs for three weeks reads as one undifferentiated
 * column: twenty turns, nothing saying where Tuesday ended. This is the one
 * thing a text thread does that the transcript did not.
 *
 * Kept out of `IrisAgent.tsx` because it is pure and the pattern is not — the
 * grouping can be exercised on its own, with a fixed `now`, without mounting
 * anything.
 */

import type { ChatMessage } from './types';

/** Local midnight of a date — the only thing "same day" can honestly mean. */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const DAY_MS = 86_400_000;

/**
 * How a person says the day.
 *
 * Today and yesterday get their names; anything else inside the last week gets
 * its weekday, which is unambiguous only up to six days back — day seven wears
 * today's own weekday name and would read as today. Older than that is a short
 * date, and it carries the year only when the year is not this one.
 *
 * `toLocaleDateString` does the naming, so there is no month table here and the
 * reader's own locale decides — same `[]` locale argument `formatMessageTime`
 * already passes.
 */
export function dayLabel(day: Date, now: Date): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(day)) / DAY_MS);
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo > 1 && daysAgo < 7) return day.toLocaleDateString([], { weekday: 'long' });
  return day.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    ...(day.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/**
 * One entry per message: the divider label to draw ABOVE it, or `undefined`.
 *
 * Three rules, all of them the consequence of `timestamp` being optional:
 *
 * - A divider is drawn BETWEEN turns, so the first message never gets one —
 *   the transcript opens on the conversation, not on a date.
 * - A message with no timestamp joins the group above it. It is skipped, and
 *   the day it is compared against does not move, so an untimed turn sitting
 *   inside a day cannot split it.
 * - A run of messages with no timestamps therefore produces nothing at all,
 *   which is every host that has not filled the field in.
 */
export function dividerLabels(messages: ChatMessage[], now: Date = new Date()): (string | undefined)[] {
  let prevDay: Date | undefined;
  return messages.map((msg) => {
    // `new Date` because a host seeding fixtures from JSON hands over a string.
    const at = msg.timestamp ? new Date(msg.timestamp) : undefined;
    if (!at || Number.isNaN(at.getTime())) return undefined;
    const label =
      prevDay && startOfDay(prevDay) !== startOfDay(at) ? dayLabel(at, now) : undefined;
    prevDay = at;
    return label;
  });
}
