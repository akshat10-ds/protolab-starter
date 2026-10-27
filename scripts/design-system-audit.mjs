#!/usr/bin/env node
/**
 * Static application-source audit. This measures known design-system debt;
 * it does not measure visual fidelity, accessibility, or runtime correctness.
 *
 * npm run audit:design-system
 * npm run audit:design-system -- --json /tmp/design-system-audit.json
 * npm run audit:design-system -- --write-baseline
 * node --test scripts/design-system-audit.test.mjs
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const RULES = {
  'raw-control': 'Raw HTML controls: use a design-system component.',
  'deep-design-system-import': 'Import design-system components from the @/design-system barrel.',
  'undefined-ink-token': 'Ink token has no definition in the source CSS.',
  'hardcoded-color': 'Use an Ink color token or component appearance prop.',
  'hardcoded-typography': 'Use an Ink typography token or component typography prop.',
  'hardcoded-spacing': 'Use layout/component props or an Ink spacing/radius token.',
  'layout-bypass': 'Use Stack, Inline, or Grid for application layout.',
};

const DEFAULT_BASELINE = 'scripts/design-system-audit-baseline.json';
const SOURCE_EXTENSIONS = /\.(?:tsx?|css)$/;
const RAW_CONTROLS = new Set(['a', 'button', 'input', 'select', 'textarea', 'table']);
const RAW_LAYOUT = new Set(['div', 'span', 'section', 'main', 'header', 'footer', 'article', 'aside', 'nav', 'ul', 'ol', 'li', 'form']);
const COLOR_PROPERTIES = /^(?:color|background(?:Color)?|(?:border(?:Top|Right|Bottom|Left)?|outline)(?:Color)?|(?:box|text)Shadow|caretColor|accentColor|textDecorationColor)$/;
const TYPOGRAPHY_PROPERTIES = /^(?:font(?:Family|Size|Weight|Style|Stretch|Variant)?|lineHeight|letterSpacing)$/;
const SPACING_PROPERTIES = /^(?:(?:margin|padding)(?:Top|Right|Bottom|Left|Block(?:Start|End)?|Inline(?:Start|End)?)?|(?:row|column)?[Gg]ap|gap|border(?:TopLeft|TopRight|BottomLeft|BottomRight|StartStart|StartEnd|EndStart|EndEnd)?Radius|textIndent)$/;
const SAFE_VALUE = /^(?:inherit|initial|unset|revert|revert-layer|normal|auto|none)$/i;
const COLOR_NAMES = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen').split(' '));

function posix(file) { return file.split(path.sep).join('/'); }
function camelCase(property) { return property.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
function normalizeEvidence(value) { return value.replace(/\s+/g, ' ').trim(); }

/** Mask comments without changing offsets, including comments in embedded CSS. */
export function maskCssComments(source) {
  let result = '';
  let quote = null;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quote) {
      result += c;
      if (c === '\\' && i + 1 < source.length) result += source[++i];
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
      result += c;
    } else if (c === '/' && source[i + 1] === '*') {
      result += '  ';
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        result += source[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < source.length) { result += '  '; i++; }
    } else result += c;
  }
  return result;
}

