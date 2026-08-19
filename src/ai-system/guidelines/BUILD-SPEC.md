# Build spec — mirror ai-system components into Figma

Read this in full before you write anything. Every build agent follows it.

## Goal

Make a Figma component for each code component in
`/Users/akshat.mishra/Documents/Work/akshat-lab/system/ai-system/`.
The Figma file mirrors the code exactly. The code is the source of truth.

File key: `RCWNACEKmlYtdXbfnha5Dc` (`Iris Chat Platform`, a design file).

## THE RULE THAT MATTERS MOST

**Read three files before you draw anything.**

1. The `.tsx` — for the order of the children. The JSX order is the layout order.
2. The `.module.css` — for every value: padding, gap, height, radius, font size,
   line height, colour, and every state rule.
3. The types — for the union props. Each union prop is a variant axis.

**Do not build from a props list. Do not build from a summary.** An earlier
build did that and got 7 of 11 properties wrong.

**Never substitute a missing token for one that looks close.** If the token you
need is not available, report it. A silent substitution reads as correct, and
the reviewer cannot find it.

**Verify by reading the file back.** After you build, run a read-only script
that returns each property from Figma. Compare it to the CSS line by line. Put
that comparison in your report.

## Fonts

`DS Indigo`. Available styles: `Regular`, `Medium`, `SemiBold`, `Bold`, `Light`,
`Black`, and the italics. **Never use Inter.**

Load each style with `figma.loadFontAsync({family:'DS Indigo', style:'…'})`
before you set any text.

## Tokens

### Ink variables (remote)

```js
const libs = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
const ink = libs.find(c => c.name === 'Ink');
const lv = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(ink.key);
const key = n => (lv.find(v => v.name === n) || {}).key;
const v = await figma.variables.importVariableByKeyAsync(key('Published/Font/fontColorDefault'));
```

Bind a fill like this. `setBoundVariableForPaint` returns a NEW paint:

```js
const bind = (v) => figma.variables.setBoundVariableForPaint(
  { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
node.fills = [bind(v)];
```

### Name conversion, code to Figma

- `--ink-font-color-default` → `Published/Font/fontColorDefault`
- `--ink-icon-color-subtle` → `Published/Icon/iconColorSubtle`
- `--ink-bg-color-default` → `Published/Background/bgColorDefault`
- `--ink-border-color-subtle` → `Published/Border/borderColorSubtle`
- `--ink-item-bg-color-hover` → `Published/Item/itemBgColorHover`
- `--ink-cobalt-100` → `Internal/color/semantic/cobalt/100`
- `--ink-neutral-fade-70` → `Internal/color/semantic/neutral/fade/70`
- `--ink-ecru-10` → `Internal/color/semantic/ecru/10`

The rule: `Published/{Group}/{leafCamelCase}` becomes `--ink-{leaf-kebab-case}`.
`Internal/color/{family}/{ramp}/{step}` becomes `--ink-{ramp}-{step}`.

### Local collection for tokens Figma lacks

Collection `[AI] Missing from Ink`, id `VariableCollectionId:15:1915`. It holds:

`ecru-20` `#f2edea` · `ecru-30` `#e6ded9` · `ecru-40` `#d7cdc7` ·
`ecru-60` `#aba49f` · `neutral-15` `#f3f2f3` · `neutral-5` `#fafafa`

Find them with `getLocalVariableCollectionsAsync()`. **Reuse them. Do not create
duplicates.** If you need another token that Ink CSS defines but Figma does not
publish, add it to this collection and set its `description` to
`Ink CSS defines --ink-<name> = <value>. Ink does not publish it to Figma.`

### Aliases to resolve yourself

These Ink tokens are aliases. Use the Figma variable on the right:

| Code token | Use this Figma variable |
|---|---|
| `--ink-bg-color-subtle` | `Internal/color/semantic/neutral/fade/5` |
| `--ink-font-color-secondary` | `Internal/color/semantic/neutral/fade/70` |
| `--ink-font-color-tertiary` | `Internal/color/semantic/neutral/fade/50` |
| `--ink-font-color-placeholder` | `Internal/color/semantic/neutral/fade/30` |
| `--ink-font-color-link-default` | `Internal/color/semantic/cobalt/100` |
| `--ink-button-brand-bg` | `Published/CTA/ctaBgColorBrandDefault` |
| `--ink-button-brand-bg-hover` | `Published/CTA/ctaBgColorBrandHover` |
| `--ink-button-brand-bg-active` | `Published/CTA/ctaBgColorBrandActive` |
| `--ink-bg-glass-frost` | `Published/Background/bgColorGlassFrost` |
| `--ink-radius-full` | `Published/Radius/radiusSizeFull` |

### Dead references — REPORT, do not guess

These 29 tokens appear in ai-system CSS and exist **nowhere** — not in Figma,
not in Ink's own CSS. The browser drops the property.

