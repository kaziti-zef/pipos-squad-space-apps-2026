# AgriRot — Visual Identity Guide

Visual source of truth for the frontend. The values are implemented in `src/app/globals.css` (`@theme` block): **never hard-code a colour in a component**, use the generated Tailwind classes (`bg-forest`, `text-ink-muted`…).

Reference: validated mock-up "AgriRot — Maquette" (13 screens).

---

## 1. Identity

| Element | Value |
|---|---|
| Name | **AgriRot** |
| Promise | "Rotations that protect your soil, your water and your income." |
| Audience | **Farmers**, often unfamiliar with digital tools and scientific vocabulary. |
| Tone | Clear, reassuring, short sentences, everyday words ("your field", "the rain", "the heat", "your land"). |
| Home page | **No technical detail**: no source names (POWER, SMAP, NDVI…), resolutions, numeric scores or rule codes (R1, R2). |
| Application screens | Technical terms only when useful, always with an (i) bubble giving a one-sentence explanation. |
| Stance | The tool **supports** the decision, it does not make it. Permanent banner on all signed-in screens. |
| Language | French (default), English planned (`Accept-Language`). |
| Logo | Official pictogram: 3 rotation arrows (light green `#4ADE80`, amber `#F59E0B`, green `#16A34A`) around a young shoot, + "AgriRot" in Poppins 700. **≥ 44 px**: cut-out PNG `public/brand/agrirot-icon.png` (`BrandIcon`). **≤ 40 px**: simplified SVG version (`BrandMark`, also `src/app/icon.svg` for the tab). iOS icon: `src/app/apple-icon.png`. White text on dark background, forest green on light background. |

## 2. Colours

### Brand
| Token | Hex | Usage |
|---|---|---|
| `forest-950` | `#0E3B20` | Sidebar, dark sections, text on leaf green |
| `forest` (900) | `#14532D` | Primary colour: main buttons, accent headings, selection |
| `forest-700` | `#166534` | Links, green text on light background (≥ 6:1 on beige, AA) |
| `leaf` (500) | `#22C55E` | Accent: CTA on dark background, active menu item, score rings |
| `leaf-300` | `#86EFAC` | Accent on dark background (text, icons) |
| `leaf-100` | `#DCFCE7` | Success backgrounds, legume chips |
| `beige` | `#F5EFE6` | Application page background |
| `sand` | `#E9E0D0` | Warning banner, footer |
| `sand-200` | `#F1ECE3` | Secondary buttons, neutral chips |
| `line` | `#E3DACB` | Dividers |
| `line-soft` | `#EFE8DC` | Inner dividers, gauge tracks |
| `field` | `#DCD2C2` | Form field border |
| `white` | `#FFFFFF` | Cards |

### Text
| Token | Hex | Usage |
|---|---|---|
| `ink` | `#17251C` | Main text |
| `ink-soft` | `#3B4A40` | Strong secondary text |
| `ink-muted` | `#55645A` | Labels, metadata (≥ 4.5:1 on white and beige) |

### Semantic
| Role | Background | Text / stroke |
|---|---|---|
| Success / high | `#DCFCE7` | `#14532D` |
| Warning / medium | `#FEF3C7` (`#FFFBEB` card) | `#78350F` / `#92400E` / icon `#B45309` |
| Error / critical | `#FEE2E2` | `#7F1D1D` / `#B91C1C` |
| Information / cache plan B | `#DBEAFE` | `#1E3A8A` / `#1E40AF` |
| Read-only (advisor) | `#EEF2FF` | `#1E3A8A` |

### Data (charts)
| Series | Colour |
|---|---|
| Rainfall (bars) | `#3B82F6` |
| Normal (line) | `#1E293B` (rainfall), `#9CA3AF` dotted (temperature) |
| Temperature | `#EA580C` |
| Soil moisture + / − | `#0E7490` / `#C2410C` |
| NDVI | `#15803D` (thresholds: 0.2 `#C2410C` · 0.6 `#15803D`, dotted) |
| Water stress band | `rgba(245,158,11,.28)` |
| Bare soil band | `rgba(146,64,14,.18)` |
| Selected month | `rgba(20,83,45,.12)` |

