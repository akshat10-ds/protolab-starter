import { createHash } from 'node:crypto';

export const slug = value => value.replace(/(^|\/)-(?=\d)/g, '$1negative-').replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2').replace(/([a-z\d])([A-Z])/g, '$1-$2').replace(/([a-z])(\d)/g, '$1-$2').replace(/[^a-zA-Z\d-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
const numeric = value => {
  if (!Number.isFinite(value)) throw new Error(`Non-finite token: ${value}`);
  return String(Object.is(value, -0) ? 0 : value);
};
export const colorCss = value => `rgba(${numeric(value.r * 255)}, ${numeric(value.g * 255)}, ${numeric(value.b * 255)}, ${numeric(value.a ?? 1)})`;
export const compatibilityAliases = {
  '--ink-font-color-primary':'--ink-font-color-default',
  '--ink-font-color-secondary':'--ink-font-color-neutral-subtle',
  '--ink-cta-font-color-brand':'--ink-font-color-inverse',
  '--ink-cta-font-color-primary':'--ink-font-color-inverse',
  '--ink-cta-font-color-danger':'--ink-font-color-inverse',
  '--ink-cta-font-color-secondary':'--ink-font-color-default',
  '--ink-cta-font-color-tertiary':'--ink-font-color-default',
};

export function tokenName(variable, collection) {
  const name = variable.name;
  const leaf = name.split('/').at(-1);
  if (collection.name.startsWith('_DEPRECATED')) return `--ink-deprecated-${slug(name.replace(/^OLD_TOKENS\//, ''))}`;
  if (collection.name === '_Utilities') return `--ink-utility-${slug(name.replace(/^Internal\//, ''))}`;
  if (/@dep|Deprecated\//i.test(name)) return `--ink-deprecated-local-${slug(name)}`;
  if (name.startsWith('Internal/color/')) return '--ink-' + name.split('/').slice(2).filter(part => !['semantic', 'accent'].includes(part)).map(slug).join('-');
  if (name.startsWith('Internal/dimension/')) return '--ink-dimension-' + slug(leaf);
  const special = {
    fontColorSubtle: 'font-color-neutral-subtle', fontColorSubtleInverse: 'font-color-neutral-subtle-inverse',
    fontColorLink: 'font-color-link-default', fontColorLinkSubtle: 'font-color-link-subtle-default',
    radiusSizeNone: 'radius-none', focusColor: 'focus-color-default', barStopIndicator: 'bar-stop-indicator-color',
    formHighlightBgColorDefault: 'form-control-bg-color-highlight', formBorderWidth: 'form-control-border-width', formBorderWidthActive: 'form-control-border-width-active',
  };
  if (special[leaf]) return '--ink-' + special[leaf];
  const prefixes = [
    ['gap', 'spacing-'], ['deviceBreakpoint', 'breakpoint-'],
    ['ctaToggleBgColor', 'cta-toggle-bg-'], ['ctaFabBgColor', 'cta-fab-bg-'],
    ['formBgColor', 'form-control-bg-color-'], ['formBorderColor', 'form-control-border-color-'],
    ['formTextColor', 'form-control-font-color-'], ['formThumbBgColor', 'form-control-thumb-bg-'],
  ];
  for (const [prefix, target] of prefixes) if (leaf.startsWith(prefix)) return '--ink-' + target + slug(leaf.slice(prefix.length));
  if (leaf.startsWith('ctaComboBorderColor') && leaf.endsWith('Default')) return '--ink-cta-combo-border-' + slug(leaf.slice(19, -7));
  return '--ink-' + slug(leaf);
}

export function unitFor(variable) {
  if (variable.type !== 'FLOAT') return '';
  if (/fontWeight|opacity|alpha|scale|zIndex/i.test(variable.name) && !variable.name.startsWith('Internal/dimension/')) return '';
  if (variable.scopes.includes('LINE_HEIGHT')) return '%';
  return 'px';
}

export function makeModel(snapshot) {
  const collections = new Map(snapshot.collections.map(collection => [collection.id, collection]));
  const variables = new Map(snapshot.variables.map(variable => [variable.id, variable]));
  if (variables.size !== snapshot.variables.length) throw new Error('Duplicate Figma variable IDs');
  const used = new Map();
  const entries = snapshot.variables.map(variable => {
    const collection = collections.get(variable.collectionId);
    if (!collection) throw new Error(`Missing collection: ${variable.id}`);
    const cssToken = tokenName(variable, collection);
    if (used.has(cssToken)) throw new Error(`Token name collision ${cssToken}: ${used.get(cssToken)} / ${variable.name}`);
    used.set(cssToken, variable.name);
    if (collection.modes.length !== Object.keys(variable.valuesByMode).length) throw new Error(`Incomplete mode export: ${variable.name}`);
    return { ...variable, collection: collection.name, cssToken, unit: unitFor(variable) };
  });
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  function modeFor(entry, selection = {}) {
    const collection = collections.get(entry.collectionId);
    const requested = selection[collection.name];
    const mode = requested ? collection.modes.find(mode => mode.name === requested) : collection.modes.find(mode => mode.modeId === collection.defaultModeId);
    if (!mode) throw new Error(`Unknown mode ${collection.name}: ${requested}`);
    return mode.modeId;
  }
  function value(id, selection = {}, seen = new Set()) {
    if (seen.has(id)) throw new Error(`Cyclic Figma alias: ${id}`);
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unresolved Figma alias: ${id}`);
    const raw = entry.valuesByMode[modeFor(entry, selection)];
    if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') return value(raw.id, selection, new Set([...seen, id]));
    return raw;
  }
  function literal(entry, selection = {}) {
    const raw = value(entry.id, selection);
    if (entry.type === 'COLOR') return colorCss(raw);
    if (entry.type === 'FLOAT') return numeric(raw) + entry.unit;
    if (entry.type === 'STRING') return JSON.stringify(raw);
    if (entry.type === 'BOOLEAN') return raw ? '1' : '0';
    throw new Error(`Unsupported Figma type: ${entry.type}`);
  }
  function declaration(entry, modeId) {
    const raw = entry.valuesByMode[modeId];
    if (raw && typeof raw === 'object' && raw.type === 'VARIABLE_ALIAS') {
      const target = byId.get(raw.id);
      if (!target) throw new Error(`Unresolved Figma alias: ${entry.name} → ${raw.id}`);
      if (target.type !== entry.type) throw new Error(`Alias type mismatch: ${entry.name}`);
      return `var(${target.cssToken})`;
    }
    const mode = collections.get(entry.collectionId).modes.find(mode => mode.modeId === modeId);
    return literal(entry, { [entry.collection]: mode.name });
  }
  // Resolve every value now, including unused/deprecated aliases. No exclusions.
  for (const entry of entries) for (const mode of collections.get(entry.collectionId).modes) value(entry.id, { [entry.collection]: mode.name });
  return { snapshot, collections, entries, byId, value, literal, declaration };
}

export function parseDeclarations(body) {
  const result = new Map();
  let start = 0, depth = 0, quote = '';
  for (let index = 0; index < body.length; index++) {
    const ch = body[index];
    if (quote) { if (ch === quote && body[index - 1] !== '\\') quote = ''; }
    else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      const declaration = body.slice(start, index).trim(); start = index + 1;
      const at = declaration.indexOf(':');
      if (at > 0 && declaration.startsWith('--ink-')) result.set(declaration.slice(0, at).trim(), declaration.slice(at + 1).trim());
    }
  }
  return result;
}

export function cssScopes(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(match => ({ selector: match[1].trim(), declarations: parseDeclarations(match[2]) }));
}

export function tokensInScope(css, selection = {}) {
  const tokens = new Map();
  const attributes = { 'Ink': 'data-ink-mode', '_Utilities': 'data-ink-utilities-mode', '_DEPRECATED_Ink (1.0)': 'data-ink-deprecated-mode' };
  const accepted = Object.entries(selection).map(([collection, mode]) => `[${attributes[collection]}="${slug(mode)}"]`);
  for (const scope of cssScopes(css)) if (scope.selector.split(',').some(selector => selector.trim() === ':root' || accepted.includes(selector.trim()))) {
    for (const [key, value] of scope.declarations) tokens.set(key, value);
  }
  return tokens;
}

export function resolveCss(name, tokens, seen = new Set()) {
  if (seen.has(name)) throw new Error(`CSS alias cycle: ${name}`);
  const raw = tokens.get(name);
  if (raw === undefined) throw new Error(`Missing CSS token: ${name}`);
  return raw.replace(/var\(\s*(--ink-[\w-]+)\s*\)/g, (_, alias) => resolveCss(alias, tokens, new Set([...seen, name])));
}

function boundColor(raw, binding, model, selection) {
  return colorCss(binding?.id ? model.value(binding.id, selection) : raw);
}

export function styleDeclarations(styles, model, selection = {}) {
  const output = new Map();
  const coverage = [];
  const set = (tokens, name, value) => { output.set(name, value); tokens.push(name); };
  for (const style of styles.textStyles) {
    const prefix = '--ink-' + slug(style.name);
    const tokens = [];
    const weights = Object.fromEntries(model.entries.filter(entry => /fontWeight\/\d+$/.test(entry.name)).map(entry => [model.value(entry.id), Number(entry.name.split('/').at(-1))]));
    const weight = weights[style.fontName.style];
    if (weight === undefined) throw new Error(`Unmapped font style: ${style.fontName.style}`);
    set(tokens, prefix + '-size', numeric(style.fontSize) + 'px');
    set(tokens, prefix + '-line-height', style.lineHeight.unit === 'AUTO' ? 'normal' : style.lineHeight.unit === 'PERCENT' ? numeric(style.lineHeight.value / 100) : numeric(style.lineHeight.value) + 'px');
    set(tokens, prefix + '-family', JSON.stringify(style.fontName.family));
    set(tokens, prefix + '-weight', String(weight));
    set(tokens, prefix + '-letter-spacing', numeric(style.letterSpacing.value / (style.letterSpacing.unit === 'PERCENT' ? 100 : 1)) + (style.letterSpacing.unit === 'PERCENT' ? 'em' : 'px'));
    set(tokens, prefix + '-text-transform', ({UPPER:'uppercase',LOWER:'lowercase',TITLE:'capitalize',ORIGINAL:'none'})[style.textCase] ?? 'none');
    set(tokens, prefix + '-text-decoration', ({UNDERLINE:'underline',STRIKETHROUGH:'line-through',NONE:'none'})[style.textDecoration] ?? 'none');
    set(tokens, prefix + '-paragraph-spacing', numeric(style.paragraphSpacing) + 'px');
    set(tokens, prefix + '-paragraph-indent', numeric(style.paragraphIndent) + 'px');
    coverage.push({id:style.id,name:style.name,type:'text',tokens});
  }
  for (const style of styles.effectStyles) {
    const prefix = '--ink-' + slug(style.name), tokens = [], shadows = [];
    let blur = '0px';
    for (const effect of style.effects.filter(effect => effect.visible !== false)) {
      if (effect.type === 'BACKGROUND_BLUR') blur = numeric(effect.radius) + 'px';
      else if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') shadows.push(`${effect.type === 'INNER_SHADOW' ? 'inset ' : ''}${numeric(effect.offset.x)}px ${numeric(effect.offset.y)}px ${numeric(effect.radius)}px ${numeric(effect.spread ?? 0)}px ${boundColor(effect.color,effect.boundVariables?.color,model,selection)}`);
      else throw new Error(`Unsupported effect ${style.name}: ${effect.type}`);
    }
    set(tokens, prefix, shadows.length ? shadows.join(', ') : blur);
    set(tokens, prefix + '-shadow', shadows.join(', ') || 'none');
    set(tokens, prefix + '-backdrop-blur', blur);
    coverage.push({id:style.id,name:style.name,type:'effect',tokens});
  }
  for (const style of styles.paintStyles) {
    const tokens = [], images = [];
    for (const paint of style.paints.filter(paint => paint.visible !== false)) {
      if (paint.type !== 'GRADIENT_LINEAR') throw new Error(`Unsupported paint ${style.name}: ${paint.type}`);
      // Figma's first transform row gives t = a*x + b*y + c in object coordinates.
      // SVG objectBoundingBox preserves that field on every aspect ratio; a fixed
      // CSS angle would only match one reference box.
      const [a,b,c] = paint.gradientTransform[0], denominator = a*a + b*b;
      if (!denominator) throw new Error(`Degenerate gradient: ${style.name}`);
      const start = [-c*a/denominator,-c*b/denominator], end = [start[0]+a/denominator,start[1]+b/denominator];
      const stops = paint.gradientStops.map(stop => {
        const color = stop.boundVariables?.color?.id ? model.value(stop.boundVariables.color.id,selection) : stop.color;
        return `<stop offset="${stop.position}" stop-color="${colorCss({...color,a:1})}" stop-opacity="${(color.a ?? 1)*(paint.opacity ?? 1)}"/>`;
      }).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none"><defs><linearGradient id="g" x1="${start[0]}" y1="${start[1]}" x2="${end[0]}" y2="${end[1]}">${stops}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
      images.push(`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);
    }
    set(tokens, '--ink-' + slug(style.name.split('/').at(-1)), images.join(', '));
    coverage.push({id:style.id,name:style.name,type:'paint',tokens});
  }
  for (const style of styles.gridStyles) {
    const tokens = [], prefix = '--ink-grid-' + slug(style.name);
    style.grids.forEach((grid,index) => {
      for (const [field,value] of Object.entries(grid)) {
        if (field === 'boundVariables') continue;
        const name = `${prefix}-${index+1}-${slug(field)}`;
        const bound = grid.boundVariables?.[field];
        const resolved = bound?.id ? model.value(bound.id,selection) : value;
        set(tokens, name, field === 'color' ? colorCss(resolved) : typeof resolved === 'boolean' ? (resolved ? '1' : '0') : typeof resolved === 'number' ? numeric(resolved) + (field === 'count' ? '' : 'px') : JSON.stringify(resolved));
      }
    });
    coverage.push({id:style.id,name:style.name,type:'grid',tokens});
  }
  return {declarations:output,coverage};
}

