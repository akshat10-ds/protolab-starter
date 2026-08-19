/**
 * useSemanticStreaming — Progressive markdown streaming hook
 *
 * Takes a full markdown string and streams it progressively with
 * semantic awareness: tables as complete blocks, headers/list items
 * as full lines, paragraphs word-by-word with punctuation pauses.
 *
 * Extracted from agreement-studio AIPanel streaming logic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// =============================================================================
// Types
// =============================================================================

export type StreamingPhase = 'idle' | 'thinking' | 'streaming' | 'complete';

export interface UseSemanticStreamingOptions {
  /** Full markdown content to stream */
  content: string;
  /** Start streaming on mount (default: true) */
  autoStart?: boolean;
  /** Base delay per word chunk in ms (default: 35) */
  baseDelayMs?: number;
  /** Fires when streaming finishes */
  onComplete?: () => void;
  /** Fires when phase changes */
  onPhaseChange?: (phase: StreamingPhase) => void;
}

export interface UseSemanticStreamingReturn {
  /** Current streamed content (partial markdown) */
  streamedContent: string;
  /** Whether streaming is active */
  isStreaming: boolean;
  /** Current phase */
  phase: StreamingPhase;
  /** Skip to complete content immediately */
  skip: () => void;
  /** Stop streaming at current position */
  stop: () => void;
  /** Restart streaming from the beginning */
  restart: () => void;
  /** Manually start streaming (when autoStart is false) */
  start: () => void;
}

// =============================================================================
// Semantic chunk parser
// =============================================================================

function parseSemanticChunks(markdown: string): string[] {
  const rawLines = markdown.split('\n');
  const chunks: string[] = [];
  let tableBuffer: string[] = [];

  for (const line of rawLines) {
    if (line.trim().startsWith('|')) {
      tableBuffer.push(line);
    } else {
      if (tableBuffer.length > 0) {
        chunks.push(tableBuffer.join('\n'));
        tableBuffer = [];
      }
      chunks.push(line);
    }
  }
  if (tableBuffer.length > 0) {
    chunks.push(tableBuffer.join('\n'));
  }

  return chunks;
}

// =============================================================================
// Hook
// =============================================================================

export function useSemanticStreaming(
  options: UseSemanticStreamingOptions
): UseSemanticStreamingReturn {
  const {
    content,
    autoStart = true,
    baseDelayMs = 35,
    onComplete,
    onPhaseChange,
  } = options;

  const [streamedContent, setStreamedContent] = useState('');
  const [phase, setPhase] = useState<StreamingPhase>('idle');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef(false);
  const stopRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onPhaseChangeRef = useRef(onPhaseChange);

  // Keep refs fresh
  onCompleteRef.current = onComplete;
  onPhaseChangeRef.current = onPhaseChange;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updatePhase = useCallback((newPhase: StreamingPhase) => {
    setPhase(newPhase);
    onPhaseChangeRef.current?.(newPhase);
  }, []);

  const completeStreaming = useCallback(() => {
    clearTimer();
    setStreamedContent(content);
    updatePhase('complete');
    onCompleteRef.current?.();
  }, [content, clearTimer, updatePhase]);

  const startStreaming = useCallback(() => {
    if (!content) {
      updatePhase('complete');
      return;
    }

    // Reset state
    skipRef.current = false;
    stopRef.current = false;
    setStreamedContent('');
    updatePhase('streaming');

    const semanticChunks = parseSemanticChunks(content);
    let chunkIndex = 0;
    let wordIndexInChunk = 0;

    const streamNext = () => {
      // Check for skip/stop
      if (skipRef.current) {
        setStreamedContent(content);
        updatePhase('complete');
        onCompleteRef.current?.();
        return;
      }
      if (stopRef.current) {
        updatePhase('complete');
        return;
      }

      if (chunkIndex >= semanticChunks.length) {
        // All done
        updatePhase('complete');
        onCompleteRef.current?.();
        return;
      }

      const currentChunk = semanticChunks[chunkIndex];
      const isTable = currentChunk.includes('|') && currentChunk.trim().startsWith('|');
      const isHeader = currentChunk.startsWith('#');
      const isList = currentChunk.startsWith('-') || /^\d+\./.test(currentChunk);
      const isCodeFence = currentChunk.trim().startsWith('```');
      const isEmpty = currentChunk.trim() === '';

      // Tables render as complete blocks
      if (isTable) {
        const completedChunks = semanticChunks.slice(0, chunkIndex + 1);
        setStreamedContent(completedChunks.join('\n'));
        chunkIndex++;
        wordIndexInChunk = 0;
        timerRef.current = setTimeout(streamNext, 80 + Math.random() * 40);
        return;
      }

      // Headers, list items, code fences, and empty lines render as complete lines
      if (isHeader || isList || isEmpty || isCodeFence) {
        const completedChunks = semanticChunks.slice(0, chunkIndex + 1);
        setStreamedContent(completedChunks.join('\n'));
        chunkIndex++;
        wordIndexInChunk = 0;
        const delay = isEmpty ? 30 : 50 + Math.random() * 30;
        timerRef.current = setTimeout(streamNext, delay);
        return;
      }

      // Regular text: stream word by word
      const words = currentChunk.split(' ');
      const wordsPerChunk = 2 + Math.floor(Math.random() * 3); // 2-4 words at a time
      wordIndexInChunk = Math.min(wordIndexInChunk + wordsPerChunk, words.length);

      const partialLine = words.slice(0, wordIndexInChunk).join(' ');
      const completedChunks = semanticChunks.slice(0, chunkIndex);
      const partialMarkdown = [...completedChunks, partialLine].join('\n');
      setStreamedContent(partialMarkdown);

      if (wordIndexInChunk >= words.length) {
        // Line complete, move to next chunk
        chunkIndex++;
        wordIndexInChunk = 0;
        const lastWord = words[words.length - 1] || '';
        let delay = baseDelayMs - 10 + Math.random() * 20;
        if (/[.!?]$/.test(lastWord)) delay += 80;
        else if (/[,;:]$/.test(lastWord)) delay += 40;
        timerRef.current = setTimeout(streamNext, delay);
      } else {
        // Continue streaming words in current line
        timerRef.current = setTimeout(streamNext, baseDelayMs - 20 + Math.random() * 20);
      }
    };

    // Small initial delay before starting
    timerRef.current = setTimeout(streamNext, 100);
  }, [content, baseDelayMs, clearTimer, updatePhase]);

  // Auto-start on mount or content change
  useEffect(() => {
    if (autoStart && content) {
      startStreaming();
    }
    return clearTimer;
  }, [content, autoStart, startStreaming, clearTimer]);

  const skip = useCallback(() => {
    skipRef.current = true;
    completeStreaming();
  }, [completeStreaming]);

  const stop = useCallback(() => {
    stopRef.current = true;
    clearTimer();
    updatePhase('complete');
  }, [clearTimer, updatePhase]);

  const restart = useCallback(() => {
    clearTimer();
    startStreaming();
  }, [clearTimer, startStreaming]);

  return {
    streamedContent,
    isStreaming: phase === 'streaming',
    phase,
    skip,
    stop,
    restart,
    start: startStreaming,
  };
}
