# Apple Design principles mapped to weapp.dev

This is a practical summary of the public Apple Design language for this project. It is a design reference, not a reproduction guide.

## Clarity, deference, depth

- Clarity: type, controls, labels, and actions should be immediately legible.
- Deference: chrome supports content; project evidence, documentation, and facts carry visual weight.
- Depth: use scale, grouping surfaces, translucency, and restrained motion to communicate hierarchy and state.

## Layout and hierarchy

- Give each screen one primary purpose and one primary action.
- Use generous but intentional spacing; group related content with proximity and subtle surface changes.
- Prefer progressive disclosure: summary first, details behind a link, disclosure, or separate route.
- Use full-width section bands and a stable content rail so the interface feels calm and navigable.

## Typography and color

- Use a clear scale with strong distinction between display, heading, body, metadata, and code.
- Let font size, weight, and line length establish hierarchy; avoid ornamental tracking and monospace body copy.
- Use semantic color roles for canvas, grouped content, primary text, secondary text, separators, accent, success, warning, and destructive states.
- Maintain WCAG AA contrast in both themes and never communicate meaning by color alone.

## Materials, controls, and motion

- Use translucency and blur only where a surface floats over content, such as a sticky header or menu.
- Keep content surfaces mostly flat; shadows describe elevation and interaction state.
- Controls should have obvious affordances, at least 44px touch geometry, clear pressed/focus states, and predictable keyboard behavior.
- Motion should explain entrance, hierarchy, and state change. Honor prefers-reduced-motion by removing transforms, delays, and nonessential transitions.

## Accessibility and localization

- Preserve semantic landmarks, heading order, labels, skip links, and focus visibility.
- Test bilingual copy at narrow widths; do not rely on fixed English lengths.
- Keep reading order and all primary actions available when scripts fail.

## Boundary

Do not copy Apple's logo, SF Symbols, proprietary illustrations, trademarked language, or exact page geometry. Apply the principles through weapp.dev's existing identity, marks, content, and project evidence.
