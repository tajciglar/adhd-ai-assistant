# UI/UX Design System

## Brand

**Harbor** — "A calm space in the chaos."

An AI parenting assistant for ADHD families. The design prioritizes calm, clarity, and warmth.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `harbor-primary` | `#7040CA` | Headings, primary buttons, brand elements |
| `harbor-bg` | `#FAF7FC` | Page background (light lavender) |
| `harbor-accent` | `#9B59B6` | Active states, highlights, section headers |
| `harbor-text` | `#1A1A1A` | Body text |
| `harbor-error` | `#C97B63` | Error states, validation messages |
| `harbor-primary-light` | `#9B59B6` | Button hover states |
| `harbor-accent-light` | `#C39BD3` | Light accent variants |

Defined in `apps/web/src/index.css` using Tailwind v4 `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-harbor-primary: #7040ca;
  --color-harbor-bg: #FAF7FC;
  --color-harbor-accent: #9B59B6;
  --color-harbor-text: #1a1a1a;
  --color-harbor-error: #C97B63;
  --color-harbor-primary-light: #9B59B6;
  --color-harbor-accent-light: #C39BD3;
  --font-family-sans: "Inter", system-ui, sans-serif;
}
```

Use as Tailwind classes: `bg-harbor-primary`, `text-harbor-accent`, `border-harbor-primary/15`, etc.

This palette matches the Harbor Quiz app for brand consistency across products.

## Typography

- **Font:** Inter (loaded via Google Fonts in `index.html`)
- **Headings:** `text-2xl font-semibold text-harbor-text` or `text-harbor-primary`
- **Labels / secondary:** `text-harbor-text/50` (50% opacity)
- **Admin section headers:** `text-sm font-semibold text-harbor-accent uppercase tracking-wider`

## Animation Guidelines (Framer Motion)

All animations use smooth easing — **no spring or bounce**.

### Chat Messages
- Fade in + slight vertical slide
- Duration: 0.3s
- Ease: `[0.4, 0, 0.2, 1]`

### Page Transitions
- Slide 24px + fade
- Duration: 0.4s
- Ease: `[0.4, 0, 0.2, 1]`

### AnimatePresence
- Always use `mode="wait"` — no overlapping exit/enter animations

## Component Patterns

### Selection Cards
```
Unselected: border-harbor-primary/15 hover:border-harbor-primary/30 bg-white
Selected:   border-harbor-accent bg-harbor-accent/10
```

### Button (`ui/Button.tsx`)
```
Primary:  bg-harbor-primary text-white hover:bg-harbor-primary-light rounded-xl px-8 py-3
Disabled: opacity-50 cursor-not-allowed
```

### Cards
```
bg-white rounded-2xl shadow-sm p-6
```

### Error Display
```
bg-harbor-error/10 text-harbor-error rounded-lg p-3
```

## Key Pages

### Auth Page
- Harbor branding: "Harbor" heading + tagline
- Toggle between Sign In / Sign Up
- Form card: `bg-white rounded-2xl shadow-sm p-8`

### Chat Interface
- Conversation sidebar (mobile: slide-out drawer)
- Message bubbles: user (right, accent bg) vs assistant (left, white bg)
- Input bar fixed at bottom with send button

### Admin Dashboard
Three sections accessible via sidebar:
1. **Knowledge Base** — CRUD entries, bulk import, test RAG retrieval
2. **Report Templates** — Archetype-specific template management
3. **Quiz Analytics** — Funnel metrics, archetype distribution, daily trends
