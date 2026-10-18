---
name: taste
description: >-
  Use this skill to guide visual design, aesthetics, color palettes, visual hierarchy, and component styling. Enforces design restraint, editorial balance, high-end typography, and sophisticated data visualization.
---

# Design Taste & Aesthetic Judgment

This skill defines the **editorial taste and visual judgment** required to produce sophisticated, calm, and high-end software interfaces. Good taste is defined not by how much ornamentation is added, but by the intentionality of what is chosen and what is deliberately left out.

---

## 1. The Core Tenet: Restraint Over Decoration

1. **Subtlety as Strength:**
   * High-end software (Linear, Raycast, Vercel, Apple) is quiet. It never shouts for attention.
   * If a visual element (divider, shadow, badge, badge glow, colored icon) does not actively improve orientation, comprehension, or actionability, **remove it**.
2. **Whitespace as Structure:**
   * Whitespace is not empty void; it is the primary tool for grouping and hierarchy.
   * Prefer generous margins between distinct conceptual sections over dividing lines and nested box-within-a-box borders.

---

## 2. Nuanced Color Systems & Dark Mode Mastery

1. **Base Neutral Selection:**
   * Never use pitch-black (`#000000`) for surfaces in dark mode unless building an OLED-specific minimal screen.
   * Use tinted deep neutrals that harmonize with the brand:
     * **Cool / High-tech:** Slate (`#090d16` canvas, `#0f172a` card, `#1e293b` border).
     * **Neutral / Modern:** Zinc (`#09090b` canvas, `#18181b` card, `#27272a` border).
2. **Accent Economy:**
   * Limit vibrant accent colors to **one dominant semantic color** for primary actions and key data points.
   * Reserve yellow/amber for warnings, rose/red for destructive errors, and emerald/green for verified success.
   * Never mix conflicting saturated colors in the same visual viewport without semantic justification.

---

## 3. Typographic Balance & Editorial Tone

1. **Size-Weight Inversion:**
   * As font sizes get larger (titles, display numbers), reduce font weight (`font-semibold` or `font-medium` instead of heavy `font-black`).
   * As font sizes get smaller (captions, metadata, table headers), slightly increase weight and letter spacing:
     `text-xs font-semibold tracking-wider uppercase text-muted-foreground`.
2. **Tabular Numerics:**
   * When displaying data, statistics, IP addresses, or timestamps, always use monospaced or tabular numerals:
     `font-mono tabular-nums`. This prevents fluctuating column widths during updates.
3. **Contrast Discipline:**
   * Primary text: High contrast (`text-slate-100` or `text-zinc-50`).
   * Secondary text / context: Muted medium contrast (`text-slate-400` or `text-zinc-400`).
   * Subtle metadata / timestamps: Low contrast (`text-slate-500` or `text-zinc-500`).

---

## 4. Sophisticated Data Visualization Standards

1. **Tonal Palettes Over Rainbows:**
   * Never assign random contrasting colors (red, blue, yellow, green) to sequential chart bars.
   * Use coherent tonal gradients (e.g., varying depths of indigo/blue) or purposeful semantic contrast.
2. **Quiet Gridlines:**
   * Chart background grids should be barely perceptible: `stroke="#334155"` with `strokeDasharray="3 3"` or opacity 0.3.
3. **Floating Micro-Cards for Tooltips:**
   * Tooltips must look like native, tailored micro-cards:
     * Dark rounded container (`rounded-lg bg-slate-900/95 border border-slate-700/60 p-2.5 shadow-xl`).
     * Subtle blur (`backdrop-blur-sm`).
     * Crisp, aligned typography comparing series values cleanly.

---

## 5. The "Taste Checklist" Before Releasing Any UI

Before concluding any visual design change, ask:
1. *Does this look like serious, professional engineering software or a beginner tutorial template?*
2. *Is there visual clutter that can be subtracted without losing utility?*
3. *Are alignments exact and borders crisp?*
4. *Does the page feel calm and confident?*
