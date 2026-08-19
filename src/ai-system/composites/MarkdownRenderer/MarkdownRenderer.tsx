/**
 * MarkdownRenderer — Rich markdown rendering with citations
 *
 * Renders AI-generated markdown content as formatted React elements.
 * Supports: headers, fenced code blocks (with language label, line numbers,
 * and copy button), inline code, links, tables (with CSV copy), lists,
 * blockquotes, bold/italic, citation links, expandable sections, and
 * plan blocks.
 *
 * Generalized from agreement-studio's MarkdownMessage. Uses CitationBadge
 * for inline citation display with portal-based tooltips.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Button, Icon, IconButton } from '@ink';
import { CitationBadge } from '../../primitives/CitationBadge/CitationBadge';
import type { Citation } from '../../primitives/CitationBadge/CitationBadge';
import styles from './MarkdownRenderer.module.css';

// =============================================================================
// Types
// =============================================================================

export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;
  /** Map of citation IDs to citation data */
  citations?: Record<string, Citation>;
  /** Callback when a citation is clicked */
  onCitationClick?: (citation: Citation) => void;
  /** Hide the Copy CSV button on tables */
  hideCopyButton?: boolean;
  /** Optional actions rendered at the bottom of :::plan blocks */
  planActions?: React.ReactNode;
}

// Re-export Citation type so consumers can use it
export type { Citation };

// =============================================================================
// Sub-components
// =============================================================================

interface ExpandableSectionProps {
  headerText: string;
  buttonText: string;
  collapsedContent: React.ReactNode;
  expandedContent: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  headerText,
  buttonText,
  collapsedContent,
  expandedContent,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.expandableSection}>
      <div className={styles.expandHeader}>
        <h4 className={styles.h3}>{headerText}</h4>
        <Button
          kind="tertiary"
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          endElement={<Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size="small" />}
        >
          {isExpanded ? 'Show less' : buttonText}
        </Button>
      </div>
      {!isExpanded && collapsedContent}
      {isExpanded && expandedContent}
    </div>
  );
};

// =============================================================================
// Code Block with Copy + Line Numbers
// =============================================================================

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const lines = code.split('\n');
  // Remove trailing empty line that often comes from markdown formatting
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeBlockHeader}>
        <span className={styles.codeBlockLanguage}>
          {language || 'code'}
        </span>
        <button
          className={copied ? styles.codeBlockCopyBtnCopied : styles.codeBlockCopyBtn}
          onClick={handleCopy}
          type="button"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className={styles.codeBlockBody}>
        <div className={styles.codeBlockGutter}>
          {lines.map((_, idx) => (
            <span key={idx} className={styles.codeBlockLineNumber}>
              {idx + 1}
            </span>
          ))}
        </div>
        <div className={styles.codeBlockContent}>
          <pre>{highlightSyntax(code, language)}</pre>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Simple CSS-based syntax highlighting
// =============================================================================