```
action-color-primary  bg-color-danger-subtle  bg-color-hover  blue-20  blue-50
blue-60  cobalt-05  cobalt-fade-10  cobalt-fade-5  color-blue-50  color-blue-100
color-blue-300  color-blue-400  color-blue-500  color-blue-600  color-green-50
color-green-500  color-green-700  color-red-50  color-red-200  color-red-300
color-red-500  color-red-700  ecru-05  font-color-danger
font-color-neutral-default  neutral-05  neutral-25  yellow-70
```

If your component uses one, leave that property **unset** in Figma and list it
in your report. Do not pick a near colour.

### Two more dead tokens, found during the build

Both live in the shared tooltip CSS that several components copy, so you will
probably meet them:

- **`--ink-spacing-75`** — used as a tooltip `gap`. `gap` is not inherited, so
  the browser computes **0**. Set the gap to `0`. That is the real value, not a
  substitution.
- **`--ink-font-color-subtle`** — used for tooltip excerpt `color`. Ink's CSS
  does not define it. Note that Figma *does* publish
  `Published/Font/fontColorSubtle`, so the two sides disagree here in the
  opposite direction from the rest of this list.

### Refinement to the "leave it unset" rule

Whether to leave a property unset depends on whether CSS inherits it.

- **Not inherited** (`gap`, `background`, `border`, `padding`): the declaration
  is dropped and the property falls back to its initial value. Build that
  initial value — `0`, `transparent`, `none`. Report it.
- **Inherited** (`color`): the element renders at its parent's value, which is
  usually the default text colour. Leaving a text fill unset in Figma makes the
  text invisible, which misrepresents the browser. Bind the inherited value
  instead, and write the deviation into the component description.

## Icons

Icons come from `[ds-ui] Icon Library`, library key
`lk-972878d071f2bddb5954f7f1a3107c41f408410a87cd4b4c28036d4ad31c57e6a233709608108795eafbcf68c617d2238ac552ab3e41ab2f9058d194a5f024e0`.

Find one with `search_design_system`, scoped with `includeLibraryKeys`, then:

```js
const comp = await figma.importComponentByKeyAsync('<componentKey>');
const inst = comp.createInstance();
inst.resize(16, 16);
for (const n of inst.findAll(n => n.fills && n.fills.length)) n.fills = [bind(iconColorVar)];
```

Known keys: `arrowUpLeftSmall` `c2c6c8d916356ac2d30c50df799e156acbcc7c53` ·
`arrowUpRightSmall` `8e4efa2468b42b2a70c1c546e0183b43c31c1822` ·
`arrowUpSmall` `681cc4f2e6c53aa6deffcd4d3219f10f9afcd521` ·
`closeSmall` `c3631570c0b8cfb71822550121bdc6dbfb9d5d63` ·
`chevronDownSmall` `4a3c4493dc59ecfa971f9dded53597020c1ae693` ·
`chevronUpSmall` `9e92a81c8f7d067622633e69e3a51fa9574bc0b6` ·
`plusSmall` `ea0324d191398cd3616995847a413cb9b3d9e653` ·
`duplicateSmall` `97e07033f0dab17aaf07f7dffb2d922616749bb2` ·
`thumbsUpSmall` `4e852bc37760726ee374f68f7a2b56905f8d060c` ·
`thumbsDownSmall` `756b206514b7750f9b935d41b82f24cbecdaeddb` ·
`overflowHorizontalSmall` `c50db6fa5024889f0d8783ab12d21fcf3018cb28` ·
`documentSmall` `66e13ce8be4dee3473236fff5dcc665a1e49d923` ·
`controlStop` `c5c770ef83c25fe759f393b3d3a59cfa98cc5f9a` ·
`AI_iris` `90f018d1997785ef99c2148b8ade14a8053efece` ·
`irisSmall` `2ddf29825b09b56c0001b99b3e4cc4306185695c` ·
`arrowsOutSmall` `1eff97f492dbb2a1bd36ad9d7d52c565da40e12d` ·
`arrowsInSmall` `e8ef490e469cff3222989e051a19797e6c035750` ·
`menuSmall` `6da04dcaedf15f802278b0b854e612accf02a2af` ·
`pencilBoxSmall` `38db7ef2c26a695c7dfa6f54ac53c0768189339c`

Ink has **no `suggestion-arrow`** glyph in Figma. Where the code asks for it,
use **`arrowUpLeftSmall`** — the CSS mirrors the glyph with `scaleX(-1)`, so
up-left is the direction that renders. Use the same icon everywhere for this,
so the pages agree with each other.

If a component needs any other icon that does not exist, use the closest real
Ink icon and write the substitution into the component description.

## Ink COMPONENTS — do not hand-draw these

Ink publishes real Figma components for its controls. Import and instance them.
Do not draw your own button, tag or checkbox. Library key is the
`[ds-ui] Component Library` key:
`lk-187258477577e8a78673d18aeb0e6c63328c9e6d9d15fa84ac29144c26767c58d6aac321a46c0470fc5ef6aa378c9d0f47b3b35bb6e0df410ea64941373df9df`

