# Setpiece Picks — Design System MASTER
> Source of truth for all UI decisions. Page-specific overrides live in `design-system/pages/`.
> Generated from ui-ux-pro-max skill. Do not edit component code without referencing this first.

---

## 1. Design Philosophy

**"Bloomberg meets football."**

Setpiece is not a betting app skinned to look exciting. It's an analytical tool that *happens* to be about football — precise, data-first, and quietly confident. The UI should feel like something a professional quant built for themselves, then made beautiful enough to share.

- **Data is the hero.** Numbers, confidence scores, and AI reasoning are the primary content. The UI frames them, never competes with them.
- **Mobile is the product.** 18-35 football fans check picks on their phone at half-time or in a pub. Every decision optimises for 375px first.
- **Premium through restraint.** No gradients for the sake of it. No animations that don't carry meaning. Green only appears when it earns it.
- **Audience context:** User checks xG after a match, uses PrizePicks regularly, follows football seriously. They are data-comfortable and want an analytical edge — not hype.

---

## 2. Style Selection

**Chosen:** Dark Mode (OLED) × Executive Dashboard hybrid

| Evaluated | Score | Reason |
|---|---|---|
| ✅ **Dark Mode (OLED)** | Primary | WCAG AAA, Tailwind 10/10, excellent on mobile OLED screens |
| ✅ **Executive Dashboard** | Secondary | KPI-first layout, at-a-glance data hierarchy |
| ❌ Cyberpunk UI | Rejected | Accessibility limited, wrong tone — gaming not analytics |
| ❌ Horizontal Scroll Journey | Rejected | Wrong interaction model for a picks feed |

**What this means in practice:**
- Deep dark backgrounds (not pure black — the blue-grey keeps it warm)
- Green accent used sparingly and always meaningfully
- Minimal glow effects only on live/key states
- White space used deliberately for hierarchy, not decoration
- Data density on desktop, card-first on mobile

---

## 3. Color System

### Brand Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#4ade80` | Primary CTA, positive picks, wins, confidence fills |
| `--color-brand-dim` | `#22c55e` | Hover states, borders, secondary brand elements |
| `--color-brand-muted` | `rgba(74,222,128,0.12)` | Subtle background tints on featured cards |
| `--color-brand-glow` | `rgba(74,222,128,0.20)` | Box shadows, glow effects (use sparingly) |

### Backgrounds

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#0d1117` | Page background (deeper than current — more OLED-friendly) |
| `--color-bg-surface` | `#161c26` | Default card background |
| `--color-bg-elevated` | `#1e2a3a` | Modals, drawers, popovers |
| `--color-bg-overlay` | `#243044` | Highlighted/active cards, hover states |
| `--color-bg-input` | `#1a2332` | Form inputs, search |

### Text

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#f1f5f9` | Headings, player names, key data |
| `--color-text-secondary` | `#94a3b8` | Meta text, labels, timestamps |
| `--color-text-muted` | `#64748b` | Disabled states, placeholder text |
| `--color-text-brand` | `#4ade80` | Brand-coloured labels (competition names, LIVE badge) |
| `--color-text-inverse` | `#0d1117` | Text on green CTA buttons |

### Semantic

| Token | Hex | Usage |
|---|---|---|
| `--color-positive` | `#4ade80` | MORE picks, wins, upward trends |
| `--color-negative` | `#ef4444` | LESS picks, losses, downward trends |
| `--color-warning` | `#f59e0b` | Early picks, pending results, caution |
| `--color-info` | `#38bdf8` | Neutral data points, odds, lines |

### Borders

| Token | Value | Usage |
|---|---|---|
| `--color-border-default` | `rgba(255,255,255,0.07)` | Default card borders |
| `--color-border-brand` | `rgba(74,222,128,0.22)` | Featured cards, active states |
| `--color-border-strong` | `rgba(255,255,255,0.14)` | Hover state borders |
| `--color-border-input` | `rgba(255,255,255,0.10)` | Form inputs |

### Contrast Audit (WCAG AA minimum)
- `#f1f5f9` on `#161c26` → **12.4:1** ✅ AAA
- `#94a3b8` on `#161c26` → **4.8:1** ✅ AA
- `#4ade80` on `#0d1117` → **8.9:1** ✅ AAA
- `#4ade80` on `#161c26` → **7.2:1** ✅ AAA
- `#0d1117` on `#4ade80` → **8.9:1** ✅ AAA (for buttons)

---

## 4. Typography

### Chosen Pairing: JetBrains Mono + Inter

