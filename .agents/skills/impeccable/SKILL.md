---
name: impeccable
description: >-
  Use this skill whenever crafting, reviewing, or refactoring user interfaces, CSS, Tailwind classes, or React components to ensure impeccable craft, precision layout, typographic harmony, and complete interactive states.
---

# Impeccable Craft & UI Engineering Standards

This skill codifies the standard of **impeccable craftsmanship** in software design. It enforces zero visual bugs, rigorous layout discipline, complete interactive states, and pixel-level refinement across modern web applications.

---

## 1. Zero Visual Bugs & Alignment Rigor

1. **Baseline & Icon Alignment:**
   * Never let icons misalign with typography. Always use `inline-flex items-center justify-center gap-1.5` or `gap-2`.
   * Icons paired with text should match the optical size of the text (e.g., `text-sm` with `h-4 w-4`, `text-xs` with `h-3.5 w-3.5`, `text-base` with `h-5 w-5`).
2. **Scrollbar Hygiene:**
   * Prevent unintended layout shift from scrollbars with `scrollbar-gutter: stable`.
   * Tables and code blocks with horizontal overflow must use custom slim scrollbars that don't crowd cell content.
3. **No Text Overflow / Clipping:**
   * Labels, table headers, and badges must have defensive text constraints: `truncate`, `whitespace-nowrap`, or intentional wrapping.
   * Floating elements (tooltips, dropdowns) must use collision detection boundaries (`CollisionBoundary`) to never clip off-screen.

---

## 2. Complete State Matrix (The 8 Mandatory States)

Every interactive component MUST explicitly define styles for all applicable states:
1. **Default:** Crisp, accessible contrast against the underlying surface.
2. **Hover:** Clear visual affordance (subtle background tint change, border brightness lift).
3. **Focus-Visible:** Prominent, accessible focus rings that never overlap neighboring borders (`ring-2 ring-primary/80 ring-offset-2 ring-offset-background outline-none`).
4. **Active / Pressed:** Physical indentation (`active:scale-[0.98]` or darker background).
5. **Selected / Active Route:** Distinct styling (e.g. solid badge, indicator line, or saturated text).
6. **Disabled:** Reduced opacity (`opacity-50 pointer-events-none cursor-not-allowed`).
7. **Loading / Pending:** Skeleton shimmers (`animate-pulse bg-muted rounded`) or inline spinners that preserve exact dimensions to prevent layout jumps.
8. **Empty State:** Thoughtful, informative empty screens with context-relevant icons, clear descriptions, and actionable next steps.

---

## 3. Strict Spacing Cadence & Grid Rhythm

1. **4px / 8px Spatial Grid:**
   * Strictly adhere to a disciplined spacing scale:
     * `gap-1` (4px), `gap-1.5` (6px), `gap-2` (8px) for icon + text pairings.
     * `p-3` (12px), `p-4` (16px), `p-6` (24px) for card and container padding.
     * `space-y-6` (24px), `space-y-8` (32px) for page section division.
   * **Rule:** Never use arbitrary, random pixel values (e.g., `margin-top: 17px;`) when a standardized design token exists.

2. **Visual Hierarchy in Tables:**
   * Numeric values, percentages, and latencies must ALWAYS be **right-aligned** with tabular numbers (`tabular-nums font-mono text-right`).
   * Column headers must align with their content (left for text, right for numbers).
   * Row heights must remain consistent (`py-3` or `py-3.5`).
   * Header borders must have higher visual weight than row separators.

---

## 4. Depth, Borders & Layering

1. **Subtle Boundaries over Heavy Outlines:**
   * Avoid stark 1px solid borders in dark mode. Use semi-transparent borders: `border border-border/50` or `border border-white/10`.
2. **Layered Shadows:**
   * Use multi-step diffused shadows for floating cards and modals:
     ```css
     box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05),
                 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                 0 4px 6px -2px rgba(0, 0, 0, 0.05);
     ```
3. **Glassmorphism with Restraint:**
   * For fixed navigation headers and sticky table bars, combine subtle background translucency with backdrop blur:
     `bg-background/80 backdrop-blur-md border-b border-border/40`.

---

## 5. Anti-Slop Checklist (Eliminating AI Aesthetic Flaws)

When designing with this skill, actively reject these generic AI interface patterns:
- ❌ Do NOT plaster multi-color rainbow gradients onto every button and card border.
- ❌ Do NOT create massive floating cards with 60px of useless empty padding.
- ❌ Do NOT use vague placeholder copy like "Analyze your metrics efficiently". Use concrete, domain-accurate terminology.
- ❌ Do NOT use generic emoji-heavy lists when polished SVG icons from `lucide-react` exist.
