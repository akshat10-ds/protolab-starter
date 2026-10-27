/**
 * ArtifactDock — the one right-hand surface for every artifact.
 *
 * Akshat: "can we use a similar container as what we have on the left (nav)
 * for right? we'll use that for all artifacts." So the dock is the same box as
 * `IrisAgent`'s `.menuDockedSidebar` — white fill, hairline border, radius s,
 * 8px clear of the header and the bottom, 16px in from the outer edge — only
 * wider (420 against 338), because tables and agreements live in it.
 *
 * It replaces three components that fought over one slot and drew three
 * frames with up to three stacked close buttons. The dock has ONE frame, ONE
 * close, ONE back arrow. It does NOT compose `ArtifactViewer`: that part draws
 * its own border and its own close, which is the nested chrome being removed.
 *
 * THE DOCK IS A FRAME, NOT A COMPONENT WITH VARIANTS. Akshat, 2026-08-13: "the
 * pane is sort of like the artifacts panel can be used dynamically for showing
 * agreements, showing a document editor, showing data tables, etc." So this
 * file owns four things and no more:
 *
 *   the box · the universal 73px header · the tab strip · the region below
 *
 * Everything inside that region is a RENDERER, looked up by kind in
 * `artifactRenderers.tsx`. A renderer may contribute header actions, and it
 * owns its own 48px toolbar — frames 158:18134 and 163:21261 encode exactly
 * that: the agreement has a toolbar, the table has none. The dock never names
 * a kind; the registry is the only place one appears.
 *
 * The host owns all state — which items exist, which one is open, and whether
 * the chat column is collapsed (`artifactExpanded` on `IrisAgent`). The dock
 * renders as a bare sibling in `artifactSlot`; `IrisAgent` styles it in no way,
 * so the dock owns its whole box.
 *
 * Once the panel is the whole screen the box changes: the card becomes a pane —
 * flush right, full height, one hairline on its left edge. The dock decides that
 * for itself from the panel's width; see the container query in its CSS.
 */

import React from 'react';
import { Breadcrumb, Icon, IconButton } from '@ink';
import { ARTIFACT_RENDERERS } from './artifactRenderers';
import styles from './ArtifactDock.module.css';
import type { ArtifactActionHandler, ArtifactItem, ArtifactKind } from './types';

// The model and the renderer contract moved to `types.ts`, so a renderer can
// name them without importing the dock. Re-exported here: this was their home,
// and `@ai` and every host import them from this path.
export type {
  ArtifactActionHandler,
  ArtifactItem,
  ArtifactKind,
  ArtifactProcess,
  ArtifactProcessStep,
  ArtifactRecommendation,
  ArtifactRenderContext,
  ArtifactRenderer,
  ArtifactSection,
  ArtifactSource,
  ArtifactTable,
  ArtifactTableCell,
  ArtifactTableColumn,
  ArtifactTableRow,
  ArtifactTableStatus,
} from './types';

// =============================================================================
// Props
// =============================================================================

export interface ArtifactDockProps {
  /** Every artifact in the conversation. */
  items: ArtifactItem[];
  /** Id of the open item. `null` — or an id not in `items` — renders nothing. */
  openId: string | null;
  /** Open another item (tab, back, source row) or close (`null`). */
  onOpenChange: (id: string | null) => void;
  /** Mirrors IrisAgent's `artifactExpanded` — the dock fills the surface. */
  expanded?: boolean;
  /** Renders the expand/contract control when supplied. */
  onToggleExpand?: () => void;
  /** A source row was clicked. The host opens the matching `document` item. */
  onSourceOpen?: (sourceId: string) => void;
  /**
   * Every other control, header and renderer alike, reports here: `download`,
   * `open-in-navigator`, `search`, `row-menu`, `fields`. One hook, because the
   * dock has no opinion about any of them — it only says which was pressed.
   */
  onAction?: ArtifactActionHandler;
  /**
   * Dock width in px when not expanded. Omit it and the CSS owns the width —
   * 420 as a card, a 520 basis as a pane. Supply it and the host wins in both
   * states, because an inline style beats the stylesheet.
   *
   * `IrisAgent` supplies it for the pane, from the open artifact's kind
   * (`PANE_SIZE`) and from the divider between the chat and this pane. It is
   * applied to `flex-basis` as well as `width`: as a pane the dock has a
   * definite basis from the CSS, and a definite basis outranks `width`.
   */
  width?: number;
}

/**
 * Tab icons. Every name here is in all six prototypes' `iconPaths.ts` — no
 * substitutes. `markdown` and `document` share a glyph on purpose: they differ
 * in how they render, not in what they are.
 *
 * The header no longer draws one. Frames 158:18134 and 163:21261 give the 73px
 * header a title and nothing else in front of it; the tab strip is where a kind
 * is still named, and there the icon is doing navigation work.
 */
const KIND_ICON: Record<ArtifactKind, string> = {
  markdown: 'document',
  table: 'table',
  document: 'document',
  sources: 'folder',
  visualization: 'chart-bar',
  process: 'check',
};

// =============================================================================
// Component
// =============================================================================

