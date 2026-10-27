"""Rebuild the audit ledger from saved read-only evidence (supports gzip snapshots)."""
from pathlib import Path
import json,gzip,re,collections

HERE=Path(__file__).parent
ROOT=HERE.parents[1]
E=HERE/'evidence'
def read(path):
    path=Path(path)
    if not path.exists() and Path(str(path)+'.gz').exists():path=Path(str(path)+'.gz')
    return json.loads(gzip.open(path,'rt').read() if path.suffix=='.gz' else path.read_text())
def dump(path,data):Path(path).write_text(json.dumps(data,indent=2)+'\n')
pages=read(E/'pages.json')
snapshots=[read(E/('page-'+p['id'].replace(':','-')+'.json')) for p in pages]
published=read(E/'published-components.json')
prim=read(HERE/'groups/primitives.json');comp=read(HERE/'groups/composites.json');other=read(HERE/'groups/figma-only-and-internals.json')
pm={o['nodeId']:o for o in prim['owners']};cm={o['id']:o for o in comp['owners']};om={o['nodeId']:(p,o) for p in other for o in p['owners']}
identity=read(E/'imported-master-identities.json');identities={r['instanceId']:r for p in identity for r in p['records']}
errors=[x for p in snapshots for x in p['errors']]
resolved_errors=sum(x['nodeId'] in identities for x in errors)
roles={
 '9209:22534':'child/internal','5496:944':'child/internal','32656:625':'child/internal','12670:16543':'child/internal',
 '1097:1794':'child/internal','1097:2266':'child/internal','1101:2267':'child/internal','33222:107781':'child/internal',
}
def role(o,page):
 if o['id'] in roles:return roles[o['id']]
 n=o['name']
 if n.startswith('_') or 'Child/' in n or n.startswith('Child/') or n.startswith('Utilities /') or page.startswith('🧰'):return 'child/internal'
 if 'group (' in n.lower() or 'menu (' in n.lower() or 'stacked list (' in n.lower() or 'tree (' in n.lower() or 'workflow stepper (' in n.lower():return 'composition/preset'
 return 'family/group master'
records=[]
for p in snapshots:
 for o in p['owners']:
  nid=o['id'];group='primitives' if nid in pm else 'composites' if nid in cm else 'figma-only-and-internals'
  if nid in pm:
   x=pm[nid];source=x['localSource'];counter=x['localComponent'];summary=x['apiCoverage'];screenshot=x.get('referenceScreenshot');findings=x['findings'];comparison='current local API/CSS/template source review'
  elif nid in cm:
   x=cm[nid];source=x['sourceFiles'];counter=x['localCounterpart'];summary=x['observation'];screenshot=x.get('figmaScreenshot');findings=x['relatedFindingIds'];comparison='current local API/CSS/template source review'
  else:
   family,x=om[nid];source=['src/design-system/index.ts'];counter=family['runtime'];summary=family['approach'];candidate='evidence/figma-only-'+p['page']['name'].lower()+'.png';screenshot=candidate if (HERE/candidate).exists() else None;findings=[];comparison='catalog/source/composition review; no exact runtime counterpart or internal parent piece'
  screenshot=str((HERE/screenshot).relative_to(ROOT)) if screenshot and not screenshot.startswith('docs/') else screenshot
  axes={k:v['variantOptions'] for k,v in o['properties'].items() if v['type']=='VARIANT'}
  records.append({'nodeId':nid,'name':o['name'],'type':o['type'],'pageId':p['page']['id'],'pageName':p['page']['name'],'auditRole':role(o,p['page']['name']),'published':True,'figmaUrl':'https://www.figma.com/design/nAKX1rO3Mir2OCBdCkC5oq?node-id='+nid.replace(':','-'),'group':group,'variantCount':o['variantCount'],'variantAxes':axes,'variants':[{'nodeId':v['id'],'name':v['name'],'properties':v.get('variantProperties'),'rootWidth':o['appearanceSignatures'][v['nodeRefs'][0]['sig']].get('width'),'rootHeight':o['appearanceSignatures'][v['nodeRefs'][0]['sig']].get('height')} for v in o['variants']],'descendantNodeRecords':sum(len(v['nodeRefs']) for v in o['variants']),'metadata':{'status':'read_all_actual_variants_and_descendants','path':'docs/figma-library-review-2026-10-20/evidence/page-'+p['page']['id'].replace(':','-')+'.json.gz','fields':['geometry/bounds','layout/padding/gap','fills/strokes','radii','effects','typography','variable bindings','instance/master references'],'limits':['mixed per-range text fields omitted by extractor','glyph path equality is separate from box geometry','all slot override permutations not rendered']},'codeComparison':{'status':'reviewed_at_family_or_parent_scope','scope':comparison,'localRepresentation':counter,'sourceFiles':source,'summary':summary,'evidence':'docs/figma-library-review-2026-10-20/groups/'+group+'.json'},'figmaVisualReference':{'status':'representative_family_specimen' if screenshot else 'parent_specimen_and_metadata_only','screenshot':screenshot,'limits':'Figma reference, not a local runtime capture; may represent a parent/variant rather than this exact owner.'},'runtimeVerification':{'visualParity':'not_performed','interactiveAllStates':'not_performed','inverseTouchResponsive':'not_performed'},'findingIds':findings})
