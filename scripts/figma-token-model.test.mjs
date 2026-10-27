import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { generateTokens, makeModel, tokensInScope, resolveCss, slug, tokenName, styleDeclarations } from './figma-token-model.mjs';

const snapshot = JSON.parse(fs.readFileSync(new URL('../tokens/figma/snapshot.json',import.meta.url),'utf8'));
const styles = JSON.parse(fs.readFileSync(new URL('../tokens/figma/styles.json',import.meta.url),'utf8'));
const compatibility = fs.readFileSync(new URL('../tokens/figma/compatibility.css',import.meta.url),'utf8');
const generated = generateTokens(snapshot,styles,compatibility);
const model = generated.model;

test('imports every exported variable and every mode, including deprecated definitions',()=>{
  assert.equal(model.entries.length,855);
  assert.equal(new Set(model.entries.map(entry=>entry.cssToken)).size,855);
  assert.equal(model.entries.reduce((sum,entry)=>sum+Object.keys(entry.valuesByMode).length,0),3380);
  for (const collection of snapshot.collections) for(const mode of collection.modes) {
    const selection = {[collection.name]:mode.name};
    const tokens = tokensInScope(generated.css,selection);
    for (const entry of model.entries.filter(entry=>entry.collectionId===collection.id)) assert.equal(resolveCss(entry.cssToken,tokens),model.literal(entry,selection),`${entry.name} / ${mode.name}`);
  }
});

test('switches CTA dimensions in Touch while preserving Standard values',()=>{
  assert.equal(resolveCss('--ink-cta-size-md',tokensInScope(generated.css)), '40px');
  assert.equal(resolveCss('--ink-cta-size-sm',tokensInScope(generated.css)), '32px');
  for(const mode of ['Standard (Touch)','Inverse (Touch)']) {
    const tokens=tokensInScope(generated.css,{Ink:mode});
    assert.equal(resolveCss('--ink-cta-size-md',tokens),'48px');
    assert.equal(resolveCss('--ink-cta-size-sm',tokens),'48px');
    assert.equal(resolveCss('--ink-cta-size-md-flex',tokens),'12px');
  }
});

test('independent utility density modes coexist with Inverse',()=>{
  for(const [mode,height] of [['Default','56px'],['Compact','48px'],['Tall','96px']]) {
    const tokens=tokensInScope(generated.css,{Ink:'Inverse',_Utilities:mode});
    assert.equal(resolveCss('--ink-utility-table-item-height',tokens),height);
    assert.equal(resolveCss('--ink-bg-color-canvas-page',tokens),model.literal(model.entries.find(entry=>entry.name==='Published/Background/bgColorCanvasPage'),{Ink:'Inverse'}));
  }
});

test('root and explicit Standard scope resolve identically; legacy shorthand follows mode',()=>{
  const root=tokensInScope(generated.css),standard=tokensInScope(generated.css,{Ink:'Standard'}),inverse=tokensInScope(generated.css,{Ink:'Inverse'});
  for(const token of ['--ink-font-default','--ink-bg-default','--ink-button-primary-bg']) assert.equal(resolveCss(token,root),resolveCss(token,standard));
  assert.notEqual(resolveCss('--ink-font-default',standard),resolveCss('--ink-font-default',inverse));
  assert.equal(resolveCss('--ink-font-default',inverse),resolveCss('--ink-font-color-default',inverse));
  assert.equal(resolveCss('--ink-font-primary',inverse),resolveCss('--ink-font-color-default',inverse));
  assert.equal(resolveCss('--ink-font-secondary',inverse),resolveCss('--ink-font-color-neutral-subtle',inverse));
  assert.equal(resolveCss('--ink-cta-font-color-primary',inverse),resolveCss('--ink-font-color-inverse',inverse));
});

test('uses the Figma recipient palette rather than merely matching names',()=>{
  const value=resolveCss('--ink-recipient-border-color-100',tokensInScope(generated.css));
  const rgba=value.match(/[\d.]+/g).map(Number);
  assert.ok(Math.abs(rgba[0]-3)<0.00001);
  assert.ok(Math.abs(rgba[1]-73)<0.00001);
  assert.ok(Math.abs(rgba[2]-88)<0.00001);
});

