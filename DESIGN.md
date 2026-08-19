# SCMS Frontend Design Guide

This guide documents the design system, component architecture, and UI guidelines for `SCMS.WebApp`. Use it when creating or updating frontend features so screens maintain consistency, accessibility, and visual hierarchy.

## Design Direction & Core Philosophy: Warm Pearl & Frosted Ambient

SCMS uses a **Warm Pearl & Frosted Ambient** aesthetic built with **Radix UI Primitives** and **Shadcn UI** design standards. Inspired by modern health applications (Apple Health, Linear, modern clinical systems), it balances calm organic warmth with clinical precision.

### Key Tenets:
- **Warm Organic Atmosphere**: Replacing harsh pure grays and dark purples with warm pearl/sand surfaces (`#FAF9F6`, `#F7F6F2`), soft apricot/peach ambient lighting, and frosted glass cards.
- **Operational Clarity & High Information Density**: Clean, scan-friendly data tables, dense clinical records, and structured medical forms.
- **Accessibility & Zero-Overlap Layouts**: Strict bounding boxes, `shrink-0` on all icons, dedicated non-overlapping input padding, and high-contrast accessible focus rings.
- **Bilingual & Multi-script Typography**: Relaxed line-heights (`leading-relaxed` / 1.6–1.8) for Myanmar script (Padauk / Noto Sans Myanmar) to eliminate diacritic clipping and text collisions.

---

## Frontend Stack & Architecture

- **Framework**: React 18 with Vite.
- **Routing**: `react-router-dom` (v6).
- **UI Architecture**: **Shadcn UI** component patterns built on top of **Radix UI Primitives** and **Tailwind CSS**.
- **Iconography**: `@radix-ui/react-icons` (with `lucide-react` as secondary support). All icons inside input fields or button groups must include `shrink-0` and explicit layout boundaries.
- **Utility Functions**: `cn()` helper powered by `clsx` and `tailwind-merge` (`src/lib/utils.js`).
- **Popups & Feedback**: Shared dialog helpers (`src/services/dialogs.js` / SweetAlert2 styled to match the warm frosted theme).

---

## Color System & Shadcn Tokens

The app uses standard Shadcn HSL variables tailored to the **Warm Pearl & Frosted Ambient** palette for both Light and Dark modes.

### CSS Variables (`src/styles.css`)

```css
:root {
  /* Warm Pearl Base */
  --background: 40 20% 98%;         /* #FAF9F6 Warm Pearl / Off-white */
  --foreground: 240 6% 10%;         /* #18181B Deep Obsidian Graphite */
  
  /* Frosted Glass Surfaces */
  --card: 0 0% 100%;                /* #FFFFFF Crisp Snow White */
  --card-foreground: 240 6% 10%;    /* #18181B */
  --card-glass: rgba(255, 255, 255, 0.85);
  
  --popover: 0 0% 100%;
  --popover-foreground: 240 6% 10%;
  
  /* Primary Action (Deep Obsidian) */
  --primary: 240 6% 10%;            /* #18181B Deep Obsidian */
  --primary-foreground: 0 0% 98%;   /* #FAFAFA Pure White */
  
  /* Secondary & Muted */
  --secondary: 40 10% 94%;          /* #F5F4F0 Warm Sand Secondary */
  --secondary-foreground: 240 6% 10%;
  
  --muted: 40 10% 94%;
  --muted-foreground: 240 4% 46%;   /* #71717A Zinc Muted Text */
  
  --accent: 38 92% 50%;             /* Warm Amber/Apricot Accent #F59E0B */
  --accent-foreground: 240 6% 10%;
  
  /* Status Semantics */
  --destructive: 0 84.2% 60.2%;     /* #E11D48 Rose */
  --destructive-foreground: 0 0% 98%;
  --success: 160 84% 39%;           /* #059669 Emerald */
  --warning: 38 92% 50%;            /* #D97706 Amber */
  
  /* Borders & Focus Ring */
  --border: 40 10% 90%;             /* #E7E5E0 Warm Neutral Border */
  --input: 40 10% 90%;
  --ring: 240 6% 10%;               /* #18181B Focus Ring */
  --radius: 1rem;                   /* 16px Smooth Corner Radius */
}

.dark {
  /* Dark Warm Obsidian Base */
  --background: 240 5% 7%;          /* #121214 Deep Warm Obsidian */
  --foreground: 0 0% 98%;           /* #FAFAFA Pure White */
  
  --card: 240 5% 10%;               /* #18181B Dark Charcoal Card */
  --card-foreground: 0 0% 98%;
  --card-glass: rgba(24, 24, 27, 0.82);
  
  --popover: 240 5% 10%;
  --popover-foreground: 0 0% 98%;
  
  /* Primary Action (Crisp White in Dark Mode) */
  --primary: 0 0% 98%;              /* #FAFAFA */
  --primary-foreground: 240 6% 10%; /* #18181B */
  
  --secondary: 240 4% 16%;          /* #27272A */
  --secondary-foreground: 0 0% 98%;
  
  --muted: 240 4% 16%;
  --muted-foreground: 240 5% 65%;   /* #A1A1AA */
  
  --accent: 38 92% 50%;
  --accent-foreground: 0 0% 98%;
  
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  
  --border: 240 4% 18%;             /* #2E2E32 */
  --input: 240 4% 18%;
  --ring: 0 0% 98%;
}
```

