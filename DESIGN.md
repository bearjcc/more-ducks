# Design

UI/UX target for More Ducks. **Current state + gaps:** [`HANDOFF.md`](HANDOFF.md). This doc is the north star.

## Color

### Strategy
**Committed.** The pond-green primary carries 30-40% of visual surface (sky gradient, headers, key UI). The duck-gold accent handles all reward feedback, CTAs, and purchase affordance. This is a game, not a dashboard — color is part of the dopamine loop.

### Scene sentence
A player reclined on a park bench at golden hour, phone in one hand, thumb lazily tapping while ducks paddle across a sun-dappled pond. Warm, bright, outdoor — light theme with sky-blue gradients.

### Palette (OKLCH, base era)

```css
:root {
  /* Sky / background gradient — shifts per era */
  --sky-1: oklch(0.84 0.06 195);     /* Clear pond-blue */
  --sky-2: oklch(0.88 0.05 150);     /* Green-horizon shimmer */

  /* Primary — pond green (seed hue 108-110°) */
  --primary: oklch(0.55 0.14 108);   /* Rich pond-water green */
  --primary-light: oklch(0.78 0.08 108);
  --primary-dark: oklch(0.38 0.10 108);

  /* Accent — duck gold / afternoon sun */
  --accent: oklch(0.78 0.16 80);     /* Warm amber-gold */
  --accent-ink: oklch(0.25 0.04 80); /* Dark amber for text on accent */

  /* Surfaces */
  --bg: oklch(1.000 0.000 0);        /* Pure white panels */
  --surface: oklch(0.97 0.005 200);  /* Faint blue-cast cards */
  --surface-raised: oklch(0.99 0.003 200);

  /* Text */
  --ink: oklch(0.20 0.02 230);       /* Deep teal-navy body text */
  --muted: oklch(0.50 0.02 220);     /* Soft blue-gray secondary */

  /* Semantic */
  --good: oklch(0.62 0.16 148);      /* Fresh green — affordable, success */
  --warn: oklch(0.76 0.14 70);       /* Warm amber — pond-warn */
  --error: oklch(0.58 0.18 25);      /* Soft red — pond-low */
}
```

### Era progression
The sky gradient shifts across 6 acts from cheerful pond-blue through warm amber, uncanny purple, to cosmic gold — the screen tells the satirical story. Era overrides replace `--sky-1`, `--sky-2`, and may shift `--accent`. Panel and ink colors stay stable for readability.

## Typography

### Font stack
- **Display / numbers**: Fredoka (variable weight, rounded, playful). Used for counters, hero stats, headings. Carries the "silly" personality.
- **Body / labels**: system-ui stack (already in use). Clean, fast, familiar. No need to fight the OS.

### Scale (fixed rem, not fluid)
- Hero stat: 2.5rem (bold 700)
- Section heading: 1.1rem (semibold 600)
- Card title: 0.95rem (bold 700)
- Body / blurb: 0.82rem (regular 400)
- Label / meta: 0.7rem (semibold 600, uppercase, tracked)
- All counters: `font-variant-numeric: tabular-nums`

### Hierarchy
One family (Fredoka) for display + numbers. System-ui for everything else. Contrast axis: rounded display vs clean system sans.

## Layout

### Portrait-first (primary mode — phones)
Mobile chat app in **portrait**, continuing the QLM thread + composer pattern: HUD overlays scrollable chat → fixed bottom composer (🦆 feed, input, **Send**, **Auto**). Six-tab bottom dock; tapping a tab raises a **Tap Titans 2–style bottom sheet** (`data-panel-open`) over the chat. Composer lifts with the sheet like a keyboard opening.

Acts 0–1 (`data-act-tier="chat"`) stay visually close to QLM: neutral chat surface, bubble thread, pill composer — pond chrome emerges as eras progress.

**Panels closed:** looks like a normal LLM chat app (thread fills the screen; composer + dock in the thumb zone).

**Panels open:** sheet occupies ~50dvh; chat scroll padding adjusts so the last message stays visible above composer + sheet.

**Stats** (dashboard: answers/sec, demand vs supply, hype, ducks, ducks/sec, feed opex) live in the **Stats** dock tab only — never in the chat stage.

**PWA:** `manifest.webmanifest` locks **portrait** when installed.

### Phone landscape (fallback)
Not the design centre. Default **two-column** chat + side panel still works; a gentle rotate hint may appear on short landscape viewports. No separate landscape-first polish pass.

### Laptop / wide
Two-column layout (chat column + management panel). Same dock tabs; sheet behaviour on narrow wide windows optional. This is the comfortable desktop play mode.