export function generateTokens(snapshot, styles, compatibility) {
  const model = makeModel(snapshot);
  const legacy = tokensInScope(compatibility);
  const modern = model.entries.filter(entry => entry.collection === 'Ink' && !entry.cssToken.startsWith('--ink-deprecated-'));
  const inverseAliases = new Map();
  for (const entry of modern) {
    // Fixed inverse aliases retain their meaning even inside an Inverse scope.
    const base = entry.cssToken;
    const parts = base.slice(2).split('-');
    const candidates = [base + '-inverse', ...parts.slice(1).map((_,index)=>'--'+[...parts.slice(0,index+1),'inverse',...parts.slice(index+1)].join('-'))];
    if (base === '--ink-font-color-default' || base === '--ink-bg-color-default' || base === '--ink-icon-color-default') candidates.push(base.replace(/-default$/, '-inverse'));
    for (const name of candidates) if (name !== base && legacy.has(name) && !modern.some(entry => entry.cssToken === name)) inverseAliases.set(name, model.literal(entry,{Ink:'Inverse'}));
  }
  const lines = [compatibility.trim(), '', '/* BEGIN FIGMA TOKEN SYNC — generated from tokens/figma, do not edit. */'];
  const block = (selector, values) => { lines.push(`${selector} {`); for (const [key,value] of values) lines.push(`  ${key}: ${value};`); lines.push('}', ''); };
  const attributes = {Ink:'data-ink-mode',_Utilities:'data-ink-utilities-mode','_DEPRECATED_Ink (1.0)':'data-ink-deprecated-mode'};
  const shared = new Map([...legacy].filter(([name,value])=>value.includes('var(') && !model.entries.some(entry=>entry.cssToken===name)));
  for(const [alias,target] of Object.entries(compatibilityAliases)) shared.set(alias,`var(${target})`);
  for (const collection of snapshot.collections) {
    const entries = model.entries.filter(entry=>entry.collectionId===collection.id);
    for (const mode of collection.modes) {
      const values = new Map(entries.map(entry=>[entry.cssToken,model.declaration(entry,mode.modeId)]));
      if (collection.name === 'Ink') {
        for (const [key,value] of shared) values.set(key,value);
        for (const [key,value] of inverseAliases) values.set(key,value);
        for (const [key,value] of styleDeclarations(styles,model,{Ink:mode.name}).declarations) values.set(key,value);
      }
      const selector = `[${attributes[collection.name]}="${slug(mode.name)}"]`;
      block(mode.modeId === collection.defaultModeId ? `:root, ${selector}` : selector,values);
    }
  }
  lines.push('/* END FIGMA TOKEN SYNC */','');
  const manifest = {schemaVersion:1,fileKey:snapshot.fileKey,capturedDate:snapshot.capturedDate,snapshotHash:createHash('sha256').update(JSON.stringify({snapshot,styles})).digest('hex'),variables:model.entries.map(entry=>({id:entry.id,name:entry.name,collection:entry.collection,cssToken:entry.cssToken,type:entry.type,unit:entry.unit,modes:model.collections.get(entry.collectionId).modes})),styles:styleDeclarations(styles,model).coverage,inverseAliases:Object.fromEntries(inverseAliases),compatibilityAliases};
  return {css:lines.join('\n'),manifest,model};
}

