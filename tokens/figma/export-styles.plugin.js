// Read-only Figma Plugin API snippet for use_figma (figma-use skill).
const paints=await figma.getLocalPaintStylesAsync();const text=await figma.getLocalTextStylesAsync();const effects=await figma.getLocalEffectStylesAsync();const grids=await figma.getLocalGridStylesAsync();
const styles={paintStyles:paints.map(s=>({id:s.id,name:s.name,paints:s.paints})),textStyles:text.map(s=>({id:s.id,name:s.name,fontName:s.fontName,fontSize:s.fontSize,lineHeight:s.lineHeight,letterSpacing:s.letterSpacing,textCase:s.textCase,textDecoration:s.textDecoration,paragraphSpacing:s.paragraphSpacing,paragraphIndent:s.paragraphIndent})),effectStyles:effects.map(s=>({id:s.id,name:s.name,effects:s.effects})),gridStyles:grids.map(s=>({id:s.id,name:s.name,grids:s.layoutGrids}))};
return styles;
