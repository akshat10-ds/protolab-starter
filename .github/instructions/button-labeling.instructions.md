---
applyTo: "**/*.{tsx,jsx,ts,js,html}"
description: "When creating or editing buttons, apply the button-accessible-labels skill so each button is labeled with in-button text by default, icon buttons use sr-only in-button text, and duplicates on the same page are numbered."
---

When you add or edit any button (`Button`, `<button>`, icon button, toolbar action, dialog action, CTA), apply the `button-accessible-labels` skill.

Requirements:
- Every button must have an accessible name using in-button text by default.
- Accessible names must be contextual to their section or action.
- For icon-only buttons, include hidden text inside the button using `<span class="sr-only">...</span>`.
- Do not default to `aria-label` when in-button text exists.
- Duplicate button names are only allowed when the buttons have the same destination link.
- If duplicates have different functionality or links, add a numbered `aria-label` to each (`Name`, `Name 2`, `Name 3`, ...) — do not change the visible button text.
- Keep numbering stable and sequential within that page/component.

Required sr-only CSS:
```css
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip-path: inset(50%); /* Modern browser clipping */
	white-space: nowrap;
	border: 0;
}
```