| Component | Key |
|---|---|
| `[INK] Button` | `cc0d4ac23aefd03fef3de1c509be2a2d13b185d7` |
| `[INK] Icon Button` | `a395ab45be2989c33ba764bd7cf7dd153b0f31be` |
| `[INK] Tag` | `b96061672c86c4b2fb72a0f59852dc2ef24af530` |
| `[INK] Toolbar Button` | `4bfb6c693dfcfd3e4f46f4ada86016f9e254a436` |
| `[INK] Combo Button` | `251ce5953b125a7ec49ec565f489557b650c27cb` |
| `[INK] Banner` | `555b25430a9606f09f0ab54ea487bfeb9def14b6` |
| `[INK] Editable Combobox` | `594a074dd956fec2889b71494a0a6a82bffec5cf` |
| `[INK] Slider` | `87166c832724b958fbc1a2c03852c61c002b9888` |
| `Child/[INK] Tree Item` | `2a197cdff29320de50a681b8ebc3d217bd403932` |
| `Accordion.item` | `d682e926ebe8579cb2d0d858fa8906d534911ca7` |

Find anything else with `search_design_system`, scoped to that library key.
These are COMPONENT_SETs, so import the set and instance the variant you need:

```js
const set = await figma.importComponentSetByKeyAsync('<key>');
const inst = set.defaultVariant.createInstance();
inst.setProperties({ kind: 'tertiary', '❖ State': 'default' });
```

Note that Ink's own variant properties already follow the `❖ ` convention —
`❖ State`, `❖ Icon`, `❖ Error`. That is where the convention in this spec comes
from, so match it.

## The page pattern

Your page already exists. Do not create it. Build inside it, left to right,
all blocks aligned to the same top edge.

1. **Title** — the code name. `DS Indigo Medium 24`, at x=0, y=0.
2. **A grey line** — `Code name — canonical, matches system/ai-system`.
   `DS Indigo Regular 13`, `#6B6B6B`, at y=36.
3. **A magenta line** — `Closest name in your [NEW] Iris UI: <name>`.
   `DS Indigo Regular 13`, `#D9155D`, at y=60. Look on page `0:1` for a
   component with a similar job. If none exists, write
   `No counterpart in [NEW] Iris UI`.
4. **An `Anatomy` frame** at x=0, y=120. VERTICAL auto-layout, gap 16, white
   fill. One row per named part. Each row: HORIZONTAL auto-layout, gap 24,
   padding 24, no fill, `counterAxisAlignItems: 'CENTER'`, named `var1`,
   `var2`… Each row holds an instance and a magenta label at
   `DS Indigo Medium 16`. The label is the prop name, word for word.
5. **The component set** at x=800, y=0.
6. **An `In use` frame** below the Anatomy frame. Show the component in a
   realistic context, with real product copy. Use Docusign agreement language:
   Acme, MSA, NDA, renewal dates, counterparties. Do not use lorem text.

## Component naming

The set is named `[AI] ComponentName`, matching the code export exactly.

## Variant axes

Every union-typed prop is a variant axis. The property name is the **code prop
name in lowercase**, with no prefix: `variant`, `status`, `layout`, `type`,
`size`, `mode`, `edge`, `blink`.

A property that exists only in Figma gets a `❖ ` prefix (U+2756 then a space).
Use it for anything CSS drives rather than a prop — most often
`❖ State = default | hover | active`, and `❖ Focus` as a boolean.

**All variant option values are lowercase**, matching the code union members
exactly: `plain-text`, `slash-command`, `suggestion-selected`, `pending`,
`running`, `complete`, `error`.

A variant name in Figma is set through the component's `name`, as
`prop=value` pairs joined by `, `. Example:
`variant=plain-text, ❖ State=hover`.

Build every variant the code can produce. Do not skip states.

## The component description

Set `set.description` with this template, exactly:

```
<One sentence: what it is and what it is for.>

Props
<name>*: <one sentence>          ← the * marks a required prop
<name>: <one sentence>

Rules
<one rule per line>
```

Add a `Rules` line for every substitution or gap, so the reviewer sees it in
Figma without reading a report.

## Working method

- Keep each `use_figma` call small. Ten logical operations at most.
- `appendChild` before you set `layoutSizingHorizontal`/`Vertical`.
- `resize()` before you set sizing modes.
- Colours use `hex/255` notation, never pre-rounded decimals.
- Return every created node id from every call.
- On an error, STOP and read it. Failed scripts do not run at all, so a retry
  after a fix is safe.
- Take `await set.screenshot()` when the set is done, and look at it.

## Your report

1. One line per component: built, and the number of variants.
2. **A property table per component**: the CSS value against the Figma value,
   read back from the file. This is the part that matters.
3. Every dead token you hit, and the property you left unset.
4. Every icon or token you substituted, and what you used.
5. Anything in the code that contradicted itself.

Do not pad the report. Do not claim a component matches without the read-back.
