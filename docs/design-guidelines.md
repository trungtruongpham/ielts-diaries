# IELTS Diaries — Design Guidelines

## Style Direction

**Modern Vibrant** — energetic, motivating, slightly playful. Feels like a premium study companion, not a generic dashboard. Colorful accents create optimism around studying.

## Brand

- **App Name**: IELTS Diaries
- **Tagline**: "Track your IELTS journey. Reach your goal."
- **Persona**: A motivated IELTS test-taker who wants clarity, progress visibility, and motivation.

## Color Palette

```css
/* Primary — Blue (vibrant, energetic) */
--color-primary-50:  #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;   /* Main brand blue */
--color-primary-600: #2563eb;   /* Hover state */
--color-primary-700: #1d4ed8;

/* Accents — for score visualization */
--color-success:  #22c55e;   /* Band 7.0+ (Listening/Reading lines) */
--color-warning:  #f59e0b;   /* Band 5.5-6.5 (Writing line) */
--color-danger:   #ef4444;   /* Band <5.0 (Speaking line, low scores) */
--color-purple:   #8b5cf6;   /* Overall band line on chart */

/* Neutrals */
--color-bg:         #f8fafc;  /* Page background (light slate) */
--color-surface:    #ffffff;  /* Card surface */
--color-border:     #e2e8f0;  /* Borders */
--color-text:       #0f172a;  /* Primary text */
--color-muted:      #64748b;  /* Secondary text */
```

## Typography

```css
/* Font: Plus Jakarta Sans (Google Fonts) — modern, friendly, slightly rounded */
font-family: 'Plus Jakarta Sans', sans-serif;

/* Scale */
--text-xs:   0.75rem;   /* 12px — labels */
--text-sm:   0.875rem;  /* 14px — body small */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — section titles */
--text-xl:   1.25rem;   /* 20px — card headings */
--text-2xl:  1.5rem;    /* 24px — page headings */
--text-4xl:  2.25rem;   /* 36px — hero heading */
--text-6xl:  3.75rem;   /* 60px — band score display */

/* Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold) */
```

## Spacing & Layout

```css
/* 8px base grid */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */

/* Container max-widths */
--container-sm: 640px;   /* Calculator, auth forms */
--container-md: 768px;   /* Content pages */
--container-lg: 1024px;  /* Dashboard */
```

## Component Styles

### Cards
- Background: `#ffffff`
- Border: `1px solid #e2e8f0`
- Border radius: `16px` (rounded-2xl)
- Box shadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`
- Hover: subtle lift `translateY(-2px)` + slightly stronger shadow

### Buttons
- **Primary**: Blue bg (#3b82f6), white text, rounded-xl, hover: #2563eb
- **Secondary**: White bg, blue border, blue text, hover: blue-50 bg
- **Destructive**: Red bg for delete actions
- Border radius: `12px` (rounded-xl)
- Padding: `10px 20px`
- Font weight: 600

### Band Score Display (large)
```css
/* Big number, colored by band level */
font-size: 4rem;
font-weight: 700;
/* > 7.0 → color: #22c55e (green) */
/* 5.5-6.5 → color: #f59e0b (amber) */
/* < 5.5 → color: #ef4444 (red) */

/* Subtle colored glow bg behind the number */
background: rgba(colorByBand, 0.08);
border-radius: 16px;
padding: 24px;
```

### Navigation / Header
- Background: `#ffffff` with `border-bottom: 1px solid #e2e8f0`
- Sticky at top
- Logo left, Nav center (desktop), Auth right
- Mobile: hamburger menu

### Chart (Recharts)
- Background: white card
- Grid: `#f1f5f9` (very subtle)
- Colors: Blue (Listening), Green (Reading), Amber (Writing), Red (Speaking), Purple (Overall)
- Goal line: dashed, gray (#94a3b8)
- Dots visible on data points
- Smooth `type="monotone"` curves

## Micro-Animations

```css
/* Button hover */
transition: all 0.2s ease;

/* Card hover lift */
transition: transform 0.2s ease, box-shadow 0.2s ease;

/* Band score reveal (on calculation) */
@keyframes scoreReveal {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
animation: scoreReveal 0.3s ease;

/* Page entry */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
animation: fadeUp 0.4s ease;
```

## Responsive Breakpoints

- **Mobile**: < 640px — single column, stacked layout
- **Tablet**: 640px – 1024px — 2-column grid
- **Desktop**: > 1024px — full layout, sidebar nav on dashboard

## Score Bar / Progress Indicator

Used in goal progress card:
- Full-width horizontal bar, rounded
- Background: `#e2e8f0`
- Fill: colored by proximity to goal
  - Reached: `#22c55e`
  - Close (≥80%): `#f59e0b`
  - Far (<80%): `#ef4444`
- Animated fill on mount

## Landing Page Hero

- Headline: `font-size: 3.75rem`, bold, dark text
- Subheadline: `font-size: 1.25rem`, muted
- CTA buttons: Primary + Outline pair
- Background: subtle blue gradient blob (`radial-gradient`) in top-right corner
- Feature cards below: 3-column grid with icons

## Logo

- Format: text mark + icon
- Icon: stylized open book with a chart line rising — represents "diary" + "progress"
- Color: Blue (#3b82f6)
- Font for wordmark: Plus Jakarta Sans Bold
