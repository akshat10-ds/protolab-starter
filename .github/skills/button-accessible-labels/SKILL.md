---
name: button-accessible-labels
description: 'Create or update buttons with contextual accessible labels and ensure duplicate button names on a page are uniquely numbered. Default to in-button text labels (not aria-label). For icon buttons, use hidden in-button text with sr-only styling. Use when adding Button components, <button> elements, icon buttons, toolbar buttons, dialog actions, or CTA buttons.'
user-invocable: true
---

# Button Accessible Labels

Generate accessible button labels from context and enforce unique names per page.

## When To Use
- Adding new buttons in React, TSX, JSX, or HTML pages
- Updating existing button text in headers, dialogs, forms, toolbars, or sidebars
- Creating icon-only buttons that need accessible names
- Reviewing a page for duplicate button names

## Rules
1. Every button must have an accessible name.
2. Default to putting the label text inside the button element itself.
3. If the button is icon-only, derive the name from nearest UI context in this order:
- Local section heading
- Panel title
- Dialog title
- Page title
4. For icon-only buttons, include a hidden text node inside the button using `<span class="sr-only">...</span>`.
5. Normalize labels before duplicate checks:
- Trim whitespace
- Collapse multiple spaces
- Compare case-insensitively
6. Duplicate button names are allowed only when those buttons have the same functionality or the same destination link.
7. If two or more buttons on the same page have the same accessible name but different functionality or link targets, add a numbered `aria-label` to distinguish them — left-to-right and top-to-bottom:
- First occurrence: `aria-label="<base label>"`
- Second occurrence: `aria-label="<base label> 2"`
- Third occurrence: `aria-label="<base label> 3"`
8. Never change the visible button text (or sr-only text) when numbering — only the `aria-label` gets the number.
9. Do not add `aria-label` by default when no duplicate conflict exists and the button already contains an accessible text label.
10. Use `aria-label` only for: (a) numbering duplicate buttons with different functionality, or (b) as a last resort when in-button text cannot be added.
11. Do not use vague labels like "Click", "Submit", or "Open" without context.

## Implementation Procedure
1. Collect all buttons in the page/component being edited.
2. Determine each base label from button text or contextual source.
3. Build a per-page map of normalized labels.
4. Group buttons by normalized label and compare functionality/link target for each group.
5. Number only the buttons in a duplicate group that do not share the same functionality or link target.
6. Ensure each button has an in-button text label; for icon buttons, add sr-only text.
7. Validate that duplicate names only exist for buttons with the same functionality or link.

## Required CSS For Icon-Only Labels
```css
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0); /* Legacy support for IE6/7 */
	clip-path: inset(50%); /* Modern browser clipping */
	white-space: nowrap;
	border: 0;
}
```

## React/TSX Pattern
```tsx
<Button>Preview envelope</Button>
<Button>Send envelope</Button>
<Button>
	<HelpIcon />
	<span className="sr-only">Open help dialog</span>
</Button>
```

Duplicate example (visible text unchanged, only `aria-label` is numbered):
```tsx
<Button aria-label="Next">Next</Button>
<Button aria-label="Next 2">Next</Button>
<Button aria-label="Next 3">Next</Button>
```

## HTML Pattern
```html
<button>
	<svg aria-hidden="true" focusable="false"></svg>
	<span class="sr-only">Open help dialog</span>
</button>
<button>Delete document</button>
<button aria-label="Delete document 2">Delete document</button>
```

## Completion Checklist
- Every button has a contextual accessible label
- Duplicate names only exist for buttons with the same functionality or link
- Duplicates with different functionality or links are numbered via `aria-label` only — visible text is not changed
- Icon-only buttons include contextual sr-only text using `.sr-only`
