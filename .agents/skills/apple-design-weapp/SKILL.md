---
name: apple-design-weapp
description: Apply Apple Design principles to the bilingual weapp.dev website while preserving its brand, product facts, routes, and static-first behavior.
metadata:
  short-description: Apple-inspired design system for weapp.dev
---

# Apple Design for weapp.dev

Use this skill when redesigning or reviewing the weapp.dev web portal. Read [references/apple-principles.md](references/apple-principles.md) before making visual decisions.

## Decision order

1. Preserve product truth, bilingual parity, route contracts, real project assets, and no-JavaScript readability.
2. Make the information hierarchy obvious before adding decoration: one clear page purpose, one dominant action, and progressive disclosure for secondary detail.
3. Use weapp.dev's forest-green identity with Apple-like clarity, restraint, semantic surfaces, and deliberate depth. Do not copy Apple assets, names, or page geometry.
4. Keep controls native in meaning and accessible in operation: visible focus, 44px touch targets, keyboard support, reduced motion, and sufficient contrast.

## Implementation rules

- Prefer a small tokenized system over page-specific overrides.
- Use typography, spacing, grouping backgrounds, hairlines, and real product evidence to create hierarchy.
- Reserve blur and shadows for floating navigation, menus, dialogs, and intentional hero depth.
- Keep content cards flat and avoid decorative gradients, fake metrics, and redundant card grids.
- Treat Chinese and English as first-class layouts; test long labels at mobile widths.
- Keep default content visible without JavaScript. JavaScript may enhance theme, navigation, analytics, and progressive motion.

## Workflow

- Inspect PRODUCT.md, DESIGN.md, the route/component surface, and current screenshots before editing.
- Update shared tokens and primitives first, then shared chrome, then page-level composition.
- Validate with project check, tests, build, E2E, screenshots, responsive overflow checks, and accessibility checks.
- Make one bounded visual QA pass and one focused correction pass.
