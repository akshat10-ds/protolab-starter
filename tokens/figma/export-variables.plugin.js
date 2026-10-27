// Read-only Figma Plugin API snippet. Execute with use_figma (figma-use skill).
// Set offset to 0, 60, 120, ... until every variable is exported. The small
// batches stay below the tool response limit. Merge only after IDs, counts,
// collection metadata and mode values have been checked for completeness.
const offset = 0;
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variables = (await figma.variables.getLocalVariablesAsync()).sort((a,b)=>a.id.localeCompare(b.id));
return {
total: variables.length,
collections: collections.map(c=>({id:c.id,name:c.name,modes:c.modes,defaultModeId:c.defaultModeId,hiddenFromPublishing:c.hiddenFromPublishing})),
variables: variables.slice(offset,offset+60).map(v=>({id:v.id,name:v.name,collectionId:v.variableCollectionId,type:v.resolvedType,scopes:v.scopes,hiddenFromPublishing:v.hiddenFromPublishing,valuesByMode:v.valuesByMode}))
};