### Botanical families (season dots)
| Family | Dot | Crop card background |
|---|---|---|
| Poaceae (maize) | `#F59E0B` | `#FEF3C7` |
| Fabaceae (cowpea, groundnut, bean) | `#22C55E` | `#DCFCE7` |
| Euphorbiaceae (cassava) | `#A16207` | `#EDE3D3` |
| Convolvulaceae (sweet potato) | `#C2410C` | `#FDE7D7` |
| Dioscoreaceae (yam) | `#7C3AED` | `#F3E8FF` |
| Solanaceae (tomato) | `#DC2626` | `#FEE2E2` |
| Musaceae (plantain) | `#0E7490` | `#CFFAFE` |

### Priorities
| Priority | Background | Icon | Weight bar |
|---|---|---|---|
| Save water | `#DBEAFE` | `#1E40AF` | `#3B82F6` |
| Income | `#FEF3C7` | `#92400E` | `#F59E0B` |
| Soil health | `#EDE3D3` | `#5B3A12` | `#A16207` |
| Nitrogen supply | `#DCFCE7` | `#14532D` | `#22C55E` |
| Erosion control | `#FDE7D7` | `#9A3412` | `#EA580C` |
| Fodder value | `#F3E8FF` | `#6B21A8` | `#A855F7` |

### Reading thresholds
- **Score** (0–100): ≥ 75 green `#15803D` · 50–74 amber `#D97706` · < 50 red `#B91C1C`.
- **Confidence**: ≥ 0.80 high · 0.60–0.79 medium · < 0.60 low.
- **Stability** (resilience 0–1): ≥ 0.85 very good · 0.70–0.84 good · < 0.70 low. **Never displayed out of 100.**

## 3. Typography

| Role | Font | Size / weight / line height |
|---|---|---|
| Display (hero) | Poppins | 56 px · 700 · 1.08 · letter-spacing −1.5 px |
| Page H1 | Poppins | 30 px · 700 · letter-spacing −0.5 px (32 px dashboard) |
| Section H2 (home) | Poppins | 38 px · 700 · 1.15 · −0.8 px |
| Card H2 | Poppins | 18–19 px · 600 |
| H3 | Poppins | 16–17 px · 600 |
| KPI | Poppins | 28 px · 700 |
| Score (ring) | Poppins | 24 px · 700 |
| Body | Inter | 15–16 px · 400 · 1.55 |
| Hero body | Inter | 19 px · 400 · 1.55 |
| Field label | Inter | 14 px · 600 |
| Meta / help | Inter | 13 px · 400–500 |
| Eyebrow | Inter | 13 px · 600 · UPPERCASE · +1.5 px |
| Chip | Inter | 12 px · 600–700 |

Loading: `next/font/google` (Poppins 500/600/700, Inter 400/500/600/700), variables `--font-poppins`, `--font-inter`.

## 4. Spacing, radii, shadows

- Base grid **4 px**. Common steps: 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 20 · 22 · 24 · 28 · 32 · 40 · 48 · 56 · 64 · 88 · 96.
- Page gutters: **32 px** (desktop), **16 px** (mobile).
- Max widths: home **1280 px** · application **1180 px** · strategies **1240 px** · sheet/history **1080 px**.
- Sidebar: **248 px**.

| Radius | Value | Usage |
|---|---|---|
| `rounded-xs` | 8 px | Month pills, small square chips |
| `rounded-sm` | 10 px | Crop cards, labels on the map |
| `rounded-md` | 12 px | Fields, choice buttons, callouts |
| `rounded-lg` | 14 px | Season rows, sub-cards |
| `rounded-xl` | 16 px | NASA callouts, history cards |
| `rounded-2xl` | 20 px | Standard cards |
| `rounded-3xl` | 22–24 px | Strategy cards, photos, bottom sheet |
| `rounded-full` | — | Buttons, chips, avatars |

Card shadow: `0 1px 2px rgba(20,83,45,.06), 0 8px 24px rgba(20,83,45,.06)`.
Floating shadow (map): `0 4px 16px rgba(0,0,0,.18)`.

## 5. Components

