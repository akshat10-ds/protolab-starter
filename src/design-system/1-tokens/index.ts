/**
 * Design System Tokens
 *
 * This is Layer 1 of the ProtoLab component hierarchy.
 * Tokens are the foundational design decisions that all other layers build upon.
 *
 * IMPORTANT: This layer has NO dependencies on other layers.
 * Only external dependencies (CSS) are allowed.
 */

// Re-export the token CSS file path for consumption
export const TOKENS_CSS_PATH = './tokens.css';

/**
 * Token Organization:
 *
 * 1. Color Primitives - Base color palette (Cobalt, Neutral, Red, Green, Ecru)
 * 2. Semantic Tokens - Purpose-driven tokens:
 *    - --ink-font-* (typography colors)
 *    - --ink-bg-* (backgrounds)
 *    - --ink-border-* (borders)
 *    - --ink-message-* (feedback states)
 *    - --ink-bar-* (progress bars)
 *    - --ink-elevation-* (shadows)
 *    - --ink-focus-* (focus rings)
 * 3. Component-Specific Tokens - Component typography and sizing
 */

/**
 * Usage in Components:
 *
 * All CSS Module files in higher layers must import tokens:
 *
 * ```css
 * @import '../1-tokens/tokens.css';
 *
 * .component {
 *   background: var(--ink-bg-color-default);
 *   color: var(--ink-font-primary);
 * }
 * ```
 */

// Note: Actual token values are defined in tokens.css
// This file serves as the entry point for token documentation and metadata