### Spacing
- Base gap: `clamp(8px, 2vw, 16px)` (existing, works well)
- Card padding: 12px 14px
- Section spacing: 1.5x base gap
- Border radius: 14px cards, 18px panels, 50% (pill) for buttons/badges

## Components

### Cards (producers, upgrades, hype)
- Horizontal layout: emoji icon | title + blurb | buy button
- Affordable state: green tint border + subtle glow
- Owned/maxed state: checkmark overlay, muted
- Buy button: accent-gold fill, dark text, satisfying press animation (scale 0.95 + haptic)
- Touch target: full card row tappable, minimum 48px height

### Counters (HUD)
- Large tabular numbers with Fredoka display font
- Pulse animation on increment
- Icon + value + label vertical stack
- Coin counter gets a subtle gold shimmer on earn

### Dock / tab bar
- Bottom-anchored, full-width, with centered raised quack button
- Active tab: accent-gold fill with icon + label
- Inactive: translucent with icon only (portrait phone) or icon + label (wide / laptop)
- Safe area padding for notched phones

### Feed duck (composer)
- Small 🦆 button left of the input — tap to feed when hungry; hold to ponder (post-prestige)
- Pondering: pulsing glow on feed button; thoughts stream into thread before answer
- No separate stage quack FAB in portrait; the chat composer is the only quack target

### Modals
- Centered card with backdrop blur
- Era-themed gradient header strip
- Big emoji, bold title, body text, single CTA button
- Enter: scale up from 0.95 + fade. Exit: scale down + fade.

## Motion

### Energy level
**Medium-high.** This is an idle game — motion is a reward mechanism, not decoration. Every purchase, milestone, and number tick should feel satisfying. But motion never blocks interaction or hides content.

### Principles
- Tap feedback: immediate (< 60ms). Scale press, float gain, counter pulse.
- Purchases: card briefly flashes green, counter bumps, satisfying scale pop.
- Milestones: toast slides up, optional confetti burst on era transitions.
- Idle production: gentle counter pulse every batch tick. Ambient, not distracting.
- Era transitions: 1s sky gradient cross-fade (already exists, keep it).
- Reduced motion: all animations collapse to instant state changes. No gating content on animation.

### Curves
- Tap feedback: ease-out (fast) — `cubic-bezier(0.16, 1, 0.3, 1)` (expo out)
- UI transitions: ease-out — 200-300ms
- Ambient: ease-in-out — 800ms+
- No bounce, no elastic, no spring physics (too playful for the satirical tone)

## Responsive

### Breakpoints
- **Portrait phone (primary):** `max-aspect-ratio: 1/1` or `max-width: 560px` — chat stack + bottom dock + sheet panels
- **Phone landscape:** not primary; wide two-column fallback + rotate hint on `(orientation: landscape) and (max-height: 520px)`
- **Laptop / desktop:** default two-column grid; max-width container optional on very wide screens

### Touch
- Minimum 44px touch targets (existing, maintain)
- `touch-action: manipulation` on all interactive elements
- No hover-only affordances
- Pointer capture for hold-to-ponder

## Z-index scale
```
--z-float:     60   /* rising +N gains */
--z-modal:     50   /* modal overlay + dialog */
--z-toast:     40   /* toast notifications */
--z-dock:      30   /* bottom dock bar */
--z-toolbar:   10   /* sticky panel toolbar */
--z-base:       0   /* default layer */
```

## Implementation notes

### Portrait IA (shipped)

```
[HUD overlay: gear | ducks | coins | night]  ← same surface as chat, gradient fade
[Stage: chat thread scrolls under HUD]
[Bottom tray: feed | input | Send | Auto]
[Dock tabs: Stats | Flock | Ads | Upgrades | Research | More]
[Panel sheet when tab open — slides up over dock]
```

- **More tab:** Answerdex, Duckdex, regions, vanity (Intelligence Score + Quackmarks), prestige, pond log, settings.
- **Gear** opens settings inside More (or direct scroll — keep one path).
- **Auto** is right of **Send**; Auto **sends** a random question (never fill-only).
- **HUD:** read-only counters; no water meter. Market hero stats live in Stats tab.
- **Welcome-back:** modal with Collect CTA (Egg Inc pattern).
- **Header contrast:** HUD must feel layered on the chat surface (like Tap Titans 2 + ChatGPT), not a separate chrome bar — see Milestone 3 in [`TODO.md`](TODO.md).
- **Satirical copy:** upgrade blurbs and Quackmark labels may sound corporate; **duck chat replies must not** (see [`HANDOFF.md`](HANDOFF.md) quack voice rules).
