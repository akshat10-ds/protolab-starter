"""Read-only, explicit-name Standard-mode comparison; not a pixel fidelity score."""
from pathlib import Path
import json, re, collections, gzip

HERE = Path(__file__).parent
ROOT = HERE.parents[1]
data = json.loads(gzip.open(HERE / 'evidence/variables-resolved.json.gz','rt').read())
styles = json.loads(gzip.open(HERE / 'evidence/variables-and-styles.json.gz','rt').read())
css = re.sub(r'/\*.*?\*/', '', (ROOT / 'src/design-system/1-tokens/tokens.css').read_text(), flags=re.S)
tokens = dict(re.findall(r'(--ink-[\w-]+)\s*:\s*([^;]+);', css))

def kebab(s):
    return re.sub(r'([a-z0-9])([A-Z])', r'\1-\2', re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1-\2', s)).lower()

def token_name(name):
    leaf=name.split('/')[-1]
    if '@dep' in name or 'Deprecated/' in name: return None
    if name.startswith('Internal/color/'):
        return '--ink-' + '-'.join(p for p in name.split('/')[2:] if p not in {'semantic','accent'})
    if not name.startswith('Published/'): return None
    special={'fontColorSubtle':'font-color-neutral-subtle','fontColorLink':'font-color-link-default','fontColorLinkSubtle':'font-color-link-subtle-default','radiusSizeNone':'radius-none','focusColor':'focus-color-default','barStopIndicator':'bar-stop-indicator-color'}
    if leaf in special: return '--ink-'+special[leaf]
    if leaf.startswith('gap'): return '--ink-spacing-'+leaf[3:]
    if leaf.startswith('deviceBreakpoint'): return '--ink-breakpoint-'+leaf[16:].lower()
    if leaf.startswith('ctaToggleBgColor'): return '--ink-cta-toggle-bg-'+kebab(leaf[16:])
    if leaf.startswith('ctaFabBgColor'): return '--ink-cta-fab-bg-'+kebab(leaf[13:])
    if leaf.startswith('ctaComboBorderColor') and leaf.endswith('Default'): return '--ink-cta-combo-border-'+kebab(leaf[19:-7])
    if leaf.startswith('formBgColor'): return '--ink-form-control-bg-color-'+kebab(leaf[11:])
    if leaf.startswith('formBorderColor'): return '--ink-form-control-border-color-'+kebab(leaf[15:])
    if leaf.startswith('formTextColor'): return '--ink-form-control-font-color-'+kebab(leaf[13:])
    if leaf.startswith('formThumbBgColor'): return '--ink-form-control-thumb-bg-'+kebab(leaf[16:])
    if leaf=='formHighlightBgColorDefault': return '--ink-form-control-bg-color-highlight'
    if leaf=='formBorderWidth': return '--ink-form-control-border-width'
    if leaf=='formBorderWidthActive': return '--ink-form-control-border-width-active'
    return '--ink-'+kebab(leaf)

def css_resolve(name, seen=None):
    seen=set() if seen is None else set(seen)
    if name in seen: return None
    seen.add(name)
    raw=tokens.get(name)
    if raw is None: return None
    raw=raw.strip()
    m=re.fullmatch(r'var\(\s*(--ink-[\w-]+)\s*\)',raw)
    return css_resolve(m[1],seen) if m else raw

def color(raw):
    if raw is None: return None
    if re.fullmatch(r'#[0-9a-fA-F]{6}',raw): return tuple(int(raw[i:i+2],16) for i in (1,3,5))+(1.0,)
    if re.fullmatch(r'#[0-9a-fA-F]{3}',raw): return tuple(int(raw[i]*2,16) for i in (1,2,3))+(1.0,)
    m=re.fullmatch(r'rgba?\(([^)]+)\)',raw)
    if m:
        vals=[float(x.strip()) for x in m[1].split(',')]
        return tuple(vals[:3])+(vals[3] if len(vals)>3 else 1.0,)
    return None

records=[]
for v in data:
    if v['collection']!='Ink': continue
    name=token_name(v['name'])
    r={'figmaId':v['id'],'figmaName':v['name'],'cssToken':name,'mode':'Standard','figmaValue':v['modes'].get('Standard')}
    if not name: r['status']='excluded_deprecated_or_nonsemantic'
    elif name not in tokens: r['status']='no_explicit_name_mapping'
    else:
        raw=css_resolve(name);r['cssValue']=raw
        val=r['figmaValue']
        if v['type']=='COLOR':
            a=color(raw);b=(round(val['r']*255),round(val['g']*255),round(val['b']*255),val.get('a',1))
            r['status']='equal' if (raw=='transparent' and abs(b[3])<0.002) or (a and all(abs(x-y)<0.002 for x,y in zip(a,b))) else 'different' if a else 'unparsed_css'
        elif v['type']=='FLOAT':
            try: r['status']='equal' if abs(float(raw.removesuffix('px'))-val)<0.002 else 'different'
            except (ValueError,TypeError,AttributeError): r['status']='unparsed_css'
        else:r['status']='not_compared'
    records.append(r)

typography=[]
for s in styles['textStyles']:
    k='--ink-'+kebab(s['name'])
    size=css_resolve(k+'-size');line=css_resolve(k+'-line-height')
    typography.append({'figmaStyleId':s['id'],'figmaName':s['name'],'figmaSize':s['fontSize'],'figmaLineHeight':s['lineHeight'],'figmaFont':s['fontName'],'cssSizeToken':k+'-size','cssSize':size,'cssLineHeight':line})

result={'scope':'Current Ink collection, explicit-name Standard-mode candidates only. No inferred value matches; inverse/touch runtime not compared. Mismatches require semantic review, not automatic fixes.','cssDeclarationCount':len(tokens),'counts':dict(collections.Counter(r['status'] for r in records)),'variables':records,'textStyleCandidates':typography,'glass':{'figmaEffectStyleId':next(s['id'] for s in styles['effectStyles'] if s['name']=='elevationGlass'),'figmaBlur':16,'cssToken':'--ink-elevation-glass','cssValue':css_resolve('--ink-elevation-glass')}}
(HERE/'evidence/token-comparison.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'counts':result['counts'],'cssDeclarationCount':result['cssDeclarationCount'],'different':[r for r in records if r['status']=='different'],'glass':result['glass']},indent=2))
