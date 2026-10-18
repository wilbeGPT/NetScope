---
name: emil-kowalski
description: >-
  Use this skill when designing, building, or refining user interfaces, micro-interactions, animations, transitions, gestures, or feedback states. Guides the creation of fluid, delightful, physics-based motion inspired by Emil Kowalski's interaction design and animation principles.
---

# Emil Kowalski Design & Interaction Principles

This skill equips the agent with the interaction engineering and animation philosophy established by **Emil Kowalski** (creator of Sonner, Vaul, animations expert). The core mission is to replace clunky, robotic web UI with tactile, organic, and physically grounded digital interfaces.

---

## 1. Core Motion Philosophy: Physics Over Timers

1. **Springs over Easing Curves:**
   * Never use linear or generic cubic-bezier eases for interactive elements (clicks, drags, toggles).
   * Interactive movement should use **spring physics** with natural tension and damping:
     * **Responsive & snappy:** `stiffness: 400, damping: 30` (dropdowns, tooltips, popovers).
     * **Gentle & organic:** `stiffness: 260, damping: 20` (modal reveals, drawer expansions).
     * **Bouncy micro-pops:** `stiffness: 500, damping: 15` (checkbox checks, bookmark toggles).

2. **Duration Guidelines:**
   * **Micro-interactions (buttons, hovers):** 120ms – 180ms. Never make users wait for a button hover.
   * **Medium elements (dropdowns, accordions, tabs):** 200ms – 280ms.
   * **Large overlays (dialogs, sheet drawers):** 300ms – 400ms max.
   * *Rule:* If an animation feels noticeable to the point of slowing down task completion, it is too slow.

---

## 2. Layout Continuity & Shared Transitions (FLIP)

1. **Eliminate Layout Jumps:**
   * When filtering lists, expanding cards, or toggling tabs, elements must animate to their new positions instead of abruptly popping in.
   * Use Framer Motion / Motion primitives (`layout`, `layoutId`) or CSS View Transitions API to seamlessly interpolate bounding rects (`x`, `y`, `width`, `height`).

2. **Origin-Aware Expansion:**
   * Dialogs, popovers, and menus must expand from the **source trigger** (the button that spawned them), rather than floating in from arbitrary screen corners.
   * Example: A popover originates with `transform-origin: top center` or from the exact click coordinates.

---

## 3. Tactile Micro-Interactions

1. **Active States (Tactile Depression):**
   * Buttons, clickable table rows, and interactive cards must physically depress on click:
     ```css
     transition: transform 120ms cubic-bezier(0.2, 0, 0, 1);
     &:active {
       transform: scale(0.97);
     }
     ```
2. **Subtle Elevation on Hover:**
   * Combine slight vertical translation with shadow diffusion:
     ```css
     &:hover {
       transform: translateY(-1px);
     }
     ```
3. **Smooth State Toggles:**
   * Radio options, segmented controls, and tab active pills should have a sliding indicator background (`layoutId="active-pill"`) rather than instant background swaps.

---

## 4. Notifications & Toast Architecture (Sonner Pattern)

1. **Physical Stacking:**
   * Toasts must layer behind one another with subtle scale and translation (`scale(0.95)`, `translateY(8px)`).
   * Hovering over the stack smoothly expands and fans out all notifications.
2. **Swipe-to-Dismiss:**
   * Notifications should support velocity-based swipe gestures that follow user finger/cursor inertia.

---

## 5. Accessibility & Reduced Motion

Always respect user preferences:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
When reduced motion is active, fallback immediately to clean opacity crossfades without positional displacement.