### Ambient Glow Layers
- **Warm Glow Orbs**: Subtle background radial gradients using warm peach (`#FDBA74`, `rgba(253, 186, 116, 0.25)`) and soft lavender (`rgba(192, 132, 252, 0.15)`) with `blur-3xl`.

---

## Typography & Script Rules

### Font Stacks

```css
/* Default Latin */
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Manrope", system-ui, sans-serif;

/* Myanmar Locale (.lang-mm) */
font-family: "SF Pro Text", "Inter", "Padauk", "Noto Sans Myanmar", system-ui, sans-serif;
```

### Hierarchy & Line-Height

- **Page Titles**: `24px` to `28px`, font weight `700` (`tracking-tight text-foreground`).
- **Section & Modal Titles**: `18px` to `22px`, font weight `600` or `700`.
- **Card Titles**: `15px` to `16px`, font weight `600`.
- **Form Labels**: `12px` to `13px`, font weight `600` or `700`.
- **Body & Data Table**: `13px` to `14px`, regular / medium.
- **Helper & Meta Text**: `11px` to `12px`, muted foreground.

### Myanmar Script Rules
- **Mandatory Leading**: Always use `leading-relaxed` (`line-height: 1.6` to `1.8`) for text blocks containing Myanmar script.
- Never use `leading-none` or cramped line-heights with Myanmar text to prevent tone marks (*ကင်းစီး*, *လုံးကြီးတင်*, *ချောင်းငင်*, *အောက်ကမြစ်*) from clipping.

---

## Shadcn UI Component Standards

### 1. Button (`src/components/ui/button.jsx`)

Variants:
- `default`: Deep obsidian in light mode, crisp white in dark mode (`bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-sm`).
- `outline`: Bordered surface (`border border-input bg-background/80 hover:bg-secondary text-foreground rounded-2xl`).
- `secondary`: Warm sand soft button (`bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-2xl`).
- `ghost`: Borderless hover item (`hover:bg-secondary text-foreground rounded-xl`).
- `link`: Text link (`text-foreground underline-offset-4 hover:underline`).

### 2. Input (`src/components/ui/input.jsx`)

Standardized input control with guaranteed non-overlapping icon adornments:
- Height: `h-11 min-h-11`.
- Base: `flex w-full rounded-2xl border border-input bg-background/90 px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all`.
- Start Icon: Dedicated `pl-11` on input, with `<Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0 text-muted-foreground pointer-events-none" />`.
- End Icon / Toggle: Dedicated `pr-11` on input, with `<button className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" />`.

### 3. Card (`src/components/ui/card.jsx`)

Frosted glass and elevated card surfaces:
- `Card`: `rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl text-card-foreground shadow-sm`.
- `CardHeader`: `flex flex-col space-y-1.5 p-6 sm:p-8`.
- `CardTitle`: `text-2xl font-bold tracking-tight text-foreground`.
- `CardDescription`: `text-xs text-muted-foreground leading-relaxed`.
- `CardContent`: `p-6 sm:p-8 pt-0`.
- `CardFooter`: `flex items-center p-6 sm:p-8 pt-0`.

### 4. Badge (`src/components/ui/badge.jsx`)

Compact status indicator:
- `default`: `bg-primary text-primary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- `secondary`: `bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- `outline`: `text-foreground border border-input rounded-full px-2.5 py-0.5 text-xs font-semibold`.
- `success`: `bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 rounded-full px-2.5 py-0.5 text-xs font-semibold`.

---

## Global System Application

All views across the app (Admin Dashboard, Doctor Queue, Consultation, Patient Portal, AI Assistant, Reports, Medicines, Prescriptions, Appointments) must inherit these unified Warm Pearl & Frosted Ambient tokens:
- **Backgrounds**: Soft `#FAF9F6` with subtle warm ambient blurs in light mode, `#121214` in dark mode.
- **Navbars & Drawers**: Frosted glass (`bg-background/85 backdrop-blur-2xl border-b border-border/70`).
- **Cards & Modals**: Rounded-3xl / Rounded-2xl white frosted panels (`bg-card/90 backdrop-blur-xl`).
- **Buttons**: Consistent obsidian primary buttons, warm pill toggles, and clean outline buttons.