test('does not alias deprecated sentinels onto active roles',()=>{
  const inactive=model.entries.filter(entry=>entry.collection.startsWith('_DEPRECATED') || /@dep|Deprecated\//i.test(entry.name));
  assert.ok(inactive.length>=347);
  for(const entry of inactive) assert.ok(entry.cssToken.startsWith('--ink-deprecated-'));
  assert.ok(model.entries.find(entry=>entry.name==='Published/Form/formBgColorDefault').cssToken.startsWith('--ink-form-control-'));
});

test('retains negative dimension names without colliding with positive offsets',()=>{
  assert.notEqual(slug('shadow/offset/-1'),slug('shadow/offset/1'));
  assert.equal(slug('shadow/offset/-1'),'shadow-offset-negative-1');
  const collection=snapshot.collections.find(collection=>collection.name==='Ink');
  assert.equal(tokenName({name:'Published/Recipient/recipientBgColor100'},collection),'--ink-recipient-bg-color-100');
});

test('fails closed on missing modes, cycles, unresolved aliases and name collisions',()=>{
  let copy=structuredClone(snapshot);
  delete copy.variables[0].valuesByMode[Object.keys(copy.variables[0].valuesByMode)[0]];
  assert.throws(()=>makeModel(copy),/Incomplete mode/);
  copy=structuredClone(snapshot); copy.variables[1].name=copy.variables[0].name; copy.variables[1].collectionId=copy.variables[0].collectionId;
  assert.throws(()=>makeModel(copy),/collision/);
  copy=structuredClone(snapshot); for(const mode of Object.keys(copy.variables[0].valuesByMode)) copy.variables[0].valuesByMode[mode]={type:'VARIABLE_ALIAS',id:copy.variables[0].id};
  assert.throws(()=>makeModel(copy),/Cyclic/);
  copy=structuredClone(snapshot); for(const mode of Object.keys(copy.variables[0].valuesByMode)) copy.variables[0].valuesByMode[mode]={type:'VARIABLE_ALIAS',id:'missing'};
  assert.throws(()=>makeModel(copy),/Unresolved/);
});

test('parses SVG image values without splitting quoted semicolons or leaking declarations',()=>{
  const tokens=tokensInScope(generated.css);
  const value=resolveCss('--ink-gradient-pearl',tokens);
  const svg=decodeURIComponent(value.match(/^url\("data:image\/svg\+xml,(.*)"\)$/)[1]);
  assert.ok(svg.includes('linearGradient'));
  const coordinates=Object.fromEntries([...svg.matchAll(/\b(x1|y1|x2|y2)="([^"]+)"/g)].map(match=>[match[1],Number(match[2])]));
  const [a,b,c]=styles.paintStyles[0].paints[0].gradientTransform[0];
  assert.ok(Math.abs(a*coordinates.x1+b*coordinates.y1+c)<1e-12);
  assert.ok(Math.abs(a*coordinates.x2+b*coordinates.y2+c-1)<1e-12);
  assert.equal(resolveCss('--ink-font-body-s-size',tokens),'14px');
});

test('includes every text, effect, paint and grid style with all property tokens',()=>{
  assert.equal(generated.manifest.styles.length,49);
  for(const mode of ['Standard','Inverse','Standard (Touch)','Inverse (Touch)']) {
    const tokens=tokensInScope(generated.css,{Ink:mode});
    const result=styleDeclarations(styles,model,{Ink:mode});
    for(const [name,expected] of result.declarations) assert.equal(resolveCss(name,tokens),expected,`${name} / ${mode}`);
  }
  const tokens=tokensInScope(generated.css);
  assert.equal(resolveCss('--ink-elevation-glass',tokens),'16px');
  assert.equal(resolveCss('--ink-elevation-glass-low-backdrop-blur',tokens),'20px');
  assert.equal(resolveCss('--ink-focus-inset',tokens),'0px');
});

test('detects value drift and removed definitions instead of counting names',()=>{
  const changed=generated.css.replaceAll('--ink-cta-size-md: 40px;','--ink-cta-size-md: 41px;');
  assert.notEqual(resolveCss('--ink-cta-size-md',tokensInScope(changed)),'40px');
  const removed=generated.css.replaceAll(/\s*--ink-cta-size-md:\s*[^;]+;/g,'');
  assert.throws(()=>resolveCss('--ink-cta-size-md',tokensInScope(removed)),/Missing CSS token/);
});