function maskCssStrings(source) {
  return source.replace(/(["'])(?:\\[\s\S]|(?!\1)[^\\])*?\1/g, (value) => value.replace(/[^\n]/g, ' '));
}

/** Small declaration lexer: nested rules, comments, strings, and functions are balanced. */
export function cssDeclarations(source) {
  const clean = maskCssComments(source);
  const declarations = [];
  const blocks = [];
  let segmentStart = 0;
  let quote = null;
  let parens = 0;
  let brackets = 0;
  function addDeclaration(end) {
    if (!blocks.length) return;
    const segment = clean.slice(segmentStart, end);
    const match = /^(\s*)(--[\w-]+|[a-zA-Z][\w-]*)\s*:\s*([\s\S]*)$/.exec(segment);
    if (!match) return;
    const start = segmentStart + match[1].length;
    const colon = clean.indexOf(':', start);
    const valueStart = colon + 1 + /^\s*/.exec(clean.slice(colon + 1, end))[0].length;
    declarations.push({ property: match[2], value: clean.slice(valueStart, end).trim(), start, valueStart, end, fontFace: blocks.some((block) => /^@font-face\b/i.test(block)) });
  }
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') parens++;
    else if (c === ')') parens = Math.max(0, parens - 1);
    else if (c === '[') brackets++;
    else if (c === ']') brackets = Math.max(0, brackets - 1);
    else if (!parens && !brackets) {
      if (c === '{') {
        blocks.push(clean.slice(segmentStart, i).trim());
        segmentStart = i + 1;
      } else if (c === '}') {
        addDeclaration(i);
        blocks.pop();
        segmentStart = i + 1;
      } else if (c === ';') {
        addDeclaration(i);
        segmentStart = i + 1;
      }
    }
  }
  return declarations;
}

function location(source, offset) {
  const prefix = source.slice(0, offset);
  const line = prefix.split('\n').length;
  return { line, column: offset - prefix.lastIndexOf('\n') };
}

function collector(file, source) {
  const findings = [];
  const seen = new Set();
  return {
    findings,
    add(rule, offset, evidence, property) {
      const key = `${rule}:${offset}:${property ?? ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      const normalized = normalizeEvidence(evidence);
      const fingerprint = createHash('sha256').update(JSON.stringify([file, rule, property ?? '', normalized])).digest('hex');
      findings.push({ rule, file, ...location(source, offset), ...(property ? { property } : {}), evidence: normalized, message: RULES[rule], fingerprint });
    },
  };
}

function inkReferences(value) {
  const matches = [];
  const clean = maskCssComments(value);
  const pattern = /\bvar\(\s*(--ink-[a-z0-9_-]+)(?=\s*[,\)])/gi;
  for (const match of clean.matchAll(pattern)) matches.push({ token: match[1], offset: match.index });
  return matches;
}

/** Remove token fallbacks and asset URLs before testing hardcoded appearance. */
function withoutFunctions(value, names) {
  let result = value;
  const pattern = new RegExp(`\\b(?:${names.join('|')})\\(`, 'gi');
  let match;
  while ((match = pattern.exec(result))) {
    let depth = 1;
    let quote = null;
    let end = pattern.lastIndex;
    for (; end < result.length && depth; end++) {
      const c = result[end];
      if (quote) {
        if (c === '\\') end++;
        else if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    result = `${result.slice(0, match.index)}TOKEN${result.slice(end)}`;
    pattern.lastIndex = match.index + 5;
  }
  return result;
}

function appearanceRules(property, value, isNumber = false) {
  const prop = camelCase(property);
  const clean = withoutFunctions(maskCssComments(String(value)), ['var', 'url']).replace(/\s*!important\s*$/i, '').trim();
  if (!clean || SAFE_VALUE.test(clean) || clean === 'TOKEN') return [];
  if (COLOR_PROPERTIES.test(prop)) {
    const hasLiteral = /#[\da-f]{3,8}\b/i.test(clean)
      || /\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\s*\(/i.test(clean)
      || [...clean.matchAll(/\b[a-z]+\b/gi)].some(([word]) => COLOR_NAMES.has(word.toLowerCase()));
    return hasLiteral ? ['hardcoded-color'] : [];
  }
  if (TYPOGRAPHY_PROPERTIES.test(prop)) {
    // Template substitutions and unresolved JS expressions are not assumed literal.
    if (clean.includes('${')) return [];
    return ['hardcoded-typography'];
  }
  if (SPACING_PROPERTIES.test(prop)) {
    if (isNumber) return Number(value) === 0 ? [] : ['hardcoded-spacing'];
    const numbers = [...clean.replace(/TOKEN/g, '').matchAll(/(-?(?:\d*\.)?\d+)([a-z%]*)/gi)];
    // A scalar in token arithmetic is not a hardcoded CSS length.
    if (numbers.some(([, n, unit]) => Number(n) !== 0 && (unit || !/\b(?:calc|min|max|clamp)\(/i.test(clean)))) return ['hardcoded-spacing'];
  }
  return [];
}

export function scanCssSource(file, source, tokens) {
  const result = collector(file, source);
  for (const declaration of cssDeclarations(source)) {
    const { property, value, start, valueStart, fontFace } = declaration;
    for (const ref of inkReferences(maskCssStrings(value))) {
      if (!tokens.has(ref.token)) result.add('undefined-ink-token', valueStart + ref.offset, ref.token, property);
    }
    if (fontFace || property.startsWith('--')) continue;
    for (const rule of appearanceRules(property, value)) result.add(rule, start, `${property}: ${value}`, property);
    if (property === 'display' && /^(?:inline-)?(?:flex|grid)(?:\s*!important)?$/i.test(value)) {
      result.add('layout-bypass', start, `${property}: ${value}`, property);
    }
  }
  return result.findings;
}

function isDeepDesignImport(specifier, file) {
  if (/^@\/design-system\//.test(specifier)) return true;
  if (!specifier.startsWith('.')) return false;
  const target = posix(path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier)));
  return target.startsWith('src/design-system/') && !/^src\/design-system\/index(?:\.[jt]sx?)?$/.test(target);
}

function stringValue(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  return null;
}

function unwrapped(node) {
  while (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isTypeAssertionExpression(node))) node = node.expression;
  return node;
}

function literalValue(node) {
  node = unwrapped(node);
  if (!node) return null;
  if (ts.isStringLiteralLike(node)) return { value: node.text, numeric: false };
  if (ts.isNumericLiteral(node)) return { value: Number(node.text), numeric: true };
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand) && (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.PlusToken)) {
    return { value: Number(node.operand.text) * (node.operator === ts.SyntaxKind.MinusToken ? -1 : 1), numeric: true };
  }
  return null;
}

export function scanTsSource(file, source, tokens) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const result = collector(file, source);
  const variables = new Map();
  const styleObjects = new Map();

  function collectVariables(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      // Resolve only file-unique bindings. Ambiguous shadowed names are skipped.
      variables.set(node.name.text, variables.has(node.name.text) ? null : node.initializer);
    }
    ts.forEachChild(node, collectVariables);
  }
  collectVariables(ast);

  function markStyle(expression, rawLayout = false, seen = new Set()) {
    const node = unwrapped(expression);
    if (!node || seen.has(node)) return;
    seen.add(node);
    if (ts.isObjectLiteralExpression(node)) {
      styleObjects.set(node, (styleObjects.get(node) ?? false) || rawLayout);
      for (const prop of node.properties) if (ts.isSpreadAssignment(prop)) markStyle(prop.expression, rawLayout, seen);
    } else if (ts.isIdentifier(node)) {
      markStyle(variables.get(node.text), rawLayout, seen);
    } else if (ts.isConditionalExpression(node)) {
      markStyle(node.whenTrue, rawLayout, seen);
      markStyle(node.whenFalse, rawLayout, seen);
    } else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) {
      markStyle(node.left, rawLayout, seen);
      markStyle(node.right, rawLayout, seen);
    }
  }

  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
      const value = stringValue(node.moduleSpecifier);
      if (value && isDeepDesignImport(value, file)) result.add('deep-design-system-import', node.moduleSpecifier.getStart(ast), value);
    }
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const value = node.arguments[0] && stringValue(node.arguments[0]);
      if (value && isDeepDesignImport(value, file)) result.add('deep-design-system-import', node.arguments[0].getStart(ast), value);
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(ast);
      if (RAW_CONTROLS.has(tag)) result.add('raw-control', node.getStart(ast), `<${tag}>`, tag);
      for (const attr of node.attributes.properties) {
        if (ts.isJsxAttribute(attr) && attr.name.getText(ast) === 'style' && attr.initializer && ts.isJsxExpression(attr.initializer)) {
          markStyle(attr.initializer.expression, RAW_LAYOUT.has(tag));
        }
      }
    }
    if (ts.isPropertyAssignment(node) && node.name.getText(ast).replace(/^['"]|['"]$/g, '') === 'style') markStyle(node.initializer);
    if (ts.isVariableDeclaration(node) && node.type && /\bCSSProperties\b/.test(node.type.getText(ast))) markStyle(node.initializer);
    if ((ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) && /\bCSSProperties\b/.test(node.type.getText(ast))) markStyle(node.expression);
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const rawText = node.getText(ast);
      let nextTokenStart = 0;
      for (const ref of inkReferences(node.text)) {
        // Literal escape sequences can change decoded lengths and line counts.
        // Locate the original token spelling so locations refer to actual source.
        const rawOffset = rawText.indexOf(ref.token, nextTokenStart);
        if (rawOffset >= 0) nextTokenStart = rawOffset + ref.token.length;
        if (!tokens.has(ref.token)) result.add('undefined-ink-token', node.getStart(ast) + Math.max(0, rawOffset), ref.token);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);

  function inspectValue(expression, callback, seen = new Set()) {
    const node = unwrapped(expression);
    if (!node || seen.has(node)) return;
    seen.add(node);
    const literal = literalValue(node);
    if (literal) callback(literal);
    else if (ts.isIdentifier(node)) inspectValue(variables.get(node.text), callback, seen);
    else if (ts.isConditionalExpression(node)) {
      inspectValue(node.whenTrue, callback, seen);
      inspectValue(node.whenFalse, callback, seen);
    }
  }
  for (const [object, rawLayout] of styleObjects) {
    for (const property of object.properties) {
      if ((!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) || ts.isComputedPropertyName(property.name)) continue;
      const name = property.name.getText(ast).replace(/^['"]|['"]$/g, '');
      inspectValue(ts.isShorthandPropertyAssignment(property) ? property.name : property.initializer, ({ value, numeric }) => {
        for (const rule of appearanceRules(name, value, numeric)) result.add(rule, property.getStart(ast), `${name}: ${JSON.stringify(value)}`, name);
        if (rawLayout && name === 'display' && /^(?:inline-)?(?:flex|grid)$/.test(String(value))) {
          result.add('layout-bypass', property.getStart(ast), `${name}: ${JSON.stringify(value)}`, name);
        }
      });
    }
  }
  return result.findings;
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(filename) : entry.isFile() ? [filename] : [];
  });
}

export function createBaseline(findings) {
  const counts = new Map();
  for (const finding of findings) {
    const current = counts.get(finding.fingerprint);
    if (current) current.count++;
    else counts.set(finding.fingerprint, { fingerprint: finding.fingerprint, count: 1, rule: finding.rule, file: finding.file, ...(finding.property ? { property: finding.property } : {}), evidence: finding.evidence });
  }
  return {
    schemaVersion: 1,
    description: 'Known static debt only. Fingerprints omit line numbers and count matching file/rule/property/evidence occurrences. This baseline is not visual approval.',
    entries: [...counts.values()].sort((a, b) => a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule) || a.fingerprint.localeCompare(b.fingerprint)),
  };
}

export function compareBaseline(findings, baseline) {
  if (baseline && (baseline.schemaVersion !== 1 || !Array.isArray(baseline.entries))) throw new Error('Unsupported baseline format; expected schemaVersion 1 and entries.');
  const remaining = new Map();
  for (const entry of baseline?.entries ?? []) {
    if (typeof entry.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(entry.fingerprint) || !Number.isSafeInteger(entry.count) || entry.count < 1) throw new Error('Malformed baseline entry.');
    remaining.set(entry.fingerprint, (remaining.get(entry.fingerprint) ?? 0) + entry.count);
  }
  const annotated = findings.map((finding) => {
    const count = remaining.get(finding.fingerprint) ?? 0;
    if (count > 0) remaining.set(finding.fingerprint, count - 1);
    return { ...finding, status: count > 0 ? 'existing' : 'new' };
  });
  return { findings: annotated, resolvedBaselineCount: [...remaining.values()].reduce((sum, count) => sum + count, 0) };
}

export function auditProject(root, { baseline = null } = {}) {
  const files = walkFiles(path.join(root, 'src'));
  const cssFiles = files.filter((file) => file.endsWith('.css'));
  const tokens = new Set();
  for (const file of cssFiles) {
    for (const declaration of cssDeclarations(readFileSync(file, 'utf8'))) if (declaration.property.startsWith('--ink-')) tokens.add(declaration.property);
  }
  const appFiles = files.filter((file) => {
    const relative = posix(path.relative(root, file));
    return SOURCE_EXTENSIONS.test(relative) && !relative.startsWith('src/design-system/') && !relative.startsWith('src/ai-system/') && !relative.endsWith('.figma.ts');
  });
  const rawFindings = appFiles.flatMap((file) => {
    const relative = posix(path.relative(root, file));
    const source = readFileSync(file, 'utf8');
    return relative.endsWith('.css') ? scanCssSource(relative, source, tokens) : scanTsSource(relative, source, tokens);
  }).sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule));
  const compared = compareBaseline(rawFindings, baseline);
  const byRule = Object.fromEntries(Object.keys(RULES).map((rule) => [rule, {
    total: compared.findings.filter((finding) => finding.rule === rule).length,
    new: compared.findings.filter((finding) => finding.rule === rule && finding.status === 'new').length,
  }]));
  return {
    schemaVersion: 1,
    scope: {
      sourceFiles: appFiles.map((file) => posix(path.relative(root, file))),
      tokenDefinitionCssFiles: cssFiles.length,
      definedInkTokens: tokens.size,
      excluded: ['src/design-system/**', 'src/ai-system/**', '**/*.figma.ts'],
    },
    limitations: [
      'Static source audit; no claim about visual fidelity, accessible behavior, runtime rendering, or all design-system prop contracts.',
      'Appearance rules inspect CSS declarations and literal values in JSX style objects, style-named object properties, and CSSProperties annotations/assertions. File-unique variable bindings, spreads, and conditional literals are resolved; arbitrary calls, computed values, imported styles, and dynamically built properties are not evaluated.',
      'Layout bypass covers display:flex/grid in CSS and style objects used on raw HTML layout elements; it is not a complete inventory of custom layout.',
      'Ink token definitions are a global union of source CSS, without cascade/scope or load-order analysis. Fallbacks do not make an undefined token valid.',
      'Token fallbacks, asset URLs, zero spacing, structural width/height/position values, font-face declarations, and SVG/data color attributes are excluded from appearance debt.',
      'Fingerprint baselines accept counted matching file/rule/property/evidence occurrences and do not certify the code location or design quality.',
    ],
    summary: {
      total: compared.findings.length,
      existing: compared.findings.filter((finding) => finding.status === 'existing').length,
      new: compared.findings.filter((finding) => finding.status === 'new').length,
      resolvedBaselineCount: compared.resolvedBaselineCount,
      byRule,
    },
    findings: compared.findings,
  };
}

function readableSummary(report, baselineFile) {
  const lines = [
    'Design-system static source audit (not a visual fidelity score)',
    `${report.scope.sourceFiles.length} application files; ${report.scope.definedInkTokens} Ink tokens defined across ${report.scope.tokenDefinitionCssFiles} CSS files.`,
    `${report.summary.total} findings: ${report.summary.existing} existing, ${report.summary.new} new, ${report.summary.resolvedBaselineCount} baseline occurrences resolved.`,
    `Baseline: ${baselineFile ?? 'none'}`,
    '',
    ...Object.entries(report.summary.byRule).map(([rule, count]) => `  ${rule.padEnd(28)} ${String(count.total).padStart(5)} total  ${String(count.new).padStart(5)} new`),
  ];
  const added = report.findings.filter((finding) => finding.status === 'new');
  if (added.length) {
    lines.push('', 'New findings (first 30; use --json <path> for all evidence):');
    for (const finding of added.slice(0, 30)) lines.push(`  ${finding.file}:${finding.line}:${finding.column} [${finding.rule}] ${finding.evidence}`);
  }
  lines.push('', 'Coverage: literal app styles, raw controls, deep imports, and undefined CSS tokens. Computed styles and visual parity require separate review.');
  return lines.join('\n');
}

export function runCli(args = process.argv.slice(2)) {
  let root = process.cwd();
  let baselineArg = DEFAULT_BASELINE;
  let jsonPath;
  let format = 'text';
  let writeBaseline = false;
  let reportOnly = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node scripts/design-system-audit.mjs [--json <path>] [--format json] [--baseline <path> | --no-baseline] [--write-baseline] [--report-only] [--root <path>]\n\nDefault: fail on findings not in the baseline. --write-baseline explicitly accepts current static debt.');
      return 0;
    }
    if (['--root', '--baseline', '--json', '--format'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value.`);
      if (arg === '--root') root = path.resolve(value);
      if (arg === '--baseline') baselineArg = value;
      if (arg === '--json') jsonPath = value;
      if (arg === '--format') format = value;
    } else if (arg === '--no-baseline') baselineArg = null;
    else if (arg === '--write-baseline') writeBaseline = true;
    else if (arg === '--report-only') reportOnly = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['text', 'json'].includes(format)) throw new Error('--format must be text or json.');
  if (writeBaseline && !baselineArg) throw new Error('--write-baseline requires a baseline path.');
  if (!existsSync(path.join(root, 'src'))) throw new Error(`No src directory in ${root}.`);
  const baselinePath = baselineArg && path.resolve(root, baselineArg);
  let baseline = baselinePath && existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
  if (baselineArg !== DEFAULT_BASELINE && baselinePath && !baseline && !writeBaseline) throw new Error(`Baseline does not exist: ${baselinePath}`);
  let report = auditProject(root, { baseline });
  if (writeBaseline) {
    baseline = createBaseline(report.findings);
    writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    report = auditProject(root, { baseline });
  }
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (jsonPath) writeFileSync(path.resolve(root, jsonPath), json);
  if (format === 'json') process.stdout.write(json);
  else console.log(readableSummary(report, baselinePath ? posix(path.relative(root, baselinePath)) : null));
  return reportOnly || report.summary.new === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = runCli(); }
  catch (error) { console.error(`Design-system audit failed: ${error.message}`); process.exitCode = 2; }
}
