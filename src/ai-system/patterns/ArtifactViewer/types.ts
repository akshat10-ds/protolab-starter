/**
 * The artifact model, and the renderer contract the dock plugs into.
 *
 * Akshat, 2026-08-13: "the pane is sort of like the artifacts panel can be used
 * dynamically for showing agreements, showing a document editor, showing data
 * tables, etc." The dock is a FRAME. What goes in it is a RENDERER. This file
 * is the line between the two.
 *
 * It is a separate file so a renderer can name the model without importing the
 * dock, and the dock can name the renderer contract without importing a
 * renderer. `ArtifactDock.tsx` re-exports every type here, so an old import
 * path keeps working.
 */

import type React from 'react';

// =============================================================================
// The artifact model
// =============================================================================

/**
 * What the dock is showing. Every value must have an entry in
 * `artifactRenderers.tsx`; that map is the only place a kind is named.
 * `visualization` is a declared placeholder: the API is ready for charts, the
 * system adds no chart dependency to draw one.
 */
export type ArtifactKind = 'markdown' | 'table' | 'document' | 'sources' | 'visualization';

/** One row in a `sources` item. Clicking it drills to a `document` item. */
export interface ArtifactSource {
  id: string;
  title: string;
  excerpt?: string;
  meta?: string;
  icon?: string;
}

/** One block of a `document` item. `highlighted` is the cited passage. */
export interface ArtifactSection {
  heading?: string;
  body: string;
  highlighted?: boolean;
  citationId?: string;
}

// -----------------------------------------------------------------------------
// The table model
// -----------------------------------------------------------------------------

/**
 * The four status states frame 163:21261 draws. Two of them add a quiet second
 * line ("Expires DD-MM-YY", "Renews DD-MM-YY"); the other two do not.
 */
export type ArtifactTableStatus = 'expiring' | 'renewing' | 'active' | 'inactive';

/**
 * One cell. The frame uses four shapes and no more.
 *
 * `text` covers both the one-line cells (Expiration Date, Agreement Type) and
 * the two-line File Name cell — `sub` is the second line, `subIcon` the 16px
 * glyph in front of it.
 */
export type ArtifactTableCell =
  | { kind: 'text'; text: string; sub?: string; subIcon?: string }
  /** Parties and Sets: 0–2 chips, and a "+N More" button when there are more. */
  | { kind: 'chips'; chips: string[]; more?: number }
  /** A dot, a label, and a second line on `expiring` and `renewing`. */
  | { kind: 'status'; state: ArtifactTableStatus; label: string; sub?: string };

export interface ArtifactTableColumn {
  /** Matches the key used in a row's `cells` and `sortValues`. */
  key: string;
  label: string;
  /** Column width in px, from the frame. Omit it and the column takes its share. */
  width?: number;
  sortable?: boolean;
  /**
   * Which edge the column aligns to — header label and body cells together.
   * Defaults to `start`. Use `end` for a column of numbers or dates: the
   * renderer also gives it tabular figures, so the digits stack in columns and
   * the values read as a ranking.
   */
  align?: 'start' | 'end';
}

export interface ArtifactTableRow {
  id: string;
  cells: Record<string, ArtifactTableCell>;
  /**
   * What a sortable column sorts on. Supply it wherever the text does not sort:
   * a DD-MM-YY date sorts wrong as a string, and a status has an order that its
   * label does not carry. Where it is absent the renderer falls back to the
   * cell's own text.
   */
  sortValues?: Record<string, string | number>;
}

export interface ArtifactTable {
  columns: ArtifactTableColumn[];
  rows: ArtifactTableRow[];
  /** Draws the leading checkbox column. Selection is the renderer's own state. */
  selectable?: boolean;
  /**
   * Draws the trailing 32px overflow button on every row, and the show/hide
   * fields button in the header row.
   *
   * These are a flag, not a cell kind. The frame gives every row the same
   * button, so it is chrome the table draws — putting it in `cells` would make
   * every row repeat one constant.
   */
  rowActions?: boolean;
}

// -----------------------------------------------------------------------------
// The item
// -----------------------------------------------------------------------------

/** One artifact. The host owns the list. */
export interface ArtifactItem {
  id: string;
  title: string;
  kind: ArtifactKind;
  /**
   * Parties, date, row count.
   *
   * The 73px header of frames 158:18134 and 163:21261 draws the title alone, so
   * the dock no longer renders this. It stays on the model because hosts and
   * fixtures set it, and because a renderer may still want it.
   */
  subtitle?: string;
  /** `markdown`, and `table` when it has no structured model: a markdown string. */
  content?: string;
  /** `table`: the structured model. Preferred over `content`. */
  table?: ArtifactTable;
  /** `document`: the agreement's sections, paged by the renderer. */
  sections?: ArtifactSection[];
  /** `sources`: the file rows. */
  sources?: ArtifactSource[];
  /**
   * Where this item was reached FROM. The dock draws a back control naming that
   * item, before the title.
   *
   * It exists because a document can be arrived at more than one way — out of a
   * sources list, or out of a search result table — and "back" has to mean the
   * one you actually came through. Akshat, 2026-08-19: *"we do need breadcrumb
   * before the agreement name to go back to the search results."*
   *
   * The host sets it, because the host is what knows the route. An id not in
   * `items` draws nothing.
   */
  parentId?: string;
}

// =============================================================================
// The renderer contract
// =============================================================================

/**
 * The host hook every renderer- and header-supplied control routes through.
 * One prop covers download, Open in Navigator, search, a row's overflow menu
 * and the show/hide fields button, because the dock has no opinion about any of
 * them — it only reports that one was pressed.
 */
export type ArtifactActionHandler = (
  action: string,
  item: ArtifactItem,
  detail?: unknown
) => void;

/** What the dock hands a renderer. */
export interface ArtifactRenderContext {
  item: ArtifactItem;
  onAction?: ArtifactActionHandler;
  /** A `sources` row was clicked. The host opens the matching `document` item. */
  onSourceOpen?: (sourceId: string) => void;
}

/**
 * A renderer.
 *
 * `Body` owns EVERYTHING below the universal header — its own optional 48px
 * toolbar and its own well — and returns them as a fragment, so they become
 * direct children of the dock's flex column. Two facts force that split rather
 * than a `renderToolbar` slot the dock places itself:
 *
 * 1. The toolbar and the well share state. The document's page number and zoom
 *    are set in the toolbar and read by the page.
 * 2. The wells differ. The table is full-bleed, the document is a canvas ground
 *    with a white page centred in it, markdown keeps the padded well.
 *
 * The dock supplies the `.toolbar` and `.well` classes for both to use, so
 * every renderer draws the same 48px band and the same scroll behaviour.
 *
 * `HeaderActions` is what the renderer contributes to the header, between the
 * title and download · expand · close.
 */
export interface ArtifactRenderer {
  Body: React.FC<ArtifactRenderContext>;
  HeaderActions?: React.FC<ArtifactRenderContext>;
}
