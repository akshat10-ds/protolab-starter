/**
 * StreamingMarkdown — markdown that types itself out, then reports completion.
 *
 * Composes `useSemanticStreaming` + `MarkdownRenderer`, forwarding citations
 * and citation clicks through to the renderer. Fires `onComplete` when the
 * last chunk lands.
 *
 * Lifted verbatim (behavior-identical) from the frozen prototype at
 * `protoLab/src/prototypes/iris-agent/index.tsx:100-126`, where it was the only
 * local wrapper around a system component that existed purely because the
 * system lacked the composite.
 *
 * Pair it with `MarkdownRenderer` at the call site: render `MarkdownRenderer`
 * for turns that have already streamed, `StreamingMarkdown` for the live one.
 *
 * @example
 * ```tsx
 * {isCompleted ? (
 *   <MarkdownRenderer content={msg.markdownContent} citations={msg.citations} />
 * ) : (
 *   <StreamingMarkdown
 *     content={msg.markdownContent}
 *     citations={msg.citations}
 *     onComplete={() => markComplete(msg.id)}
 *   />
 * )}
 * ```
 */

import { useSemanticStreaming } from '@ai/hooks/useSemanticStreaming';
import { MarkdownRenderer } from '@ai/composites/MarkdownRenderer/MarkdownRenderer';
import type { Citation } from '@ai/primitives/CitationBadge/CitationBadge';

import styles from './StreamingMarkdown.module.css';

export interface StreamingMarkdownProps {
  /** Full markdown content to stream in */
  content: string;
  /** Citation data keyed by citation id, passed to MarkdownRenderer */
  citations?: Record<string, Citation>;
  /** Fires once the full content has streamed */
  onComplete?: () => void;
  /** Fires when a citation badge is clicked */
  onCitationClick?: (citation: Citation) => void;
}

export function StreamingMarkdown({
  content,
  citations,
  onComplete,
  onCitationClick,
}: StreamingMarkdownProps) {
  const { streamedContent } = useSemanticStreaming({
    content,
    autoStart: true,
    onComplete,
  });

  return (
    <div className={styles.streamingArea}>
      <MarkdownRenderer
        content={streamedContent}
        citations={citations}
        onCitationClick={onCitationClick}
      />
    </div>
  );
}

export default StreamingMarkdown;
