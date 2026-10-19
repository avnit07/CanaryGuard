# CanaryGuard — UI Design System Specification (`DESIGN.md`)

> **Metaphor**: A precise "flight deck / control plane" for infrastructure engineers.  
> **Mood**: Calm, precise, serious, restrained (inspired by Linear, Grafana, and Cloudflare Radar).

---

## 1. Color Rule: Solid Colors Only

* **NO gradients anywhere**: Backgrounds, buttons, text, progress bars, borders must all use solid fills.
* **NO blur or glassmorphism**: Modals, popovers, and sticky headers use solid surfaces or flat alpha overlays (`rgba(7, 9, 14, 0.8)`).
* **NO decorative drop shadows**: Depth comes exclusively from solid surface steps + 1px borders + spacing.
* **NO pure black (`#000000`) and NO pure white (`#FFFFFF`)**.
* **Status LED glow exception**: The *only* glow allowed in the entire system is a subtle 6px radius glow halo on status LED indicator dots.

---

## 2. Design Tokens

All colors are strictly defined as CSS variables and mirrored in `tailwind.config.ts`. Hardcoded hex values outside token definitions are strictly prohibited.

### 2.1 Surfaces & Geometry
| Token Name | CSS Variable | Obsidian (Dark) | Technical Paper (Light) | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| **Page** | `--bg-page` | `#07090E` | `#F4F6F9` | Canvas / viewport background |
| **Surface** | `--bg-surface` | `#0C0F17` | `#FFFFFF` | Level 1: Standard containers & panels |
| **Elevated** | `--bg-elevated` | `#111622` | `#FFFFFF` | Level 2: Modals, dropdown menus, callouts |
| **Raised** | `--bg-raised` | `#171E2E` | `#E9EEF5` | Interactive hover rows, active states, text inputs |
| **Border** | `--border-subtle` | `#1E2638` | `#D8E0EA` | Default 1px dividing lines & container outlines |
| **Border Strong** | `--border-strong` | `#2A364F` | `#B8C4D4` | High-contrast borders, active cards, modal outlines |

### 2.2 Typography Colors
| Token Name | CSS Variable | Obsidian (Dark) | Technical Paper (Light) | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| **Text Primary** | `--text-primary` | `#E6EAF2` | `#0F172A` | Headings, active values, high-contrast labels |
| **Text Muted** | `--text-muted` | `#8A94A8` | `#64748B` | Secondary labels, descriptions, table headers |

### 2.3 Semantic Signal Palette (Strictly 1 Meaning per Color)
| Token Name | CSS Variable | Obsidian (Dark) | Technical Paper (Light) | Strictly Assigned Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Cyan** | `--signal-cyan` | `#00D8F6` | `#0284C7` | **Primary actions and focus rings ONLY** |
| **Emerald**| `--signal-emerald` | `#00F59B` | `#059669` | **Healthy service / successfully promoted release** |
| **Amber** | `--signal-amber` | `#FFB224` | `#D97706` | **Canary in-flight / observation window / warning** |
| **Coral** | `--signal-coral` | `#FF4B6E` | `#E11D48` | **Critical failure / SLA breach / rollback execution** |
| **Steel** | `--signal-steel` | `#6B7A99` | `#475569` | **Baseline traffic / neutral data / metadata** |

*(Note: The purple signal color is completely removed. AI panels use text, steel, and emerald only).*

---

## 3. Typography Scale & Fonts

* **Fonts**:
  - **Headings & Body**: `Geist` (loaded via `next/font/google`).
  - **Data, Hashes, Numbers, Logs, Timestamps**: `Geist Mono` with `font-variant-numeric: tabular-nums;`.
* **Type Scale**:
  - `40px` (Page title)
  - `28px` (Section title / Hero metric)
  - `20px` (Card header / Modal title)
  - `16px` (Body base / Default control text)
  - `14px` (Secondary text / Table cells / Form labels)
  - `12px` (Micro-labels, timestamps, commit chips, LED status text)

---

## 4. Spacing, Radius & Layout

* **Base Scale**: 4px grid (`4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px`).
* **Corner Radius**:
  - **`4px` everywhere** (Buttons, inputs, badges, cards, panels, table rows).
  - **`6px` exclusively for modals**.
* **Depth & Elevation**:
  - Exactly **two panel levels**: Level 1 (`Surface`) and Level 2 (`Elevated`).
  - Content hierarchy within panels is created through 1px borders, subtle row backgrounds (`Raised`), and spacing—never nested sub-cards.

---

## 5. Strict "DO NOT" List

1. ❌ **NO Gradients**: Never use linear or radial gradients on buttons, text, progress bars, or backgrounds.
2. ❌ **NO Glassmorphism or Backdrop Blur**: Flat solid colors and flat translucent overlays only.
3. ❌ **NO Emoji**: Use Lucide icons only with a uniform 1.5px stroke width.
4. ❌ **NO Hazard Stripes**: Use clean 2px solid alert borders instead.
5. ❌ **NO Bezier Curve Smoothing on Charts**: Straight polyline segments only.
6. ❌ **NO Purple**: AI analysis panels use crisp dark surface, mono headers, and steel/emerald accents.
7. ❌ **NO Color Alone for Status**: Every status LED must be paired with explicit text.
8. ❌ **NO Decorative Animation**: Only functional 150-250ms transitions. Pulses stop when `prefers-reduced-motion` is detected.
