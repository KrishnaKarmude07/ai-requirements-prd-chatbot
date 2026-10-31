---
name: Syntropic PRD Engine
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#464555'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#005522'
  on-tertiary: '#ffffff'
  tertiary-container: '#00702f'
  on-tertiary-container: '#78f591'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '600'
    lineHeight: 3.5rem
    letterSpacing: -0.035em
  headline-xl:
    fontFamily: Inter
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.625rem
    letterSpacing: -0.011em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.5rem
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: -0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: 0.01em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

The design system embodies enterprise-grade precision, cognitive clarity, and computational craft. Tailored for product leaders, technical architects, and engineering managers, it treats requirements authoring not as passive documentation, but as an interactive, intelligent workspace.

### Design Aesthetic: Precision Minimalist & Instrumental Modern
Drawing from the sharp structural utility of Linear, the editorial focus of Notion, and the atmospheric restraint of Vercel, the design language balances utilitarian productivity with refined tactile luxury.

- **Cognitive Quietude:** High-density workspaces require visual silence. Heavy chrome, saturated fills, and decorative visuals are removed in favor of meticulous alignment, whitespace pacing, and semantic contrast.
- **Instrumental Tactility:** Interfaces feel like machined software instruments—crisp 1px hairline dividers, subtle inner glow states, precise sub-pixel micro-shadows, and smooth micro-interactions (120–160ms ease-out transitions).
- **Executive Elegance:** Monochromatic slate foundations paired with purposeful indigo accents preserve an authoritative tone suited for mission-critical product specs and board-level documentation.

## Colors

The color architecture is built around calibrated contrast tiers, strict functional separation between interactive focus and structural hierarchy, and zero color noise.

### Palette Roles
- **Canvas Base (`#F8FAFC`):** Primary canvas wash providing subtle optical separation from pure white floating window elements.
- **Surface Elevation (`#FFFFFF`):** High-clarity workspace tier reserved for editable PRD canvases, active modal dialogs, data tables, and elevated panels.
- **Structural Outlines (`#E2E8F0`):** Single-pixel perimeter boundaries across split panes, editor borders, dropdown menus, and card modules.
- **Primary Ink (`#111827`):** High-density neutral for section titles, active parameters, metadata headers, and active state indicators (WCAG AAA compliant).
- **Secondary Ink (`#64748B`):** Muted slate for peripheral copy, placeholder labels, breadcrumbs, timestamp tags, and unselected tab navigations.
- **Accent Primaries (`#4F46E5` / `#4338CA` / `#EEF2FF`):** Reserved exclusively for high-intent actions—AI generation triggers, active selection cursors, inline prompt pills, and key validation CTA states.
- **Status Semantics:**
  - **Success (`#16A34A`):** Test validation passed, PRD exports completed, schema synchronizations confirmed.
  - **Warning (`#D97706`):** Ambiguous acceptance criteria, missing schema dependencies, context-window saturation warnings.
  - **Error (`#DC2626`):** Failed generation calls, broken syntax rules, invalid technical dependencies.

## Typography

Typography relies entirely on the precision and systematic geometric proportions of **Inter** across all application planes, complemented by a monospaced variant for logic definitions, schema validations, and API parameter tokens.

### Rhythm & Type Rules
- **Negative Letter Spacing (Kerning Tighter on Scale):** Display and Headline tiers compress letter spacing systematically (`-0.035em` to `-0.015em`) to provide the signature crisp, condensed Linear/Vercel aesthetic.
- **Document Prose Scale:** Body sizes adhere to strict ergonomic reading heights. Spec paragraphs leverage `body-lg` at 1.625rem line height to minimize optical fatigue across complex 2,000-word PRD reviews.
- **Tabular Numerals & Monospace Elements:** All table values, token metrics, generation cost displays, and latency badges enforce `font-feature-settings: "tnum" 1` to ensure absolute vertical alignment.

## Layout & Spacing

The layout model is driven by an 8pt base grid with a fine 4pt sub-grid for dense technical controls, sidebar navigations, and code blocks.

### Layout Mechanics
- **Three-Pane Modular Architecture:**
  - **Left Rail (Fixed 240px - 280px):** Workspace navigation, project repos, and spec directory hierarchies.
  - **Center Canvas (Fluid with Max Constraint):** Constrained between 720px (pure Notion-style document view) and 1080px (split-view PRD generation mode).
  - **Right Copilot Inspector (Collapsible 360px - 420px):** Dynamic context engine, parameter controls, validation checkers, and streaming AI assistant thread.
- **Breakpoints & Fluid Adaptation:**
  - **Desktop (>=1280px):** Persistent 3-column workflow layout; gutters lock to `gutter-desktop` (1.5rem).
  - **Tablet (768px - 1279px):** Inspector and Left Rail collapse to overlay side-drawers; the document canvas becomes fluid with `margin-tablet` (1.5rem).
  - **Mobile (<768px):** Unified single-column viewport. Navigation migrates to an app bar; generation interactions transition into bottom sheets.