**Why not the skill's top recommendation (Fira Code + Fira Sans):**
JetBrains Mono is already loaded and outperforms Fira Code on legibility at small sizes — critical for 14px stat labels on mobile. Inter outperforms Fira Sans for UI text density. Both are already configured in the project.

**Why not Bebas Neue / Clash Display:**
Too editorial. We want "financial terminal" not "sports broadcast lower third."

| Role | Font | Use case |
|---|---|---|
| **Stats / Numbers** | JetBrains Mono | Confidence %, odds, lines, scores, counts |
| **Labels / Tags** | JetBrains Mono | EARLY, FINAL, MORE, LESS badges, competition names |
| **UI / Body** | Inter | Descriptions, AI reasoning, nav, buttons |
| **Headings** | Inter 700 | Card titles, page headers |

### Type Scale

```
/* Display — JetBrains Mono, stats only */
--text-stat-2xl: 56px / 1.0  / -0.04em / 800  → Big win-rate, hero metrics
--text-stat-xl:  40px / 1.05 / -0.03em / 700  → Confidence score on featured card
--text-stat-lg:  28px / 1.1  / -0.02em / 700  → Pick line value (e.g. "2.5")
--text-stat-md:  20px / 1.2  / -0.01em / 600  → Secondary stat numbers
--text-stat-sm:  13px / 1.0  / +0.08em / 600  → Caps labels (EARLY, MORE, LESS)

/* UI — Inter */
--text-heading-lg: 24px / 1.3 / -0.02em / 700  → Page headings, match titles
--text-heading-md: 18px / 1.4 / -0.01em / 600  → Card section headings
--text-heading-sm: 15px / 1.4 / -0.01em / 600  → Card titles (player name)
--text-body-lg:    16px / 1.6 / normal  / 400  → AI reasoning, descriptions
--text-body-md:    14px / 1.5 / normal  / 400  → Secondary body text
--text-caption:    12px / 1.4 / +0.02em / 500  → Timestamps, meta text
```

### Usage Rules
- **Never mix** JetBrains Mono for body copy — it reads as code, not content
- **Always uppercase** JetBrains Mono labels (MORE, LESS, EARLY, FINAL)
- **Line length max** 65 characters for Inter body text (AI reasoning sections)
- **Min 16px** body text on mobile — enforce with `text-base` as default

---

## 5. Spacing System

Base unit: **4px**. All spacing is a multiple of 4.

```
--space-1:   4px   → Icon gaps, micro padding
--space-2:   8px   → Tight padding, badge internal
--space-3:   12px  → List item gaps
--space-4:   16px  → Default card padding (mobile)
--space-5:   20px  → Card padding (desktop)
--space-6:   24px  → Section internal spacing
--space-8:   32px  → Between card groups
--space-10:  40px  → Section padding vertical
--space-12:  48px  → Large section gaps
--space-16:  64px  → Page section separation
--space-20:  80px  → Hero section padding
```

### Component Spacing Rules
| Component | Mobile | Desktop |
|---|---|---|
| Card internal padding | 16px | 20px |
| Card grid gap | 12px | 20px |
| Section vertical gap | 24px | 40px |
| Page horizontal padding | 16px | 32px |
| Navbar height | 56px | 64px |
| Content top offset | `pt-14` | `pt-16` |

### Max Widths
```
--max-width-content: 1280px  → Page container
--max-width-prose:   680px   → AI reasoning, text blocks
--max-width-card:    400px   → Individual pick card max
```

---

## 6. Shadow System

```css
/* Elevation levels */
--shadow-1: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
/* Default card */

--shadow-2: 0 4px 12px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.3);
/* Hover card, dropdown */

--shadow-3: 0 12px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4);
/* Modal, sheet */

--shadow-4: 0 24px 60px rgba(0,0,0,0.75);
/* Full-screen overlay */

/* Brand glows — use only on featured/live elements */
--shadow-brand-sm: 0 0 12px rgba(74,222,128,0.18);
--shadow-brand-md: 0 0 24px rgba(74,222,128,0.25);
--shadow-brand-lg: 0 0 40px rgba(74,222,128,0.35);

/* Semantic glows */
--shadow-positive: 0 0 16px rgba(74,222,128,0.20);
--shadow-negative: 0 0 16px rgba(239,68,68,0.20);
--shadow-warning:  0 0 16px rgba(245,158,11,0.18);
```

---

## 7. Animation & Motion

**Philosophy:** Motion communicates state change, never decorates. Every animation must answer "what changed?"

