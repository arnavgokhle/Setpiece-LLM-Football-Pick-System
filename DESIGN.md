# Setpiece — Current Design Reference

> Redesigned 2026-07-04: "tactics board meets quant terminal" system.
> This file is the source of truth for tokens; it supersedes the palettes in `design-system/MASTER.md` and `CLAUDE.md`.

## Brand

- **Product name:** Setpiece (also "Setpiece Picks")
- **Tagline:** "The AI edge for football DFS"
- **Audience:** Football DFS players (India primary, US soon)
- **Tone:** Confident, data-driven, sharp — not flashy
- **Concept:** a manager's tactics board crossed with a financial terminal. Chalk lines on a night pitch, not neon SaaS.

---

## Color Palette (tactics-board)

| Token | Hex | Usage |
|---|---|---|
| `board` | `#0b0e0c` | Page background (pitch black-green) |
| `board-deep` | `#070a08` | Navbar + footer background |
| `panel` | `#121714` | Card background |
| `panel-high` | `#171d18` | Raised / open surfaces |
| borders | `rgba(255,255,255,0.06–0.09)` | All hairlines |
| `grass` | `#55c878` | Single accent: CTAs, MORE, wins, live |
| `grass-deep` | `#46b167` | Accent hover |
| `chalk` | `#f2f5f0` | Primary text |
| `chalk-dim` | `#a7b3a9` | Secondary text |
| `#93a196` | | Tertiary text |
| `chalk-faint` | `#76837a` | Meta text (minimum for any text — AA on board bg) |
| `chalk-ghost` | `#4d5850` | Decorative only, never text |
| `loss` | `#e0574f` | LESS direction, losses |
| `early` | `#d9a13f` | Early picks, pending |

**Dark theme only. One accent (grass). The old sky-blue secondary accent is retired.**

---

## Typography

- **Display:** Archivo (600/700/800) — headings, player names, match names, big prices. Tight tracking (-0.02 to -0.03em). CSS: `font-display` / `var(--font-display)`.
- **Body / UI:** Geist — all body copy, buttons, nav links. `var(--font-sans)`.
- **Data:** Spline Sans Mono — numbers, lines, confidence, terminal rows, small meta. Tabular numerals enforced globally on `.font-mono`. `var(--font-mono)`.
- Fonts load via `next/font/google` in `src/app/layout.tsx` (no Google Fonts `<link>`).
- Uppercase mono labels are rationed: data labels only, never section eyebrows everywhere.

---

## Shape & Spacing

- Cards: `rounded-lg` (8px). Inner chips/buttons: `rounded-[4px]`. Badges/pills: `rounded-full` (used sparingly).
- Max width `max-w-[1280px]`, page padding `px-5 md:px-10 lg:px-16`.
- Marketing sections: `py-20 md:py-24`, separated by `border-t border-white/[0.06]`.
- Touch targets 44px minimum.

---

## Signature element

The hero's chalk set-piece diagram (`SetpieceDiagram` in `src/app/page.tsx`): faint pitch markings + a grass-green corner-kick trajectory that draws itself on load (`.chalk-draw`, reduced-motion safe) landing at an X between defender rings. Use this motif nowhere else; it is the one loud thing.

---

## Component rules

- **Buttons:** primary = solid `grass` bg, `#08110b` text, sans semibold, hover `grass-deep` + slight lift, `active:scale-[0.99]`. Secondary = hairline `border-white/[0.12]` outline.
- **Pick cards:** `#121714` bg, `border-white/[0.08]`, hover border brighten. Featured: `border-grass/30` + solid 2px top bar (no glows, no gradients).
- **Direction chips:** MORE = grass tint bg + grass text; LESS = loss tint + loss text.
- **Live indicator:** a single small pulsing dot is allowed only where something is genuinely live (terminal header, dashboard header). No `animate-ping` anywhere.
- **No:** glow shadows, radial blob backgrounds, dot grids, side-stripe (`border-left`) accents, gradient text, em-dashes in UI copy.

---

## Motion

- Entrances: 0.7s fade-up on `cubic-bezier(0.16,1,0.3,1)`, staggered ~80ms, `whileInView` once.
- Hero diagram: 1.6s stroke draw, 0.5s delay.
- All motion collapses under `prefers-reduced-motion`.

---

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing (hero + value rows + pricing preview) |
| `/dashboard` | Today's picks + Scout chatbot |
| `/results` | Track record |
| `/pricing` | WC free offer + Edge waitlist |
| `/auth/login`, `/auth/signup` | Auth |
| `/tracker` | Personal tracker |
| `/admin` | Admin tools |
