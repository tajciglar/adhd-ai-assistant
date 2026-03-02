# UI/UX Design System

## Brand

**Harbor** — "A calm space in the chaos."

An ADHD AI assistant for parents. The design prioritizes calm, focus, and warmth — no visual overwhelm.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `harbor-primary` | `#4F6D7A` | Headings, primary buttons, brand elements |
| `harbor-bg` | `#F7F5F2` | Page background (warm off-white) |
| `harbor-accent` | `#6FB1A0` | Progress bar, selected states, section headers |
| `harbor-text` | `#2F3E46` | Body text |
| `harbor-error` | `#C97B63` | Error states, validation messages |
| `harbor-primary-light` | `#6B8A97` | Button hover states |
| `harbor-accent-light` | `#8FC4B5` | Light accent variants |

Colors are defined in `apps/web/src/index.css` using Tailwind v4's `@theme` block:

```css
@import "tailwindcss";

@theme {
  --color-harbor-primary: #4F6D7A;
  --color-harbor-bg: #F7F5F2;
  --color-harbor-accent: #6FB1A0;
  --color-harbor-text: #2F3E46;
  --color-harbor-error: #C97B63;
  --color-harbor-primary-light: #6B8A97;
  --color-harbor-accent-light: #8FC4B5;
  --font-family-sans: "Inter", system-ui, sans-serif;
}
```

Use as Tailwind classes: `bg-harbor-primary`, `text-harbor-accent`, etc.

## Typography

- **Font:** Inter (loaded via Google Fonts in `index.html`)
- **Question titles:** `text-2xl font-semibold text-harbor-text`
- **Subtitles / labels:** `text-harbor-text/50` (50% opacity)
- **Snapshot section headers:** `text-sm font-semibold text-harbor-accent uppercase tracking-wider`

## Animation Guidelines (Framer Motion)

All animations use smooth easing — **no spring or bounce**.

### Page Transitions
- Slide 24px horizontally + fade
- Duration: 0.4s
- Ease: `[0.4, 0, 0.2, 1]`
- Direction-aware: slides right on forward, left on back

```tsx
// AnimationWrapper.tsx
<motion.div
  key={step}
  initial={{ opacity: 0, x: direction * 24 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: direction * -24 }}
  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
/>
```

### Family Snapshot Cards
- Staggered fade-in: `0.1s` delay per card
- Vertical slide: `y: 16px` to `y: 0`
- Duration: 0.5s

### AnimatePresence
- Always use `mode="wait"` — no overlapping exit/enter animations

## Component Patterns

### Question Types

| Component | Used by steps | Behavior |
|-----------|---------------|----------|
| `SingleSelect` | 1, 2, 3, 6, 7, 8 | Card-style radio buttons, click auto-advances |
| `MultiSelect` | 9, 11, 12, 13, 14 | Toggle cards, "None" deselects others |
| `LimitedSelect` | 10 | Multi-select capped at N, counter shown, excess disabled |
| `TextInput` | 4 | Single-line input with placeholder |
| `NumberInput` | 5 | Number with +/- stepper buttons |
| `TextArea` | 15, 16 | Multi-line with 500-char count |

### Selection Card Styles

```
Unselected: border-harbor-primary/15 hover:border-harbor-primary/30 bg-white
Selected:   border-harbor-accent bg-harbor-accent/10
```

- SingleSelect checkbox: `rounded-full` (radio-style ring)
- MultiSelect checkbox: `rounded-md` with white checkmark SVG on accent background

### Button (`ui/Button.tsx`)

```
Primary:  bg-harbor-primary text-white hover:bg-harbor-primary-light rounded-xl px-8 py-3
Disabled: opacity-50 cursor-not-allowed
```

### Progress Bar

- Fixed at top of page
- `harbor-accent` color
- Width: `(currentStep / totalSteps) * 100%`
- Animated with CSS transition

### Save Indicator

- Top-right corner
- States: "Saving..." (text-harbor-text/40) → "Progress saved" (text-harbor-accent) → fades out after 2s
- Error: "Could not save" (text-harbor-error)

### Micro-Copy

Encouraging italic text in `text-harbor-accent` at key transitions:

| Step | Text |
|------|------|
| 4 | "Now let's learn about your child." |
| 9 | "This helps us understand your family's support system." |
| 11 | "Understanding the daily picture helps us help you." |
| 15 | "Almost there. These last two are the most important." |

## Key Pages

### Auth Page
- Harbor branding: "Harbor" heading + tagline
- Toggle between Sign in / Sign up
- Form card: `bg-white rounded-2xl shadow-sm p-8`
- Error display: `bg-harbor-error/10 text-harbor-error rounded-lg`

### Onboarding Flow
- One question at a time, centered (`max-w-xl`)
- Progress bar at top, save indicator top-right
- Back (ghost) / Continue (primary) navigation at bottom

### Family Snapshot
- Full summary after all 16 steps
- Grouped into cards: About You, About {childName}, Your Household, Current Challenges, In Your Words
- Card design: `bg-white rounded-2xl shadow-sm p-6`
- Closing CTA: "Start using Harbor" button
