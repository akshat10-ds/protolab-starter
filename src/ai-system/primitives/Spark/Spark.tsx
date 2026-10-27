/**
 * Spark — the agent's mark, and the tunnel it becomes while it works.
 *
 * Akshat, 2026-08-24, handing over `sparkleTunnel_v04.json`: *"I think this is
 * a spark animation that I want to use."* This is that Lottie, ported by hand
 * to SVG + CSS. **No player, no dependency.**
 *
 * ── WHAT THE DEMO ACTUALLY SHOWS (the spec) ──
 *
 * The zip's own `demo/sparkleTunnel_v04.html`, rendered with lottie-web and
 * read out of the live DOM — not inferred from the JSON, because a first pass
 * inferred it wrong and shipped a blob:
 *
 *   • FOUR paths, each with TWO subpaths, each `fill`ed with a gradient.
 *     `stroke` is null on every one. A ring here is a FILLED BAND between two
 *     concentric copies of the sparkle — never a stroke.
 *   • Extents grow 1.7 → 12.0 units and clamp there. At the layer's 170% scale
 *     that is 20.4 in a 20-unit box, so the tips of a full-grown ring reach
 *     just past the frame. The demo lets them; so does this.
 *   • Several rings are alive at once (frame 180 shows extents 12, 12, 9.1,
 *     6.1), spawning every 120 frames (2s) across a 241-frame (≈4s) loop.
 *   • The gradient runs LEFT TO RIGHT across the whole mark, magenta to
 *     blue-violet, shared by every ring.
 *   • **There is no static glyph anywhere in the composition.** The animation
 *     IS the mark.
 *
 * ── WHAT THE FIRST PORT GOT WRONG ──
 *
 * It read the two subpaths as a constant-width band and drew them as one
 * `stroke` with `vector-effect: non-scaling-stroke`, over a static Ink glyph
 * that it left underneath. Three consequences, all visible in Akshat's
 * screenshot: the glyph showed through as a solid body with the gradient
 * apparently painted on it; `non-scaling-stroke` pinned every ring to the same
 * hairline regardless of its size, so they read as one shape rather than a
 * tunnel; and at 14px the whole thing collapsed into a blob. The band is a
 * fill, and the mark is the animation — both are fixed here.
 *
 * ── HOW THE BAND IS BUILT ──
 *
 * Each ring is the sparkle at scale `a` minus the same sparkle at scale `b`,
 * where `b` runs the identical animation 61 frames (1017ms) behind — that lag
 * is what the Lottie's second subpath is. SVG expresses "shape minus shape" as
 * a mask, so a ring is: a mask holding a white outer and a black inner, over a
 * rect carrying the shared gradient. That composition is exact, not an
 * approximation of one.
 *
 * ── STORYBOARD ──
 *
 *      0ms   a ring is born at the centre, scale 0
 *   1017ms   its inner edge follows (frame 61), opening it into a band
 *   2000ms   the next ring is born — two are alive from here on
 *   4000ms   the first ring reaches the frame and is gone; loop
 *
 * Reduced motion drops the whole composition and shows the static Ink glyph,
 * which is also exactly what `active={false}` renders — so a resolved chip and
 * a reduced-motion chip agree, and neither differs from what shipped before
 * this component existed.
 */

import React from 'react';
import { Icon } from '@ink';

import styles from './Spark.module.css';

/**
 * The Lottie's sparkle at full size, in its own -6…6 space, beziers converted
 * vertex-by-vertex (`v + o` → control 1, next `v + i` → control 2). Kept as one
 * string because it is imported artwork: editing it by hand forks it from the
 * source file.
 */
