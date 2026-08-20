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
              <p className={styles.body}>{section.body}</p>
            </section>
          ))}
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
