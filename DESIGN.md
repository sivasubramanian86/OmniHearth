# Design System: Warm Neumorphic Household OS

This document defines the extracted design tokens, elevation physics, layout rules, and component specs for **OmniHearth**, as ingested from Google Stitch. All frontend code must strictly implement these tokens and rules.

---

## 1. Color System (Tailwind & CSS Tokens)

The palette is rooted in Earth tones to reduce digital eye strain and create a warm, physical presence inside the home. Colors must be implemented using CSS custom variables with standard `oklch()` definitions for uniform luminance, and fallbacks matching the Stitch HEX tokens.

### Theme Palette (Light Mode Default)

| Token Name | Stitch HEX | OKLCH Value (2026 Standard) | Role |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#f5faff` | `oklch(97.8% 0.008 245)` | Core canvas background |
| `--bg-surface` | `#ffffff` | `oklch(100% 0 0)` | Base surface for cards / buttons |
| `--bg-surface-dim` | `#ccdce9` | `oklch(87.5% 0.02 245)` | Neumorphic dark shadow source |
| `--bg-container` | `#e0f0fd` | `oklch(93.8% 0.015 245)` | Standard card/widget background |
| `--text-primary` | `#0e1d26` | `oklch(16.5% 0.025 245)` | Core body, title text |
| `--text-muted` | `#56423e` | `oklch(35.2% 0.018 35)` | Secondary labels / subtitle text |
| `--accent-primary` | `#9f402d` | `oklch(45.5% 0.18 30)` | Active state / Terracotta primary |
| `--accent-primary-container` | `#e2725b` | `oklch(62.8% 0.19 32)` | Warm warnings / kitchen alerts |
| `--accent-secondary` | `#56642b` | `oklch(44.2% 0.12 110)` | Calm indicators / Sage Green |
| `--accent-secondary-container` | `#d6e7a1` | `oklch(88.4% 0.14 112)` | Health / garden / power saving |
| `--accent-tertiary` | `#685d42` | `oklch(42.5% 0.08 85)` | Neutral ground / Sand Amber |
| `--border-subtle` | `#ddc0ba` | `oklch(81.2% 0.028 32)` | Ambient dividers / input border |

---

## 2. Typography

We pair a friendly, rounded geometric sans-serif for display/headlines with a highly legible humanist sans-serif for structured information.

*   **Display & Headline Font:** **Quicksand** (Google Fonts)
    *   Used for: Clock face, current temperature, page titles, active navigation headings.
    *   Styling: Heavy weights (`600`, `700`), loose tracking for labels.
*   **Body & Label Font:** **Nunito Sans** (Google Fonts)
    *   Used for: Household data tables, chat messages, system logs, sensor telemetry.
    *   Styling: Regular/Semi-bold weights (`400`, `600`).

### Type Scale Config

```css
--font-display: 'Quicksand', system-ui, sans-serif;
--font-body: 'Nunito Sans', system-ui, sans-serif;

--text-display-lg: clamp(2rem, 6vw, 3rem);     /* 32px to 48px */
--text-headline-md: clamp(1.25rem, 4vw, 1.5rem); /* 20px to 24px */
--text-body-lg: 1.125rem;                        /* 18px */
--text-body-md: 1rem;                            /* 16px */
--text-label-sm: 0.8125rem;                      /* 13px, tracking: 0.05em, bold */
```

---

## 3. Layout & Geometry

The interface uses a fluid, grid-based dashboard that adapts structurally to different viewport boundaries, allowing widgets of irregular heights to sit organically together.

*   **Grid System:**
    *   **Desktop:** 12-column masonry grid with `24px` (`1.5rem`) gutters.
    *   **Mobile / Tablet:** Single-column layout (< 768px) and dual-column layout (768px to 1024px) vertical stacks.
    *   **Card Gap:** Fixed at `20px`.
*   **Border Radii (Softness scale):**
    *   Containers / Cards: `2rem` (`32px`)
    *   Buttons / Interactive Inputs: `full` (`9999px`)
    *   Nested Chips / Micro-components: `1rem` (`16px`)
    *   Small UI Indicators: `0.5rem` (`8px`)

---

## 4. Neumorphic Elevation & Physics

OmniHearth achieves depth by extruding shapes out of the background plane using dual light/dark shadow gradients.

### 4.1 Ambient Light Source Settings
*   **Direction:** Top-Left (`145°` angle)
*   **Top-Left Shadow (High Light):** `#FFFFFF` at `70%` opacity (Blur: `24px` to `40px`)
*   **Bottom-Right Shadow (Low Light):** `--bg-surface-dim` (derived from muddy sand `#ccdce9`) at `35%` opacity.

### 4.2 Elevation States (CSS Classes)

```css
/* Extruded Card (Default State) */
.neumorphic-flat {
  background: var(--bg-canvas);
  box-shadow: 
    10px 10px 20px var(--bg-surface-dim),
    -10px -10px 20px var(--bg-surface);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
              box-shadow 0.3s ease;
}

/* Hover State (Magnetic Lift) */
.neumorphic-flat:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 
    14px 14px 28px var(--bg-surface-dim),
    -14px -14px 28px var(--bg-surface);
}

/* Sunken State (Clicked / Active Input) */
.neumorphic-sunken {
  background: var(--bg-canvas);
  box-shadow: 
    inset 6px 6px 12px var(--bg-surface-dim),
    inset -6px -6px 12px var(--bg-surface);
}
```

---

## 5. Component Guidelines

1.  **Sidebar Profiles:**
    *   Sidebar navigation uses family profile avatars.
    *   Active/Inactive profiles must shift between `.neumorphic-flat` and `.neumorphic-sunken` states.
    *   Transition animations must use Framer Motion springs (`stiffness: 150, damping: 15`).
2.  **Buttons:**
    *   Minimum touch target height of `56px`.
    *   Primary CTA: Terracotta (`#9f402d`) with smooth top-left gradient to simulate a raised 3D surface.
    *   Secondary: Matches the canvas background, distinguished solely by its soft neumorphic extrusion.
3.  **Toggles / Sliders:**
    *   Must emulate mechanical sliders of high-fidelity stereo equipment.
    *   Active state tracks must illuminate in Sage Green (`#56642b`).