const SPARKLE_PATH =
  'M 0.004 -6 C -0.205 -6 -0.392 -5.876 -0.461 -5.674 C -0.829 -4.682 -1.169 -3.947 -1.55 -3.357 C -2.036 -2.594 -2.598 -2.04 -3.36 -1.554 C -3.951 -1.179 -4.692 -0.833 -5.678 -0.465 C -5.859 -0.402 -5.978 -0.244 -6 -0.061 C -6 -0.061 -6 0.06 -6 0.06 C -5.978 0.244 -5.859 0.402 -5.678 0.465 C -4.685 0.825 -3.951 1.172 -3.36 1.554 C -2.598 2.039 -2.043 2.594 -1.55 3.358 C -1.176 3.953 -0.829 4.689 -0.461 5.674 C -0.385 5.875 -0.205 6 0.004 6 C 0.212 6 0.399 5.869 0.468 5.674 C 0.835 4.682 1.176 3.947 1.557 3.358 C 2.042 2.594 2.598 2.039 3.361 1.554 C 3.958 1.18 4.693 0.832 5.678 0.465 C 5.859 0.396 5.978 0.243 6 0.06 C 6 0.06 6 -0.059 6 -0.059 C 5.977 -0.243 5.853 -0.402 5.678 -0.465 C 4.686 -0.833 3.95 -1.172 3.361 -1.554 C 2.598 -2.04 2.042 -2.594 1.557 -3.357 C 1.183 -3.947 0.835 -4.689 0.468 -5.674 C 0.399 -5.876 0.212 -6 0.004 -6 Z';

/** Two rings alive at once, born 2s apart — the file's 120-frame stagger. */
const RINGS = [0, -2000];


export interface SparkProps {
  /**
   * The agent is working. The tunnel runs while this is true and the mark is
   * the plain glyph when it is not — the same rule `Shimmer` obeys, so a
   * surface that has stopped working never has one part still saying otherwise.
   */
  active?: boolean;
  /** Rendered size in px. Defaults to 14 — the chip's glyph. */
  size?: number;
  className?: string;
}

export const Spark = ({ active = false, size = 14, className }: SparkProps) => {
  /* Ids must not collide when two chips animate in one thread. */
  const uid = React.useId().replace(/:/g, '');

  return (
    <span
      className={`${styles.spark} ${active ? styles.working : ''} ${className ?? ''}`.trim()}
      style={{ width: size, height: size }}
    >
      {/*
        The glyph is the resting mark AND the reduced-motion fallback. While the
        tunnel runs the CSS hides it, because the Lottie carries no static layer
        and leaving one underneath is what made the first port a blob.
      */}
      <span className={styles.glyph}>
        <Icon name="ai-spark-filled" size={size} />
      </span>

      {active && (
        <svg className={styles.tunnel} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <defs>
            {/*
              One gradient for the whole mark, left to right — the demo's own
              stops, and its own orientation. Not per ring: every ring reads
              from this same sweep, which is why the small centre one carries
              the full magenta-to-violet range in the reference render.
            */}
            <linearGradient
              id={`sparkGrad-${uid}`}
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="10"
              x2="20"
              y2="10"
            >
              <stop offset="0" stopColor="rgb(217, 21, 93)" />
              <stop offset="0.25" stopColor="rgb(194, 23, 142)" />
              <stop offset="0.5" stopColor="rgb(171, 25, 191)" />
              <stop offset="0.75" stopColor="rgb(123, 16, 223)" />
              <stop offset="1" stopColor="rgb(76, 6, 255)" />
            </linearGradient>

            {RINGS.map((delay, i) => (
              <mask key={i} id={`sparkRing-${uid}-${i}`}>
                {/* translate to centre, then the layer's own 170% */}
                <g transform="translate(10 10) scale(1.7)">
                  <path
                    className={styles.outer}
                    d={SPARKLE_PATH}
                    fill="#fff"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                  {/* The lag lives in the inner's keyframes, not in a delay —
                      see the stylesheet for the loop that broke otherwise. */}
                  <path
                    className={styles.inner}
                    d={SPARKLE_PATH}
                    fill="#000"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                </g>
              </mask>
            ))}
          </defs>

          {RINGS.map((delay, i) => (
            <rect
              key={i}
              className={styles.ring}
              x="0"
              y="0"
              width="20"
              height="20"
              fill={`url(#sparkGrad-${uid})`}
              mask={`url(#sparkRing-${uid}-${i})`}
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </svg>
      )}
    </span>
  );
};

Spark.displayName = 'Spark';