export const ArtifactDock: React.FC<ArtifactDockProps> = ({
  items,
  openId,
  onOpenChange,
  expanded = false,
  onToggleExpand,
  onSourceOpen,
  onAction,
  width,
}) => {
  const active = items.find((item) => item.id === openId);
  if (!active) return null;

  const renderer = ARTIFACT_RENDERERS[active.kind];
  const context = { item: active, onAction, onSourceOpen };

  /*
    Where back goes.
    
    `parentId` first: the host names the item this one was reached through, so a
    document opened out of a search table returns to that table rather than to
    whatever sources list happens to be lying around.

    The sources fallback is the older behaviour, kept because it still holds
    where no route was recorded — a document reached from a sources list, with
    that list's presence in `items` as the only signal.
  */
  const parentItem = items.find((i) => i.id === active.parentId);
  const backItem =
    parentItem ??
    (active.kind === 'document' ? items.find((i) => i.kind === 'sources') : undefined);

  /*
    IS THE TAB STRIP JUST THE BREADCRUMB AGAIN?

    Where a trail is drawn and the only two things this conversation opened ARE
    that trail, the strip under the header repeats the header's own two labels
    in a second navigation idiom. `parentItem` and `active` are both in `items`
    and are not each other, so `items.length === 2` proves the pair is exactly
    the trail — and `data-crumbed='trail'` says so to the CSS, which is what
    gates the strip (the pane/card split is a `[data-fullscreen]` ancestor the
    dock cannot see from here).

    NOT a blanket suppression. A conversation can open unrelated artifacts —
    attached sources, then a search table, then a document out of it — and the
    breadcrumb only names one route. With a third tab in the strip, the strip
    is the only way back to the artifact that is not on the trail, so it stays.
  */
  const crumbState = parentItem ? (items.length === 2 ? 'trail' : '') : undefined;

  return (
    <div
      className={styles.dock}
      /*
       * Inline only when the host asked for a width. The default used to be a
       * `420` prop default, which put an inline style on every dock and made the
       * pane's wider CSS width unreachable — an inline style beats a container
       * query. The default lives in the CSS now; this is the host's override.
       */
      style={expanded || width === undefined ? undefined : { width, flexBasis: width }}
      data-expanded={expanded || undefined}
    >
      {/*
        Akshat, 2026-08-19: "we do need breadcrumb before the agreement name to
        go back to the search results." The route the host recorded IS the
        trail, so where one exists the breadcrumb is the title — no arrow, no
        separate title string.

        TWO CONDITIONS, AND BOTH ARE THE FRAME'S.

        `parentId` — the host naming the route it opened this through. The
        sources fallback below is a guess, and a guess is not a trail, so an
        artifact reached without a named parent keeps the arrow-and-title header
        it has today rather than wearing a one-crumb breadcrumb.

        Fullscreen — every frame that draws the trail draws it in the PANE
        (206:27620 is 987 wide). Measured in the 420 card the two crumbs get
        111px between "Open in Navigator" and three icon buttons: Ink wraps them
        to 92px inside a 73px header, and forced onto one line they ellipsise to
        "Sear… › Acti…". Neither is a route anyone can read. The card keeps the
        arrow, which is the same journey in the room there is. Whether the card
        should ever carry a trail is Akshat's to settle; until he does, this
        draws only where the frame does.
      */}
      <header className={styles.header} data-crumbed={crumbState}>
        {parentItem && (
          <Breadcrumb
            className={styles.crumbs}
            items={[
              // Ink only makes a crumb clickable when it has an href; the click
              // is intercepted and routed through `onItemClick`, so the hash is
              // never followed.
              { label: parentItem.title, href: `#${parentItem.id}` },
              { label: active.title, current: true },
            ]}
            onItemClick={() => onOpenChange(parentItem.id)}
          />
        )}

        {backItem && (
          <IconButton
            className={styles.back}
            icon="arrow-left"
            size="small"
            variant="tertiary"
            onClick={() => onOpenChange(backItem.id)}
            aria-label={`Back to ${backItem.title}`}
          />
        )}

        {/* Title alone — no kind icon, no subtitle. The frames draw one line. */}
        <span className={styles.title}>{active.title}</span>

        {renderer.HeaderActions && <renderer.HeaderActions {...context} />}

        <IconButton
          icon="download"
          size="small"
          variant="tertiary"
          onClick={() => onAction?.('download', active)}
          aria-label={`Download ${active.title}`}
        />

        {onToggleExpand && (
          <IconButton
            icon={expanded ? 'arrows-in' : 'arrows-out'}
            size="small"
            variant="tertiary"
            onClick={onToggleExpand}
            aria-label={expanded ? 'Contract artifact' : 'Expand artifact'}
          />
        )}

        <IconButton
          icon="close"
          size="small"
          variant="tertiary"
          onClick={() => onOpenChange(null)}
          aria-label="Close artifact"
        />
      </header>

      {items.length > 1 && (
        <div
          className={styles.tabStrip}
          role="tablist"
          aria-label="Artifacts"
          onKeyDown={(e) => {
            // Roving tabindex: only the open tab is in the tab order, and the
            // arrows move between them. Selection follows focus, which is the
            // correct behaviour here — every tab is already loaded.
            const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            const at = items.findIndex((i) => i.id === active.id);
            const next = items[(at + step + items.length) % items.length];
            onOpenChange(next.id);
            (e.currentTarget.children[items.indexOf(next)] as HTMLElement | undefined)?.focus();
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === active.id}
              tabIndex={item.id === active.id ? 0 : -1}
              className={styles.tab}
              data-active={item.id === active.id || undefined}
              onClick={() => onOpenChange(item.id)}
            >
              <Icon name={KIND_ICON[item.kind] as any} size={14} />
              <span className={styles.tabLabel}>{item.title}</span>
            </button>
          ))}
        </div>
      )}

      {/*
        The renderer's own toolbar and well, as direct children of this flex
        column. The dock supplies the `.toolbar` and `.well` classes; the
        renderer decides whether it draws a toolbar at all.
      */}
      <renderer.Body {...context} />
    </div>
  );
};

export default ArtifactDock;
