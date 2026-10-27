/**
 * DocumentRenderer — the `document` artifact, per frame 158:18134.
 *
 * A PAGED DOCUMENT PREVIEW, not a reflowed list of sections. The frame gives
 * this kind three things the table does not have:
 *
 * 1. A tertiary "Open in Navigator" button in the universal header, left of the
 *    icon controls. That is `HeaderActions`.
 * 2. A 48px toolbar: page nav on the right, then a zoom control, then search
 *    flush right. That is renderer-owned — the table draws none.
 * 3. A white page, 783 wide, centred in a canvas ground.
 *
 * Paging is a fixed number of sections per page over `sections[]`. The
 * prototype has no pagination model and the frame implies none, so this is the
 * simplest rule that makes the page controls real.
 *
 * NOT DRAWN. The frame's toolbar has a Select on its left whose label is
 * unreadable in the file. No control is drawn for it, and no meaning is
 * invented for it. Ask Akshat what it selects.
 *
 * A PAGE IS NOT ALWAYS PROSE, AND A CITATION IS NOT ALWAYS A CLAUSE. Two opt-in
 * additions, both silent until a host asks for them:
 *
 *   `section.content`   a rendered block in place of `body`, so a 1003 or a
 *                       bank statement can be a component and still wear this
 *                       page, these margins and this well.
 *   `item.highlights`   percentage boxes over the page — the field-scale mark
 *                       `section.highlighted` cannot make, because that one
 *                       cannot be smaller than a section.
 */

import React, { useState } from 'react';
import { Button, IconButton } from '@ink';
import dock from './ArtifactDock.module.css';
import styles from './DocumentRenderer.module.css';
import type { ArtifactRenderContext } from './types';

/** Sections per page. The frame reads "of 24" over a real agreement. */
const PER_PAGE = 3;

const ZOOM_STEPS = [50, 75, 100, 125, 150, 200];

const Body: React.FC<ArtifactRenderContext> = ({ item, onAction }) => {
  const sections = item.sections ?? [];
  const pages = Math.max(1, Math.ceil(sections.length / PER_PAGE));

  /*
   * The preview opens on the cited clause, not on page 1. A citation and a
   * source row both land on this renderer, and before it paged, the highlighted
   * section was in the scroll flow. Page 1 would put the mark behind two page
   * turns the user does not know to make.
   */
  const cited = sections.findIndex((section) => section.highlighted);
  const [page, setPage] = useState(cited >= 0 ? Math.floor(cited / PER_PAGE) + 1 : 1);
  const [zoom, setZoom] = useState(100);

  const clamp = (next: number) => setPage(Math.min(pages, Math.max(1, next)));
  const step = (by: number) => {
    const at = ZOOM_STEPS.indexOf(zoom);
    setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, at + by))]);
  };

  const shown = sections.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /*
   * Field-level citation. `section.highlighted` is the clause-scale mark and
   * cannot be smaller than a section; these are boxes over the page, in
   * percentages of its CONTENT box — see `ArtifactItem.highlights`.
   */
  const highlights = item.highlights ?? [];

  return (
    <>
      <div className={dock.toolbar} role="toolbar" aria-label="Document controls">
        <div className={styles.toolbarEnd}>
          <label className={styles.pageField}>
            <span className={dock.srOnly}>Page number</span>
            <input
              className={styles.pageInput}
              type="text"
              inputMode="numeric"
              value={page}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (Number.isFinite(next)) clamp(next);
              }}
            />
          </label>
          <span className={styles.pageCount}>of {pages}</span>

          <IconButton
            icon="chevron-left"
            size="small"
            variant="tertiary"
            disabled={page <= 1}
            onClick={() => clamp(page - 1)}
            aria-label="Previous page"
          />
          <IconButton
            icon="chevron-right"
            size="small"
            variant="tertiary"
            disabled={page >= pages}
            onClick={() => clamp(page + 1)}
            aria-label="Next page"
          />

          <span className={styles.divider} aria-hidden="true" />

          {/*
            The zoom controls are a PILL, not three loose children in the
            toolbar flow — frame 206:27620 wraps them in one bordered container
            so the two buttons and the value read as one control. The frame
            binds its border to `borderColorSubtleInverse`, white at 10% on a
            white pill: a wrong-theme binding, so the light-theme token is used
            instead and the border is actually visible.
          */}
          <div className={styles.zoomPill}>
            <IconButton
              icon="zoom-out"
              size="small"
              variant="tertiary"
              disabled={zoom === ZOOM_STEPS[0]}
              onClick={() => step(-1)}
              aria-label="Zoom out"
            />
            <span className={styles.zoomValue}>{zoom}%</span>
            <IconButton
              icon="zoom-in"
              size="small"
              variant="tertiary"
              disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
              onClick={() => step(1)}
              aria-label="Zoom in"
            />
          </div>
        </div>

        <IconButton
          icon="search"
          size="small"
          variant="tertiary"
          onClick={() => onAction?.('search', item)}
          aria-label="Search in document"
        />
      </div>

      <div className={dock.well} data-ground="canvas">
        {/*
          `zoom`, not `transform: scale()`. Zoom changes the layout box, so the
          well can scroll to a page that is larger than it; a transform does
          not, and a page at 200% would be clipped with nothing to scroll to.
        */}
        <article
          className={styles.page}
          style={{ zoom: `${zoom}%` }}
          data-highlights={highlights.length ? '' : undefined}
          aria-label={`${item.title}, page ${page} of ${pages}`}
        >
          {shown.map((section, i) => (
            <section
              key={i}
              id={section.citationId}
              className={styles.section}
              data-highlighted={section.highlighted || undefined}
            >
              {section.heading && <h3 className={styles.heading}>{section.heading}</h3>}
              {/* A rendered block wins; prose is what the section is otherwise. */}
              {section.content ?? <p className={styles.body}>{section.body}</p>}
            </section>
          ))}

          {highlights.length > 0 && (
            <div className={styles.highlightLayer}>
              {highlights.map((h) => (
                <div
                  key={h.id}
                  className={styles.highlight}
                  data-interactive={onAction ? '' : undefined}
                  style={{
                    top: `${h.top}%`,
                    left: `${h.left}%`,
                    width: `${h.width}%`,
                    height: `${h.height}%`,
                    background: h.color ?? 'var(--ink-orange-30)',
                  }}
                  title={h.label}
                  /*
                    Inert unless the dock can hear it. A mark with nothing behind
                    it is a mark, not a control, so it takes no cursor, no
                    pointer events and no place in the accessibility tree — the
                    row it points at is readable on its own.
                  */
                  aria-hidden={onAction ? undefined : true}
                  onClick={onAction ? () => onAction('highlight', item, h.id) : undefined}
                />
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
};

/**
 * "Open in Navigator" — a tertiary Ink button between the title and
 * download · expand · close. The frame draws it 155x40, which is Ink's `medium`
 * at this label. It has no icon in the frame, so it is given none.
 */
const HeaderActions: React.FC<ArtifactRenderContext> = ({ item, onAction }) => (
  <Button kind="tertiary" size="medium" onClick={() => onAction?.('open-in-navigator', item)}>
    Open in Navigator
  </Button>
);

export const DocumentRenderer = { Body, HeaderActions };

export default DocumentRenderer;
