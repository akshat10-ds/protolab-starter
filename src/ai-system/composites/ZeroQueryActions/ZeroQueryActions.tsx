/**
 * ZeroQueryActions — the suggested-action list on the cold state
 *
 * A column of zero-query rows: an icon and a label, 40px, at every state. The
 * row never grows and never gains a badge. Hovering it gives a light tint and
 * previews the query it would send, in the composer, via `onPreview`.
 *
 * **The row explains itself somewhere else.** That is the whole design. An
 * expanding row reflows the list under the pointer and describes a query in a
 * place the query will never appear; the composer is where it would actually be
 * typed. Bound to `:focus-visible` as well as `:hover`, so the keyboard gets it.
 *
 * **Two appearances, one row.** `plain` is the cold state — transparent, bleeding
 * out to the composer card. `card` is the nav pages (frame 94:13551) — white at
 * rest, `neutral-20` under the pointer, no bleed. Only the paint changes; the row
 * is 40px and previews into the composer either way.
 *
 * **A prompt and an agent preview in different shapes.** A prompt is a sentence
 * you send: hovering writes it into the composer, clicking sends it. An agent is
 * a mode you enter: hovering shows its slash token — `/counterparty-brief` — at
 * the head of the composer's input, its job in the placeholder after it, and
 * clicking commits that token into the box for real. The difference is felt in
 * one gesture, so no row needs a badge that names the taxonomy. Akshat,
 * 2026-08-12: "we have the icon but i don't think the icons are doing much."
 *
 * The agent used to arrive as a chip in the composer's context row. Akshat,
 * 2026-08-13: "I don't think that on hover the agent will change the chip —
 * maybe we do something in the input? like how claude does for skills in the
 * input?" Isaac had said the same: "many systems just use the slash itself to
 * demonstrate that." The token says the same thing in the place the user types,
 * and it stops fighting the agreements pill for one slot.
 *
 * A `prompt` row still sends exactly the query the hover previewed — the
 * `description` when there is one, the label when there is not. The two come
 * from one value, so they cannot say different things. Hitting an empty one
 * makes the agent ask for what it needs. Nothing is gated behind a prerequisite,
 * so a row is never disabled and never explains why it cannot run.
 *
 * Figma `ZeroQuery/Actions` (node 1:952) is superseded. It fills the row and
 * grows it to 78/96px on hover with a PROMPT/AGENT chip. Frame 79:8822 dropped
 * the fill, and Akshat dropped the growth and then the chip — the chip named our
 * taxonomy rather than the user's, repeated the icon in caps, and its `↗` read
 * "opens elsewhere" on something inert. See the 2026-08-11 note.
 */

import { Icon } from '@ink';
import styles from './ZeroQueryActions.module.css';

// =============================================================================
// Types
// =============================================================================

/**
 * What the row runs.
 *
 * - `action` — a surface affordance, e.g. "Add sources". Opens a picker rather
 *   than asking the agent anything. Previews nothing — no query to show.
 * - `prompt` — text that gets sent as a message.
 * - `agent` — a named agent run.
 */
export type ZeroQueryActionKind = 'action' | 'prompt' | 'agent';

export interface ZeroQueryActionItem {
  /** The row's visible label. Sent as the message when there is no `description`. */
  label: string;
  kind?: ZeroQueryActionKind;
  /**
   * The query this row sends, previewed in the composer on hover/focus. Omit and
   * the label is both previewed and sent — correct for `action`, a gap for the
   * others.
   */
  description?: string;
  /** Ink icon name, drawn at Ink's `small` cut. Defaults per kind below. */
  icon?: string;
  onClick?: () => void;
}

/**
 * What the row under the pointer wants shown in the composer.
 *
 * One shape for both kinds, because the composer reads one channel. `text` is
 * always the placeholder. `token` is the agent's slash token — `/agent-name`,
 * drawn at the head of the input — and only an `agent` row carries one.
 */
export interface ZeroQueryPreview {
  kind: ZeroQueryActionKind;
  /** The placeholder. A prompt's query; an agent's job. */
  text: string;
  /**
   * The slash token for the composer's input, leading `/` included. `agent`
   * rows only. The hover draws it; a click commits this exact string, so the
   * two cannot say different things.
   */
  token?: string;
}

export interface ZeroQueryActionsProps {
  items: ZeroQueryActionItem[];
  /**
   * Called with the row's query — its `description`, or its label when it has no
   * description — when the row has no `onClick` of its own. This is the same
   * string `onPreview` showed, never a shorter one.
   *
   * `prompt` rows only. An agent is not a sentence, so an agent row never sends.
   */
  onSend: (query: string) => void;
  /**
   * An `agent` row was clicked and carries no `onClick` of its own — commit the
   * token the hover showed into the composer. Nothing is sent.
   *
   * Omit it and such a row does nothing. That is deliberate: falling back to
   * `onSend` would send a message the hover never promised.
   */
  onAttach?: (preview: ZeroQueryPreview) => void;
  /** Stagger the rows in on mount, matching the cold state's entrance. */
  animateIn?: boolean;
  /**
   * The row under the pointer (or keyboard focus) wants itself previewed.
   * Called with what to show, and with `null` when the row is left.
   *
   * The host decides where it goes. In `IrisAgent` the `text` becomes the
   * composer's placeholder and the `token` is drawn at the head of the input,
   * so the preview appears in the box the row would act on — the row explains
   * itself without growing.
   */
  onPreview?: (preview: ZeroQueryPreview | null) => void;
  /**
   * How the row is painted.
   *
   * - `plain` — transparent at rest, tinted on hover, label at `font-color-default`.
   *   The cold state. The row bleeds out to the composer card's edge.
   * - `card` — white at rest, `neutral-20` on hover, label Medium at
   *   `font-color-neutral-subtle`, 4px between rows, no bleed. The nav pages
   *   (frame 94:13551), where the list is the page rather than a tail on it.
   *
   * A variant, not a change of default: the cold state keeps `plain`.
   */
  appearance?: 'plain' | 'card';
}