| Component | Specification |
|---|---|
| **Primary button** | Pill, height 46 px (48–54 px hero), `bg-forest text-white`, 14–16 px 600. CTA variant: `bg-leaf text-forest-950`. |
| **Secondary button** | `bg-sand-200 text-forest` or `1.5px forest` outline. |
| **Ghost button (hero)** | White 70 % outline, white text. |
| **Card** | White, `rounded-2xl`, card shadow, padding 18–24 px. |
| **Field** | Height 48 px, `rounded-md`, 1.5 px `field` border, focus: `leaf` border + 4 px `leaf/18 %` halo. Error: `#B91C1C` border + 13 px message with icon. |
| **Choice button** | 48 px, `rounded-md`, `field` border; selected: `forest` border, `leaf-100` background, `forest` text. |
| **Chip** | Pill 4×10 px, 12 px 600. |
| **Banner** | Full width, 12 × 32 px, 18 px icon + 14 px text, semantic colours. |
| **Score ring** | `conic-gradient`, diameter 92 px (64 px hero, 74 px mobile), 72 px white hole. |
| **Stability gauge** | 3 segments of 8 px, colour according to level. |
| **Confidence badge** | Green chip (high) or amber (medium/low). |
| **(i) bubble** | 28 px circle, `#C9BFAE` border, serif "i"; open: `forest` background, `forest` tooltip with 13 px white text. |
| **Season row** | 40 px min, `rounded-lg`, 12 px season label, 10 px family dot, crop 600; alternating `#F3EEE5` / `#FAF7F2`. Red R1 / green R2 transition in 12 px above. |
| **Sidebar** | `forest-950`, active item `bg-leaf text-forest-950`, 44 px items. |
| **Mobile navigation** | White bottom bar, 5 items 56 px. |

## 6. Iconography

- **lucide-react**, 2 px stroke, sizes 16 / 18 / 20 / 22 / 24.
- Never emoji in the interface.
- Decorative icons: `aria-hidden`. Icon-only buttons: `aria-label`.

## 7. Photography

- Farmers from Central and West Africa, in their fields, natural light (`public/images/farmers/`).
- Hero: overlay `linear-gradient(90deg, rgba(9,36,20,.86) 0%, rgba(9,36,20,.55) 45%, rgba(9,36,20,.05) 80%)`.
- Always a descriptive `alt` in French.

## 8. Motion (GSAP)

| Animation | Technique | Parameters |
|---|---|---|
| Hero text appearance | **CSS** (`.hero-rise`) — never GSAP above the fold (the text must not disappear when JavaScript arrives on a slow network) | 0.8 s, `cubic-bezier(.22,1,.36,1)`, delays 0 / 80 / 160 / 240 / 340 ms |
| Hero carousel | CSS + small client component | 1 photo every **6 s**, 1 s fade, slight zoom 1 → 1.08 over 9 s; vertical controls rail on the right (horizontal at the bottom on mobile); framing specific to mobile and desktop for each photo |
| Clouds | CSS (`.sky-cloud`, `SkyClouds` component) | **in the dark "Seen from the sky" section only** (never over photos of people), 4 clouds of 95 to 150 s, opacity 5–7 %, soft edges; removed if "reduce motion" is on |
| Scroll invitation | CSS (`.hero-bounce`) | 1.6 s loop |
| Home page sections | GSAP ScrollTrigger (`Reveal`) | `from { y: 24, opacity: 0 }`, `stagger: 0.08`, only for sections still below the screen |
| Tab change / modal | CSS | 0.2–0.3 s |

**Carousel rules**: visible pause button (WCAG 2.2.2), pause on hover or focus of the controls, pause when the hero is off-screen or the tab is hidden, scrolling stopped by default if "reduce motion" is enabled, and only the displayed photo and the next one are downloaded.

All animations respect `prefers-reduced-motion`.

## 9. Accessibility

- Text contrast ≥ 4.5:1 (verified for `ink-muted` on white and beige).
- Touch targets ≥ 44 px.
- Forms: systematic `<label>`, errors linked by `aria-describedby`.
- Colours never the sole carriers of meaning (icon or text in addition).

## 10. Responsive

| Breakpoint | Width | Behaviour |
|---|---|---|
| Mobile | < 768 px | Sidebar replaced by bottom navigation; stacked columns; strategies in tabs |
| Tablet | 768–1279 px | Collapsible sidebar; 2-column grids |
| Desktop | ≥ 1280 px | Mock-up layout |