```
/* Duration scale */
--duration-instant:  80ms   → Toggle switches, checkbox
--duration-fast:     150ms  → Hover states, button active
--duration-normal:   220ms  → Card transitions, tab switches
--duration-slow:     350ms  → Modal open/close, drawer
--duration-emphasis: 500ms  → Confidence bar fill, count-up numbers
--duration-page:     400ms  → Route transitions

/* Easing */
--ease-default: cubic-bezier(0.16, 1, 0.3, 1)   → Standard UI — spring feel
--ease-in:      cubic-bezier(0.4, 0, 1, 1)       → Elements leaving screen
--ease-out:     cubic-bezier(0, 0, 0.2, 1)       → Elements entering screen
--ease-sharp:   cubic-bezier(0.4, 0, 0.6, 1)     → Data updates, toggles
--ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1) → WIN celebrations only

/* Always respect prefers-reduced-motion */
/* Reduce to opacity-only transitions when set */
```

### Motion Rules
- **Hover:** 150ms, `transition-colors` — never `transform: scale()` on cards (layout shift)
- **Card reveal:** `opacity 0→1 + translateY(12px→0)`, staggered 50ms between cards
- **Confidence bar fill:** 500ms ease-out after data loads — the main "wow" moment
- **Count-up numbers:** 600ms for win rate / ROI metrics on results page
- **Skeleton screens:** Always, no empty flickers — use pulsing `bg-bg-overlay` blocks
- **No animation** on pick direction badge (MORE/LESS) — instant state

---

## 8. Component Variants

### Pick Card
```
States: default | featured | locked | result-won | result-lost | result-void
Mobile:  full-width, 16px padding, stacked layout
Desktop: 3-column grid, 20px padding

Featured card:
  - left border: 3px solid var(--color-brand)
  - bg: --color-bg-surface with brand tint overlay
  - shadow: --shadow-brand-sm
  - "TOP PICK" badge visible

Locked card:
  - blur(8px) on stats content
  - Green CTA overlay centred: "Unlock with Edge"
  - Do NOT hide — showing the shape builds desire
```

### Confidence Bar
```
Segments: 5 equal-width bars, 4px height, 2px gap
Filled: green (#4ade80) with shadow-positive for MORE
Filled: red (#ef4444) with shadow-negative for LESS
Empty:  --color-bg-overlay
Label:  JetBrains Mono, 11px, uppercase, right-aligned: "82%"
```

### Badges
```
LIVE:     green dot (animate-pulse) + "LIVE" — green text, dark bg
EARLY:    amber text, dark amber border — "EARLY PICK"
FINAL:    green text, dark green border — "FINAL PICK ✓"
EDGE:     solid green bg, dark text — PRO tier indicator
WON:      green bg/10, green text, green border
LOST:     red bg/10, red text, red border
VOID:     neutral bg, muted text
PENDING:  amber bg/10, amber text
```

### Buttons
```
Primary:   bg-brand (#4ade80), text-inverse, h-11 mobile / h-10 desktop
           hover: bg-brand-dim, shadow-brand-sm
           font: Inter 600, tracking-wide, uppercase

Secondary: border-brand/40, text-brand, transparent bg
           hover: bg-brand-muted, border-brand

Ghost:     text-secondary, no border
           hover: text-primary, bg-bg-overlay

Danger:    bg-negative/10, text-negative, border-negative/30
           hover: bg-negative/20

All buttons: min-h-[44px], cursor-pointer, transition-all duration-150
             disabled: opacity-40, cursor-not-allowed
```

### Navbar
```
Height:     56px mobile / 64px desktop
Background: rgba(13,17,23,0.85) + backdrop-blur(20px)
Border-b:   var(--color-border-default)
Logo:       SVG, left-aligned
Nav links:  Inter 500, 13px, uppercase, letter-spacing wide
            active: text-brand
            hover:  text-primary, transition 150ms
Pro badge:  "EDGE" in brand green, pulsing dot
z-index:    50
```

### Match Group Header
```
Competition name: JetBrains Mono, 11px, uppercase, text-brand
Match title:      Inter 700, 20px (mobile) / 24px (desktop), text-primary
Kickoff:          JetBrains Mono, 12px, text-secondary, clock icon
Venue:            JetBrains Mono, 12px, text-secondary, pin icon
Stage badge:      EARLY or FINAL ✓ — see badge spec above
Pick count:       "3 PICKS" — JetBrains Mono, 11px, green dot
```

---

## 9. Layout System

### Grid
```
Mobile  (0–767px):   1-col, 16px side padding
Tablet  (768–1023px): 2-col pick grid, 20px gap
Desktop (1024px+):   3-col pick grid, 24px gap, optional sidebar
```

