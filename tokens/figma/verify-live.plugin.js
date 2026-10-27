// Read-only consistency check for use_figma. Compare these fingerprints with
// the exported source before accepting a refresh. These are consistency
// fingerprints; the local generated manifest additionally records SHA-256.
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
function digest(value){let hash=2166136261;const text=canonical(value);for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;return hash.toString(16).padStart(8,'0');}
const collections=await figma.variables.getLocalVariableCollectionsAsync();
const variables=(await figma.variables.getLocalVariablesAsync()).sort((a,b)=>a.id.localeCompare(b.id)).map(v=>({id:v.id,name:v.name,collectionId:v.variableCollectionId,type:v.resolvedType,scopes:v.scopes,hiddenFromPublishing:v.hiddenFromPublishing,valuesByMode:v.valuesByMode}));
const paints=await figma.getLocalPaintStylesAsync();const text=await figma.getLocalTextStylesAsync();const effects=await figma.getLocalEffectStylesAsync();const grids=await figma.getLocalGridStylesAsync();
const styles={paintStyles:paints.map(s=>({id:s.id,name:s.name,paints:s.paints})),textStyles:text.map(s=>({id:s.id,name:s.name,fontName:s.fontName,fontSize:s.fontSize,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,textCase:s.textCase,textDecoration:s.textDecoration,paragraphSpacing:s.paragraphSpacing,paragraphIndent:s.paragraphIndent})),effectStyles:effects.map(s=>({id:s.id,name:s.name,effects:s.effects})),gridStyles:grids.map(s=>({id:s.id,name:s.name,grids:s.layoutGrids}))};
return {variables:variables.length,values:variables.reduce((n,v)=>n+Object.keys(v.valuesByMode).length,0),variableFingerprint:digest(variables),styleFingerprint:digest(styles),styles:Object.fromEntries(Object.entries(styles).map(([k,v])=>[k,v.length]))};