// =============================================================================
// Constants
// =============================================================================

/*
 * Per-kind defaults, deliberately conservative.
 *
 * The *design* calls for Ink's small cuts — `comment-small` for a prompt, a
 * message; `ai-flow-small` for an agent, a process. They are not the defaults
 * here, because this file is live-linked into every prototype and those two
 * glyphs currently exist in exactly one prototype's vendored Ink. A default
 * naming an icon a consumer does not have renders nothing at all.
 *
 * So the defaults name glyphs every snapshot carries, and a surface that has
 * the small cuts passes them explicitly — the panel does. Promote them here
 * once the small cuts ship in Ink proper.
 */
const DEFAULT_ICON: Record<ZeroQueryActionKind, string> = {
  action: 'plus',
  prompt: 'comment',
  agent: 'flash',
};

/**
 * What a row draws when it declares neither `icon` nor `kind`.
 *
 * Not `DEFAULT_ICON.action`. Three prototypes pass the shared
 * `SAMPLE_SUGGESTIONS` fixture, which carries no icons, and every one of them
 * drew `suggestion-arrow` before this component existed. Defaulting an
 * un-kinded row to `plus` would have changed all three through the live link.
 * Declaring a kind opts into that kind's icon; declaring nothing keeps the arrow.
 */
const UNTYPED_ICON = 'suggestion-arrow';

/**
 * An agent's label as a slash token: "Counterparty brief" → `/counterparty-brief`.
 *
 * Same kebab rule `ChatInput` uses when it inserts a command, so a token from a
 * row and one from the `/` menu read alike.
 */
function slashToken(label: string): string {
  return `/${label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
}

// =============================================================================
// Component
// =============================================================================

export function ZeroQueryActions({
  items,
  onSend,
  onAttach,
  animateIn = false,
  onPreview,
  appearance = 'plain',
}: ZeroQueryActionsProps) {
  if (items.length === 0) return null;

  return (
    <div className={`${styles.list} ${appearance === 'card' ? styles.listCard : ''}`}>
      {items.map((item, i) => {
        const kind = item.kind ?? 'action';
        /*
         * The one string this row stands for. On a `prompt` the preview shows it
         * and the click sends it, from this single value — they were two
         * expressions before, and they drifted: the composer read out the
         * description while the click sent the short label. On an `agent` it is
         * the job the placeholder states.
         *
         * An `action` opens a picker rather than asking anything, so it previews
         * nothing — there is no query to show.
         */
        const query = item.description ?? item.label;
        const icon = item.icon ?? (item.kind ? DEFAULT_ICON[item.kind] : UNTYPED_ICON);

        /*
         * Two kinds, two shapes.
         *
         * A prompt previews the sentence it sends. An agent previews its
         * *token*: `/counterparty-brief` at the head of the composer's input,
         * the job it does in the placeholder after it — because clicking it
         * enters a mode rather than sending a sentence.
         */
        const preview: ZeroQueryPreview | null =
          kind === 'action'
            ? null
            : kind === 'agent'
              ? { kind, text: query, token: slashToken(item.label) }
              : { kind, text: query };

        return (
          <button
            key={item.label}
            type="button"
            className={`${styles.row} ${animateIn ? styles.animateIn : ''}`}
            data-kind={kind}
            onClick={() => {
              // The host's own handler always wins — it is how a surface makes
              // an agent row switch agents rather than attach one.
              if (item.onClick) return item.onClick();
              if (kind === 'agent') {
                if (preview) onAttach?.(preview);
                return;
              }
              onSend(query);
            }}
            onMouseEnter={() => onPreview?.(preview)}
            onMouseLeave={() => onPreview?.(null)}
            onFocus={() => onPreview?.(preview)}
            onBlur={() => onPreview?.(null)}
            style={animateIn ? { animationDelay: `${150 + i * 50}ms` } : undefined}
          >
            {/*
              `small`, always. Ink ships a small and a large cut of each glyph
              and this surface uses the small one — a 16px mark in a 24px box,
              which is what the frames draw.
            */}
            <span className={styles.icon} aria-hidden="true">
              <Icon name={icon as never} size="small" />
            </span>

            {/*
              No type chip.

              It named the kind — PROMPT, AGENT — which is our taxonomy, not the
              user's; it repeated in caps what the icon already says; and its `↗`
              read "opens elsewhere" on something that did not open anything.

              A "See all" in its place was considered and rejected: these rows
              *do* something, a see-all *goes* somewhere, and mixing the two
              makes the list harder to read. The composer is the see-all — in a
              chat surface anything you could browse to, you can ask for. The
              rows are examples, not a menu.
            */}
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