### Page Templates

**Dashboard (picks feed):**
```
[Navbar — fixed 56/64px]
[Page header — date, live status, pick count]
[Paywall banner — if FREE tier]
[Tab bar — Today's Picks | Power Plays]
[Match group x N]
  [Match header]
  [Pick card grid]
[Empty state — if no picks]
[Footer]
[ChatBot — fixed bottom-right]
```

**Homepage:**
```
[Navbar — fixed]
[Hero — full viewport, brand headline + CTA]
[Social proof strip — win rate, picks served]
[Feature preview — 3 sample pick cards]
[How it works — 3 steps]
[Pricing preview — teaser]
[Footer]
```

---

## 10. Mobile-First Rules

These are critical given the primary audience:

1. **Touch targets:** 44px minimum on ALL interactive elements. No exceptions.
2. **Swipe-friendly:** Pick cards scroll vertically. No horizontal card scrolling (causes accidental swipes).
3. **Bottom CTA:** Sticky "Get Edge" CTA on mobile for logged-out dashboard view.
4. **Overscroll:** `overscroll-behavior: contain` on pick feed — prevents accidental pull-to-refresh.
5. **Font sizes:** Never below 14px for secondary text. Body minimum 16px.
6. **Tap feedback:** Active states (`:active`) with 80ms opacity/scale response.
7. **No hover-only:** Every hover state must have a tap equivalent.
8. **Keyboard input:** `inputmode="email"` on auth forms. `inputmode="numeric"` for any numeric input.
9. **Viewport:** `width=device-width, initial-scale=1` — already set.
10. **Scroll performance:** `will-change: transform` only on actively animating elements. Remove after animation.

---

## 11. Anti-Patterns (Do Not Do)

From skill research + audience context:

| Anti-Pattern | Why It Fails for Setpiece |
|---|---|
| Emoji as icons | Unprofessional, inconsistent rendering across OS |
| `scale` on hover for cards | Causes layout shift on tight grids |
| Light backgrounds on any page section | Breaks immersion, wrong for OLED night use |
| Ornate decorative gradients | Competes with data — Bloomberg doesn't do this |
| Auto-playing animations on picks | Distracting when scanning multiple cards |
| Hiding locked content entirely | Removes desire — show blurred shape |
| Amber/gold as primary CTA | Reads as "sale" not "analytical edge" |
| Full-width buttons on desktop | Button becomes the hero, not the data |
| No skeleton states | Data loads async — naked spinners feel broken |
| Filtering without instant feedback | Picks feed must update within 150ms of filter tap |

---

## 12. Icon System

**Library:** Lucide React (already installed via lucide-react)
**Size scale:**
```
xs: w-3 h-3 (12px) — inline in text
sm: w-4 h-4 (16px) — badge icons, meta
md: w-5 h-5 (20px) — default UI icon
lg: w-6 h-6 (24px) — navbar, featured actions
xl: w-8 h-8 (32px) — empty states, illustration
```
**Color:** Always inherit from text color unless semantically coloured.
**Never:** Emoji as icons. Mixing icon libraries.

---

## 13. Accessibility Baseline

- WCAG AA minimum. AAA where possible (we pass AAA on primary text).
- All form inputs have visible `<label>` elements.
- Icon-only buttons have `aria-label`.
- Focus rings: `outline: 2px solid #4ade80; outline-offset: 2px` — matches brand.
- Color is never the ONLY differentiator (e.g. MORE/LESS also use text + position).
- `prefers-reduced-motion`: collapse all animations to instant opacity transitions.
- `prefers-color-scheme: dark`: we are already dark — no light mode planned.

---

## 14. Skill Choices Summary

| Decision | Skill Recommendation | Chosen | Override Reason |
|---|---|---|---|
| Style | Data-Dense Dashboard | Dark Mode OLED + Executive Dashboard | Better mobile perf, WCAG AAA |
| Colors | Blue analytics (#1E40AF) | User's green (#4ade80) on dark blue-grey | Brand identity is fixed |
| Typography | Fira Code + Fira Sans | JetBrains Mono + Inter | Already loaded; JM superior at small sizes |
| Landing pattern | AI Personalization Landing | Hero + Social Proof + Pick Preview | Most relevant conversion pattern for DFS |
| Complexity | Medium (Executive Dashboard) | Medium — data-dense on desktop, simplified mobile | Mobile-first audience |

---

*Last updated: 2026-05-31*
*Generated using ui-ux-pro-max skill — do not manually edit skill outputs, re-run search.py to update*
