import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateTokens, makeModel, tokensInScope, resolveCss, styleDeclarations, previewData, compatibilityAliases } from './figma-token-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(fs.readFileSync(path.join(root,'tokens/figma/snapshot.json'),'utf8'));
const styles = JSON.parse(fs.readFileSync(path.join(root,'tokens/figma/styles.json'),'utf8'));
const compatibility = fs.readFileSync(path.join(root,'tokens/figma/compatibility.css'),'utf8');
const result = generateTokens(snapshot,styles,compatibility);
const preview=JSON.stringify(previewData(snapshot,styles,result.manifest))+'\n';
const previewPath=path.join(root,'public/figma-token-preview.json');
const sourceAt = process.argv.indexOf('--write-source');
if (process.argv.includes('--write-preview')) {
  fs.writeFileSync(previewPath,preview);
  console.log('Generated browser verification data from the pinned Figma export.');
} else if (sourceAt !== -1) {
  const source = process.argv[sourceAt+1];
  if (!source || !path.isAbsolute(source) || path.resolve(source) === root || path.resolve(source).startsWith(path.join(root,'src'))) throw new Error('Pass the separate authoring project root, never the starter generated folders.');
  const target = path.join(source,'src/design-system/1-tokens');
  if (!fs.existsSync(path.join(source,'component-registry.json'))) throw new Error('Not a ProtoLab authoring source root');
  fs.mkdirSync(target,{recursive:true});
  fs.writeFileSync(path.join(target,'tokens.css'),result.css);
  fs.writeFileSync(path.join(target,'figma-token-map.json'),JSON.stringify(result.manifest,null,2)+'\n');
  fs.writeFileSync(path.join(source,'src/design-system/styles/tokens.css'),"/* Compatibility entry point; the Figma-synchronized token source is shared. */\n@import '../1-tokens/tokens.css';\n");
  // The public barrel loads tokens once. Repeating the full foundation inside
  // every CSS module duplicates every mode in Vite's output.
  const designSystem=path.join(source,'src/design-system');
  const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
  let normalizedImports=0;
  for(const file of walk(designSystem).filter(file=>file.endsWith('.module.css'))) {
    const before=fs.readFileSync(file,'utf8');
    const after=before.replace(/^@import\s+['"][^'"]*1-tokens\/tokens\.css['"];\r?\n?/gm,'');
    if(before!==after){fs.writeFileSync(file,after);normalizedImports++;}
  }
  const barrel=path.join(designSystem,'index.ts');
  const barrelSource=fs.readFileSync(barrel,'utf8');
  if(!barrelSource.includes("import './1-tokens/tokens.css'")) fs.writeFileSync(barrel,"import './1-tokens/tokens.css';\n"+barrelSource);
  console.log(`Generated authoring source: ${target}`);
  console.log(`Centralized ${normalizedImports} repeated token imports in the public barrel.`);
  const aiAt=process.argv.indexOf('--ai-source');
  if(aiAt!==-1){
    const aiSource=process.argv[aiAt+1];
    if(!aiSource||!path.isAbsolute(aiSource)||path.resolve(aiSource).startsWith(root+path.sep))throw new Error('Pass a separate canonical AI authoring root.');
    let aiImports=0;
    for(const file of walk(aiSource).filter(file=>file.endsWith('.module.css'))){
      const before=fs.readFileSync(file,'utf8'),after=before.replace(/^@import\s+['"]@ink\/1-tokens\/tokens\.css['"];\r?\n?/gm,'');
      if(before!==after){fs.writeFileSync(file,after);aiImports++;}
    }
    const aiBarrel=path.join(aiSource,'index.ts'),before=fs.readFileSync(aiBarrel,'utf8');
    if(!before.includes("import '@ink';"))fs.writeFileSync(aiBarrel,"import '@ink';\n"+before);
    console.log(`Centralized ${aiImports} canonical AI token imports through @ink.`);
  }
} else {
  const cssAt = process.argv.indexOf('--css');
  const css = fs.readFileSync(cssAt === -1 ? path.join(root,'src/design-system/1-tokens/tokens.css') : process.argv[cssAt+1],'utf8');
  const model = makeModel(snapshot);
  const failures = [];
  let valuesChecked = 0, stylesChecked = 0, compatibilityAliasesChecked=0;
  for (const collection of snapshot.collections) for (const mode of collection.modes) {
    const selection = {[collection.name]:mode.name};
    const tokens = tokensInScope(css,selection);
    for (const entry of model.entries.filter(entry=>entry.collectionId===collection.id)) {
      valuesChecked++;
      try {
        const actual = resolveCss(entry.cssToken,tokens), expected = model.literal(entry,selection);
        if (actual !== expected) failures.push({id:entry.id,name:entry.name,mode:mode.name,actual,expected});
      } catch (error) { failures.push({id:entry.id,name:entry.name,mode:mode.name,error:error.message}); }
    }
    if (collection.name === 'Ink') for (const [token,expected] of styleDeclarations(styles,model,selection).declarations) {
      stylesChecked++;
      try { const actual = resolveCss(token,tokens); if (actual !== expected) failures.push({token,mode:mode.name,actual,expected}); }
      catch(error) { failures.push({token,mode:mode.name,error:error.message}); }
    }
    if(collection.name==='Ink') for(const [alias,target] of Object.entries(compatibilityAliases)) {
      compatibilityAliasesChecked++;
      try { const actual=resolveCss(alias,tokens),expected=model.literal(model.entries.find(entry=>entry.cssToken===target),selection);if(actual!==expected)failures.push({token:alias,mode:mode.name,actual,expected}); }
      catch(error){failures.push({token:alias,mode:mode.name,error:error.message});}
    }
  }
  // Cross-collection combinations must preserve aliases and utility density modes.
  let combinationsChecked = 0;
  const ink = snapshot.collections.find(c=>c.name==='Ink'), utilities = snapshot.collections.find(c=>c.name==='_Utilities');
  for (const inkMode of ink.modes) for (const utilityMode of utilities.modes) {
    const selection = {Ink:inkMode.name,_Utilities:utilityMode.name};
    const tokens = tokensInScope(css,selection);
    for (const entry of model.entries.filter(entry=>entry.collection==='Ink' || entry.collection==='_Utilities')) {
      combinationsChecked++;
      const actual = resolveCss(entry.cssToken,tokens), expected = model.literal(entry,selection);
      if (actual !== expected) failures.push({token:entry.cssToken,selection,actual,expected});
    }
  }
  const report = {capturedDate:snapshot.capturedDate,snapshotHash:result.manifest.snapshotHash,variables:model.entries.length,modeValuesChecked:valuesChecked,styles:result.manifest.styles.length,stylePropertiesChecked:stylesChecked,crossCollectionValuesChecked:combinationsChecked,compatibilityAliasesChecked,totalChecks:valuesChecked+stylesChecked+combinationsChecked+compatibilityAliasesChecked,missingOrDifferent:failures.length,failures};
  const reportAt = process.argv.indexOf('--report');
  if(reportAt!==-1) fs.writeFileSync(path.resolve(root,process.argv[reportAt+1]),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,failures:failures.slice(0,10)},null,2));
  if(failures.length) process.exitCode=1;
  if(css !== result.css) { console.error('Generated token CSS differs from its pinned Figma source; regenerate through the authoring source.'); process.exitCode=1; }
  if(!fs.existsSync(previewPath)||fs.readFileSync(previewPath,'utf8')!==preview) { console.error('Browser reference data is stale. Run node scripts/sync-figma-tokens.mjs --write-preview.'); process.exitCode=1; }
  const mapPath=cssAt===-1?path.join(root,'src/design-system/1-tokens/figma-token-map.json'):path.join(path.dirname(process.argv[cssAt+1]),'figma-token-map.json');
  if(!fs.existsSync(mapPath)||fs.readFileSync(mapPath,'utf8')!==JSON.stringify(result.manifest,null,2)+'\n'){console.error('The generated Figma mapping manifest is stale.');process.exitCode=1;}
  if(cssAt===-1){
    const barrel=fs.readFileSync(path.join(root,'src/design-system/index.ts'),'utf8');
    if(!barrel.includes("import './1-tokens/tokens.css'")){console.error('The public design-system barrel must import the token foundation.');process.exitCode=1;}
    if(/@import[^;]*1-tokens\/tokens\.css/.test(fs.readFileSync(path.join(root,'src/index.css'),'utf8'))){console.error('Duplicate global token import in src/index.css.');process.exitCode=1;}
  }
}