export function previewData(snapshot,styles,manifest) {
  const model=makeModel(snapshot), groups=[];
  const attributes={Ink:'data-ink-mode',_Utilities:'data-ink-utilities-mode','_DEPRECATED_Ink (1.0)':'data-ink-deprecated-mode'};
  for(const collection of snapshot.collections) for(const mode of collection.modes) {
    const selection={[collection.name]:mode.name};
    const checks=model.entries.filter(entry=>entry.collectionId===collection.id).map(entry=>[entry.cssToken,model.literal(entry,selection)]);
    if(collection.name==='Ink') {
      checks.push(...styleDeclarations(styles,model,selection).declarations);
      for(const [alias,target] of Object.entries(compatibilityAliases)) checks.push([alias,model.literal(model.entries.find(entry=>entry.cssToken===target),selection)]);
    }
    groups.push({id:slug(collection.name)+'-'+slug(mode.name),attributes:{[attributes[collection.name]]:slug(mode.name)},checks});
  }
  const ink=snapshot.collections.find(collection=>collection.name==='Ink'),utilities=snapshot.collections.find(collection=>collection.name==='_Utilities');
  for(const a of ink.modes) for(const b of utilities.modes) {
    const selection={Ink:a.name,_Utilities:b.name};
    groups.push({id:'combined-'+slug(a.name)+'-'+slug(b.name),attributes:{'data-ink-mode':slug(a.name),'data-ink-utilities-mode':slug(b.name)},checks:model.entries.filter(entry=>entry.collection==='Ink'||entry.collection==='_Utilities').map(entry=>[entry.cssToken,model.literal(entry,selection)])});
  }
  return {snapshotHash:manifest.snapshotHash,capturedDate:snapshot.capturedDate,groups};
}