ids=[x['nodeId'] for x in records];publishedids={o['nodeId'] for o in published}
assert len(ids)==len(set(ids))==164 and set(ids)==publishedids
template=read(E/'local-template-property-check.json')
summary={'date':'2026-10-20','fileKey':'nAKX1rO3Mir2OCBdCkC5oq','scope':'Every component owner in the requested Component Library; linked System icon page is a bounded supplement. Live Docusign and Figma read-only; generated source untouched.','intent':'Reusable playground with recognizable key screens and design-system consistency. Insets/density and full production-flow replication are not gates.','counts':{'pages':len(pages),'pagesWithOwners':sum(bool(p['owners']) for p in snapshots),'documentationPagesWithoutOwners':sum(not p['owners'] for p in snapshots),'publishedOwners':len(records),'componentSets':sum(x['type']=='COMPONENT_SET' for x in records),'standaloneMasters':sum(x['type']=='COMPONENT' for x in records),'actualVariantsAndStandaloneSpecimens':sum(x['variantCount'] for x in records),'descendantNodeRecords':sum(x['descendantNodeRecords'] for x in records),'unpublishedAdditionalOwners':0,'representativeFigmaPngs':len(list(E.glob('*.png'))),'runtimeComponentZooCaptures':0,'groups':dict(collections.Counter(x['group'] for x in records)),'roles':dict(collections.Counter(x['auditRole'] for x in records))},'extractionRecovery':{'initialImportedMasterParentLookupErrors':len(errors),'resolvedBySupplementalIdentityReads':resolved_errors,'remainingIdentityErrors':sum(len(x['errors']) for x in identity),'identityRecords':len(identities),'transientModalConnectionFailure':'recovered','chunkConsistency':'all assembled snapshots decoded and parsed; changed-length chunks were refreshed before acceptance'},'templateTargets':dict(collections.Counter(x['targetStatus'] for x in template)),'coverageDimensions':{'metadata':'all164 owners/all1389 extant variants; not every Cartesian combination or arbitrary slot override','source':'all164 at family/parent scope, with missing/internal/preset distinctions','figmaSpecimens':'64 representative current PNGs, including4 linked AI glyph references; no claim of screenshot per variant','runtime':'no exhaustive component zoo, state interaction, responsive, inverse/touch or raster-equivalence verification'},'owners':records,'pages':[{'nodeId':p['page']['id'],'name':p['page']['name'],'ownerCount':len(p['owners']),'owners':[o['id'] for o in p['owners']]} for p in snapshots]}
dump(HERE/'coverage.json',summary)
print(json.dumps({k:summary[k] for k in ['counts','extractionRecovery','templateTargets']},indent=2))