function highlightSyntax(code: string, language?: string): React.ReactNode {
  if (!language) return code;

  // Tokenize the code into segments for highlighting
  // This is a simple, non-library-based approach using regex
  const tokens: { type: string; value: string }[] = [];
  let remaining = code;

  // Language-agnostic patterns (ordered by priority)
  const patterns: { type: string; regex: RegExp }[] = [
    // Comments: // ... or # ... or -- ...
    { type: 'comment', regex: /^(?:\/\/.*|#.*|--.*)/m },
    // Multi-line comments: /* ... */
    { type: 'comment', regex: /^\/\*[\s\S]*?\*\// },
    // Strings: "..." or '...' or `...`
    { type: 'string', regex: /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/ },
    // Numbers
    { type: 'number', regex: /^(?:0x[0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?)/ },
    // Keywords (common across languages)
    {
      type: 'keyword',
      regex: /^(?:function|const|let|var|return|if|else|for|while|do|switch|case|break|continue|class|import|export|from|default|new|this|try|catch|finally|throw|async|await|yield|def|print|self|elif|pass|lambda|with|as|in|not|and|or|True|False|None|SELECT|FROM|WHERE|JOIN|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INTO|VALUES|SET|ON|AND|OR|NOT|NULL|int|float|double|char|void|string|bool|public|private|protected|static|final|abstract|interface|extends|implements|struct|enum|fn|mut|pub|use|mod|crate|match|impl|trait|type|typeof|instanceof)\b/,
    },
    // Function calls: identifier(
    { type: 'function', regex: /^[a-zA-Z_]\w*(?=\s*\()/ },
    // Punctuation
    { type: 'punctuation', regex: /^[{}()[\];:.,<>=!+\-*/&|^~%?@\\]/ },
    // Plain text (identifiers and whitespace)
    { type: 'plain', regex: /^[a-zA-Z_]\w*/ },
    { type: 'plain', regex: /^\s+/ },
    // Catch-all for any other character
    { type: 'plain', regex: /^./ },
  ];

  while (remaining.length > 0) {
    let matched = false;
    for (const { type, regex } of patterns) {
      const m = remaining.match(regex);
      if (m) {
        tokens.push({ type, value: m[0] });
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Should not happen with catch-all, but safety fallback
      tokens.push({ type: 'plain', value: remaining[0] });
      remaining = remaining.slice(1);
    }
  }

  const styleMap: Record<string, string> = {
    keyword: styles.codeKeyword,
    string: styles.codeString,
    comment: styles.codeComment,
    number: styles.codeNumber,
    function: styles.codeFunction,
    punctuation: styles.codePunctuation,
  };

  return tokens.map((token, idx) => {
    const className = styleMap[token.type];
    if (className) {
      return (
        <span key={idx} className={className}>
          {token.value}
        </span>
      );
    }
    return token.value;
  });
}

// =============================================================================
// Table with CSV Copy
// =============================================================================

interface TableWithCopyProps {
  headerCells: string[];
  dataRows: string[][];
  citations: Record<string, Citation>;
  onCitationClick: (citation: Citation) => void;
  getKey: () => string;
  hideCopyButton?: boolean;
}

const TableWithCopy: React.FC<TableWithCopyProps> = ({
  headerCells,
  dataRows,
  citations,
  onCitationClick,
  getKey,
  hideCopyButton = false,
}) => {
  const [copied, setCopied] = useState(false);

  const stripCitations = (text: string): string => {
    return text
      .replace(/\[[^\]]+\][¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, (match) => {
        const bracketEnd = match.lastIndexOf(']');
        return match.slice(1, bracketEnd);
      })
      .replace(/\[[¹²³⁴⁵⁶⁷⁸⁹⁰]+\]/g, '')
      .trim();
  };

  const handleCopyCSV = useCallback(() => {
    const csvRows = [
      headerCells.map(stripCitations).join(','),
      ...dataRows.map((row) => row.map(stripCitations).join(',')),
    ];
    navigator.clipboard.writeText(csvRows.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [headerCells, dataRows]);

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {headerCells.map((cell, idx) => (
                <th key={idx}>{parseInline(cell, citations, onCitationClick, getKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx}>{parseInline(cell, citations, onCitationClick, getKey)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hideCopyButton && (
        <div className={styles.tableFooter}>
          <div className={styles.tableCopyWrap}>
            <IconButton
              icon={copied ? 'check' : 'duplicate'}
              variant="tertiary"
              size="small"
              onClick={handleCopyCSV}
              aria-label="Copy as CSV"
            />
            <span className={copied ? styles.tableCopyTooltipActive : styles.tableCopyTooltip}>
              {copied ? 'Copied!' : 'Copy as CSV'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  citations = {},
  onCitationClick,
  hideCopyButton = false,
  planActions,
}) => {
  const handleCitationClick = onCitationClick || (() => {});

  const renderedContent = useMemo(() => {
    return parseMarkdown(content, citations, handleCitationClick, hideCopyButton, planActions);
  }, [content, citations, handleCitationClick, hideCopyButton, planActions]);

  return <div className={styles.markdownRenderer}>{renderedContent}</div>;
};

// =============================================================================
// Markdown Parser
// =============================================================================

function parseMarkdown(
  content: string,
  citations: Record<string, Citation>,
  onCitationClick: (citation: Citation) => void,
  hideCopyButton: boolean,
  planActions?: React.ReactNode
): React.ReactNode[] {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let keyCounter = 0;
  const getKey = () => `md-${keyCounter++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block (must be parsed FIRST to protect content from other parsers)
    if (line.trim().startsWith('```')) {
      const openingLine = line.trim();
      const language = openingLine.slice(3).trim() || undefined;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      elements.push(
        <CodeBlock key={getKey()} code={codeLines.join('\n')} language={language} />
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={getKey()} className={styles.hr} />);
      i++;
      continue;
    }

    // Expandable header: ### Header Text [+Button Text]
    const expandHeaderMatch = line.match(/^### (.+?) \[\+(.+?)\]$/);
    if (expandHeaderMatch) {
      const headerText = expandHeaderMatch[1];
      const buttonText = expandHeaderMatch[2];
      const collapsedLines: string[] = [];
      const expandedLines: string[] = [];
      let inExpanded = false;
      i++;

      while (i < lines.length && lines[i].trim() !== '[/+]') {
        if (lines[i].trim() === '[+++]') {
          inExpanded = true;
          i++;
          continue;
        }
        if (inExpanded) {
          expandedLines.push(lines[i]);
        } else {
          collapsedLines.push(lines[i]);
        }
        i++;
      }
      i++;

      elements.push(
        <ExpandableSection
          key={getKey()}
          headerText={headerText}
          buttonText={buttonText}
          collapsedContent={parseMarkdown(collapsedLines.join('\n'), citations, onCitationClick, hideCopyButton)}
          expandedContent={parseMarkdown(expandedLines.join('\n'), citations, onCitationClick, hideCopyButton)}
        />
      );
      continue;
    }

    // Plan block: :::plan ... :::
    if (line.trim() === ':::plan') {
      const planLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        planLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      elements.push(
        <div key={getKey()} className={styles.planCard}>
          {parseMarkdown(planLines.join('\n'), citations, onCitationClick, hideCopyButton)}
          {planActions && <div className={styles.planCardActions}>{planActions}</div>}
        </div>
      );
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h4 key={getKey()} className={styles.h3}>
          {parseInline(line.slice(4), citations, onCitationClick, getKey)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={getKey()} className={styles.h2}>
          {parseInline(line.slice(3), citations, onCitationClick, getKey)}
        </h3>
      );
      i++;
      continue;
    }

    // Table detection
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, citations, onCitationClick, getKey, hideCopyButton));
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        const lineContent = lines[i].startsWith('> ') ? lines[i].slice(2) : lines[i].slice(1);
        quoteLines.push(lineContent);
        i++;
      }
      elements.push(
        <blockquote key={getKey()} className={styles.blockquote}>
          {quoteLines.map((ql, idx) => {
            const trimmed = ql.trim();
            const isEmpty = trimmed === '' || trimmed === '<br>' || trimmed === '<br/>' || trimmed === '<br />';
            return (
              <React.Fragment key={idx}>
                {isEmpty ? (
                  <div className={styles.blockquoteSpacer} />
                ) : (
                  parseInline(ql, citations, onCitationClick, getKey)
                )}
                {idx < quoteLines.length - 1 && !isEmpty && <br />}
              </React.Fragment>
            );
          })}
        </blockquote>
      );
      continue;
    }

    // Ordered list — a blank line between items (a "loose" list) doesn't
    // break the list as long as another numbered item follows, so source
    // numbering carries through instead of restarting at each item.
    if (/^\d+\.\s/.test(line)) {
      const listItems: { text: string; num: number }[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].match(/^(\d+)\.\s(.*)$/);
        if (itemMatch) {
          listItems.push({ num: parseInt(itemMatch[1], 10), text: itemMatch[2] });
          i++;
          continue;
        }
        if (lines[i].trim() === '' && /^\d+\.\s/.test(lines[i + 1] || '')) {
          i++;
          continue;
        }
        break;
      }
      elements.push(
        <ol key={getKey()} className={styles.ol} start={listItems[0].num}>
          {listItems.map((item, idx) => (
            <li key={idx} value={item.num} className={styles.li}>
              {parseInline(item.text, citations, onCitationClick, getKey)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        listItems.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={getKey()} className={styles.ul}>
          {listItems.map((item, idx) => (
            <li key={idx} className={styles.li}>
              {parseInline(item, citations, onCitationClick, getKey)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Italic metadata line
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(
        <p key={getKey()} className={styles.metadata}>
          {parseInline(line, citations, onCitationClick, getKey)}
        </p>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={getKey()} className={styles.p}>
        {parseInline(line, citations, onCitationClick, getKey)}
      </p>
    );
    i++;
  }

  return elements;
}

// =============================================================================
// Inline parser
// =============================================================================

function parseInline(
  text: string,
  citations: Record<string, Citation>,
  onCitationClick: (citation: Citation) => void,
  getKey: () => string
): React.ReactNode {
  const elements: React.ReactNode[] = [];
  // Order matters: inline code first (protects content), then bold, italic,
  // citations with text, citation numbers, markdown links, warning emoji.
  // Links use a negative lookahead on the closing ] to avoid matching citation syntax [text]¹
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\][¹²³⁴⁵⁶⁷⁸⁹⁰]+|\[[¹²³⁴⁵⁶⁷⁸⁹⁰]+\]|\[[^\]]+\]\([^)]+\)|⚠️)/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const matchedText = match[0];

    // Inline code: `code`
    if (matchedText.startsWith('`') && matchedText.endsWith('`') && !matchedText.startsWith('``')) {
      elements.push(
        <code key={getKey()} className={styles.inlineCode}>
          {matchedText.slice(1, -1)}
        </code>
      );
    }
    // Bold
    else if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      elements.push(
        <strong key={getKey()} className={styles.strong}>
          {matchedText.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      elements.push(
        <em key={getKey()} className={styles.em}>
          {matchedText.slice(1, -1)}
        </em>
      );
    }
    // Citation with text [text]¹
    else if (matchedText.match(/^\[[^\]]+\][¹²³⁴⁵⁶⁷⁸⁹⁰]+$/)) {
      const bracketEnd = matchedText.lastIndexOf(']');
      const displayText = matchedText.slice(1, bracketEnd);
      const superscript = matchedText.slice(bracketEnd + 1);
      const citationId = superscriptToNumber(superscript);
      const citation = citations[citationId];

      if (citation) {
        elements.push(
          <CitationBadge
            key={getKey()}
            citationId={citationId}
            citation={citation}
            displayText={displayText}
            onClick={onCitationClick}
          />
        );
      } else {
        elements.push(
          <span key={getKey()} className={styles.citationFallback}>
            {displayText}
            <span className={styles.citationFallbackChip}>{citationId}</span>
          </span>
        );
      }
    }
    // Citation number only [¹]
    else if (matchedText.match(/^\[[¹²³⁴⁵⁶⁷⁸⁹⁰]+\]$/)) {
      const superscript = matchedText.slice(1, -1);
      const citationId = superscriptToNumber(superscript);
      const citation = citations[citationId];

      if (citation) {
        elements.push(
          <CitationBadge
            key={getKey()}
            citationId={citationId}
            citation={citation}
            onClick={onCitationClick}
          />
        );
      } else {
        elements.push(
          <span key={getKey()} className={styles.citationFallbackChip}>
            {citationId}
          </span>
        );
      }
    }
    // Markdown link: [text](url)
    else if (matchedText.match(/^\[[^\]]+\]\([^)]+\)$/)) {
      const linkTextMatch = matchedText.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkTextMatch) {
        elements.push(
          <a
            key={getKey()}
            href={linkTextMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {linkTextMatch[1]}
          </a>
        );
      }
    }
    // Warning emoji
    else if (matchedText === '⚠️') {
      elements.push(
        <span key={getKey()} className={styles.warningEmoji}>
          ⚠️
        </span>
      );
    }

    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length === 1 ? elements[0] : elements;
}

// =============================================================================
// Helpers
// =============================================================================

function renderTable(
  lines: string[],
  citations: Record<string, Citation>,
  onCitationClick: (citation: Citation) => void,
  getKey: () => string,
  hideCopyButton: boolean
): React.ReactNode {
  if (lines.length < 2) return null;

  const headerCells = lines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);

  const dataRows = lines.slice(2).map((line) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  return (
    <TableWithCopy
      key={getKey()}
      headerCells={headerCells}
      dataRows={dataRows}
      citations={citations}
      onCitationClick={onCitationClick}
      getKey={getKey}
      hideCopyButton={hideCopyButton}
    />
  );
}

function superscriptToNumber(superscript: string): string {
  const map: Record<string, string> = {
    '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
    '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0',
  };
  return superscript.split('').map((c) => map[c] || c).join('');
}
