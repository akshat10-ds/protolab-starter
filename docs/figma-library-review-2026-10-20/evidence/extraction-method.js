const page=await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);
const ownerNodes=page.findAllWithCriteria({types:['COMPONENT','COMPONENT_SET']}).filter(n=>n.type==='COMPONENT_SET'||n.parent.type!=='COMPONENT_SET');
const errors=[];
const allProps=['x','y','width','height','visible','opacity','layoutMode','primaryAxisSizingMode','counterAxisSizingMode','primaryAxisAlignItems','counterAxisAlignItems','layoutSizingHorizontal','layoutSizingVertical','paddingLeft','paddingRight','paddingTop','paddingBottom','itemSpacing','counterAxisSpacing','cornerRadius','topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius','fills','strokes','strokeWeight','strokeAlign','effects','boundVariables','fillStyleId','strokeStyleId','effectStyleId','clipsContent','componentPropertyReferences'];
const textProps=['characters','fontName','fontSize','fontWeight','lineHeight','letterSpacing','textAlignHorizontal','textAlignVertical','textStyleId','textDecoration','textCase','textAutoResize'];
function snapshot(n,path){
 const r={id:n.id,name:n.name,type:n.type,path};
 for(const k of allProps){if(k in n){try{let v=n[k];if(typeof v!=='symbol'&&v!==undefined)r[k]=v;}catch(e){errors.push({nodeId:n.id,key:k,error:String(e)});}}}
 if(n.type==='TEXT'){for(const k of textProps){try{let v=n[k];if(typeof v!=='symbol'&&v!==undefined)r[k]=v;}catch(e){errors.push({nodeId:n.id,key:k,error:String(e)});}}}
 if(n.type==='INSTANCE'){try{r.componentProperties=n.componentProperties;const m=n.mainComponent;if(m)r.master={id:m.id,name:m.name,ownerId:m.parent.type==='COMPONENT_SET'?m.parent.id:m.id,ownerName:m.parent.type==='COMPONENT_SET'?m.parent.name:m.name};}catch(e){errors.push({nodeId:n.id,key:'mainComponent',error:String(e)});}}
 return r;
}
function walk(n,path,a){a.push(snapshot(n,path));if('children' in n)for(const c of n.children)walk(c,path+'/'+c.name,a);}
const owners=ownerNodes.map(n=>{
 const variants=n.type==='COMPONENT_SET'?n.children.filter(v=>v.type==='COMPONENT'):[n];
 const signatures=[],signatureMap=new Map(),records=[];
 for(const v of variants){
  const nodes=[];walk(v,'',nodes);
  const sigRefs=[];
  for(const node of nodes){const {id,...appearance}=node;const str=JSON.stringify(appearance);let sig=signatureMap.get(str);if(sig===undefined){sig=signatures.length;signatureMap.set(str,sig);signatures.push(appearance);}sigRefs.push({id,sig});}
  records.push({id:v.id,name:v.name,variantProperties:v.variantProperties,nodeRefs:sigRefs});
 }
 return {id:n.id,name:n.name,type:n.type,parentId:n.parent.id,parentType:n.parent.type,description:n.description,properties:n.componentPropertyDefinitions,variantCount:variants.length,variants:records,appearanceSignatures:signatures};
});
return {page:{id:page.id,name:page.name,topLevelCount:page.children.length},owners,errors};