## Elevation & Depth

Visual hierarchy prioritizes surface tone distinctions and razor-sharp hairline borders over deep shadows, evoking an architect’s draft table.

### Layer Hierarchy
1. **Canvas Surface (`#F8FAFC`):** The structural bedrock of the workspace.
2. **Elevated Document & Panels (`#FFFFFF`):** Delineated via a crisp `1px solid #E2E8F0` border. Shadows on baseline elements are intentionally avoided to maintain clean visual boundaries.
3. **Floating Contextual Objects:** Menus, slash-command drop-downs, command palettes (Cmd+K), and popovers leverage micro-level ambient diffusion:
   - **Subtle Surface (`Elevation 1`):** `0 1px 2px 0 rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8)`
   - **Floating Flyout / Popover (`Elevation 2`):** `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05), 0 0 0 1px #E2E8F0`
   - **Command Palette / Modal Backdrop (`Elevation 3`):** `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(226, 232, 240, 0.9)` with a frosted translucent backdrop veil (`rgba(248, 250, 252, 0.8)` with `backdrop-filter: blur(8px)`).

## Shapes

The geometric architecture relies on **Soft (`roundedness: 1`)** curves. This tight curvature preserves a serious, developer-grade personality while preventing harsh corner friction.

### Corner Curvature Rules
- **Base Components (Inputs, Buttons, Badges, Tabs):** `0.375rem` (6px) to `0.25rem` (4px). Clean, contained, and compact.
- **Container Surfaces (Cards, Inspector Blocks, Modals):** `0.5rem` (8px). 
- **Interactive Micro-Indicators (Status dots, radio selectors):** Standard circular rounding (`9999px`).
- **Slash Commands & AI Prompt Containers:** Sub-pixel inner border radius nested cleanly inside outer containers, eliminating uneven visual gaps.

## Components

### Buttons
- **Primary (Generate/Save):** Background `#4F46E5`, foreground `#FFFFFF`, border none, border-radius `6px`, padding `0.5rem 1rem`. Hover: `#4338CA`. Active: scale transform down to `0.98`. Focus-visible: 2px offset ring with `#4F46E5`.
- **Secondary / Ghost:** Background `#FFFFFF`, text `#111827`, border `1px solid #E2E8F0`. Hover: background `#F8FAFC`, border `#CBD5E1`.
- **AI Action Variant:** Background `#EEF2FF`, text `#4F46E5`, subtle border `1px solid #C7D2FE`. Hover: `#E0E7FF`. Iconography uses Lucide sparkles (`16px`).

### Text Inputs & Rich PRD Editor Blocks
- **Field Anatomy:** Canvas `#FFFFFF`, text `#111827`, border `1px solid #E2E8F0`, corner radius `6px`. Font `body-md`.
- **States:** Hover border changes to `#CBD5E1`. Focus transitions to a crisp single-pixel ring: `border-color: #4F46E5; box-shadow: 0 0 0 1px #4F46E5`.
- **Inline Editor Blocks (Notion-style):** Transparent boundary by default. Hover reveals a 6-dot drag handle in `#94A3B8`. Slash prompt (`/`) triggers a 280px floating menu elevated via `Elevation 2`.

### Chips & Semantic Badges
- **Specification Status Indicators:** Height `24px`, font `label-sm`, padding `0.125rem 0.5rem`, border radius `4px`.
- **Variants:**
  - *Draft:* Background `#F1F5F9`, text `#475569`.
  - *In Review:* Background `#FEF3C7`, text `#B45309`.
  - *Approved:* Background `#DCFCE7`, text `#15803D`.
  - *AI Generated:* Background `#EEF2FF`, text `#4338CA`, border `1px solid #C7D2FE`.

### Checkboxes & Radio Controls
- **Checkboxes:** Size `16px x 16px`, corner radius `4px`, border `1px solid #CBD5E1`. Checked state: background `#4F46E5`, white checkmark glyph.
- **Radio Buttons:** Size `16px x 16px`, concentric inner circle on active selection with a 2px white gap isolating the `#4F46E5` center pip.

### Cards & Container Panels
- **Structure:** Solid `#FFFFFF` surface enclosed in a uniform `1px solid #E2E8F0` border. Padding scaled uniformly via `space-lg` (1.5rem).
- **Interactive Cards:** Hover introduces a micro-lift: border shifts to `#CBD5E1`, coupled with `Elevation 1`.

### Specialized Domain Components
- **Copilot Streaming Prompt Bar:** Fixed floating pill container anchored at the bottom-center of the canvas. Height `48px`, background `rgba(255, 255, 255, 0.95)`, blur `12px`, border `1px solid #E2E8F0`, shadow `Elevation 2`. Houses context chips, input field, and direct action triggers.
- **Diff / Version Comparison View:** Split side-by-side or unified inline review. Deletions styled with soft crimson wash (`#FEF2F2`, text `#991B1B`); additions styled with soft emerald wash (`#F0FDF4`, text `#166534`).