# SCMS Frontend Design Guide

This guide documents the current UI system used in `SCMS.Frontend/SCMS`. Use it when adding or changing frontend features so screens stay consistent.

## Design Direction

SCMS is an operational clinic management app. The UI should feel clear, calm, dense enough for daily admin work, and easy to scan. Prefer practical dashboards, structured forms, readable tables, compact stats, and predictable navigation over decorative marketing layouts.

Use the existing color palette. Do not introduce new feature colors unless there is no existing semantic match.

## Frontend Stack

- App framework: React with Vite.
- Routing: `react-router-dom`.
- Icons: `lucide-react` is the preferred icon system for buttons, navigation, status affordances, and empty states.
- Alerts and confirmations: use the shared popup helpers in `src/utils/dialogs.js`.
- Most admin screens currently use inline style objects. New shared styles should still follow the tokens below.

## Primary Admin Theme

These are the dominant tokens used across admin features such as appointments, medicines, diseases, reports, payments, prescriptions, notifications, and auth.

| Token | Value | Use |
|---|---:|---|
| `PRIMARY` | `#0052CC` | Primary actions, active navigation, focused controls, selected states |
| `PRIMARY_DARK` | `#003D99` | Primary hover states, login gradient depth |
| `PRIMARY_LIGHT` | `#EBF2FF` | Primary-tinted backgrounds, active nav background, soft selected states |
| `SUCCESS` | `#027A48` | Completed/success statuses |
| `WARNING` | `#B54708` | Pending/warning statuses |
| `DANGER` | `#D92D20` | Destructive actions, failed/error states |
| `BG` | `#F6F8FB` | Admin page background |
| `CARD` | `#FFFFFF` | Cards, panels, modal content |
| `TEXT` | `#1D2939` | Main text and headings |
| `MUTED` | `#667085` | Secondary text, helper text, inactive labels |
| `BORDER` | `#E4E7EC` | Card borders, inputs, dividers |

## Semantic Tints

Use these for badges, pills, alerts, and light status panels.

| Purpose | Text | Background | Border |
|---|---:|---:|---:|
| Success | `#027A48` | `#ECFDF3` | `#A9EFC5` |
| Primary/Confirmed | `#0052CC` | `#EBF2FF` | `#B2CCFF` |
| Danger/Error | `#D92D20` | `#FFF1F0` | `#FECDCA` |
| Warning/Pending | `#B54708` | `#FFFAEB` | `#FEDF89` |
| Neutral surface | `#667085` | `#F2F4F7` or `#F9FAFB` | `#E4E7EC` |

## Patient/User Theme Variants

Some patient-facing and user dashboard screens use an indigo variant. Keep this scoped to patient/user portal flows unless intentionally migrating the whole app.

| Token | Value | Current Use |
|---|---:|---|
| `PRIMARY` | `#4F46E5` | User layout, user dashboard, user appointment booking |
| `PRIMARY_DARK` | `#4338CA` | User primary hover/depth |
| `PRIMARY_LIGHT` | `#EEF2FF` | User active nav and soft backgrounds |
| `BG` | `#F9FAFB` | User page background |
| `TEXT` | `#1F2937` | User main text |
| `MUTED` | `#6B7280` | User secondary text |
| `BORDER` | `#E5E7EB` | User borders |

The TypeScript patient portal under `src/features/patient-portal` has its own mobile app shell and CSS variables. Keep these inside `.patient-portal-root`.

| Variable | Value |
|---|---:|
| `--blue-50` | `#eff6ff` |
| `--blue-100` | `#dbeafe` |
| `--blue-500` | `#3b82f6` |
| `--blue-600` | `#1e40af` |
| `--blue-700` | `#1e3a8a` |
| `--blue-900` | `#172554` |
| `--slate-50` | `#f8fafc` |
| `--slate-100` | `#f1f5f9` |
| `--slate-200` | `#e2e8f0` |
| `--slate-300` | `#cbd5e1` |
| `--slate-400` | `#94a3b8` |
| `--slate-500` | `#64748b` |
| `--slate-600` | `#475569` |
| `--slate-700` | `#334155` |
| `--slate-800` | `#1e293b` |
| `--slate-900` | `#0f172a` |
| `--amber-50` | `#fffbeb` |
| `--amber-100` | `#fef3c7` |
| `--amber-500` | `#f59e0b` |
| `--amber-600` | `#d97706` |
| `--violet-50` | `#f5f3ff` |
| `--violet-100` | `#ede9fe` |
| `--violet-500` | `#8b5cf6` |
| `--violet-600` | `#7c3aed` |
| `--red-500` | `#ef4444` |
| `--green-500` | `#22c55e` |
| `--white` | `#ffffff` |

## Legacy Global CSS Variables

`src/index.css` contains starter/global variables. Admin layouts often override these with page-level styles, but do not remove them without checking the patient portal and older pages.

| Variable | Light | Dark |
|---|---:|---:|
| `--text` | `#6b6375` | `#9ca3af` |
| `--text-h` | `#08060d` | `#f3f4f6` |
| `--bg` | `#fff` | `#16171d` |
| `--border` | `#e5e4e7` | `#2e303a` |
| `--code-bg` | `#f4f3ec` | `#1f2028` |
| `--accent` | `#aa3bff` | `#c084fc` |
| `--accent-bg` | `rgba(170, 59, 255, 0.1)` | `rgba(192, 132, 252, 0.15)` |
| `--accent-border` | `rgba(170, 59, 255, 0.5)` | `rgba(192, 132, 252, 0.5)` |
| `--social-bg` | `rgba(244, 243, 236, 0.5)` | `rgba(47, 48, 58, 0.5)` |

## Typography

Admin/auth screens:

```css
font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Shared component CSS:

```css
font-family: "Plus Jakarta Sans", sans-serif;
```

Patient portal:

```css
--font-en: "DM Sans", system-ui, sans-serif;
--font-mm: "Padauk", sans-serif;
font-family: var(--font-mm), var(--font-en);
```

Guidelines:

- Headings are usually bold, compact, and slightly tight in admin screens.
- Admin feature page titles are around `28px`, weight `900`.
- Section and modal titles are around `22px`.
- Labels are usually `12px` to `13px`, weight `700` or `800`.
- Body and table text is usually `13px` to `15px`.
- Avoid oversized hero typography inside dashboards and forms.

## Layout

Admin shell:

- Sidebar width: `268px`.
- Main background: `#F6F8FB`.
- Content max width is commonly `1180px` to `1240px`.
- Page content uses a vertical rhythm of `18px` to `24px`.
- Top-level feature screens start with a header row: title/subtitle on the left, primary action on the right.

Common grids:

- Stat cards: `repeat(auto-fit, minmax(180px, 1fr))` or similar.
- Listing cards: `repeat(auto-fill, minmax(300px, 1fr))`.
- Detail layouts: `1.5fr 0.8fr`, `1.6fr 0.9fr`, or two equal columns.
- Forms: one column on mobile, two columns for paired fields on wider screens.

Patient portal:

- Mobile shell max width: `430px`.
- Desktop patient portal is centered and framed with rounded app-shell corners.
- Use bottom sheets for mobile-first secondary flows.

## Surfaces

Use `CARD` (`#FFFFFF`) for content surfaces with a subtle border. Avoid nesting cards inside cards unless the inner item is a repeated row/card.

Common surface styles:

```js
{
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 18,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)"
}
```

Login/auth cards are larger and softer:

```js
{
  borderRadius: 28,
  boxShadow: "0 18px 50px rgba(16,24,40,0.08)"
}
```

Modal overlays:

```js
{
  background: "rgba(15,23,42,0.45)"
}
```

## Radius

- Small controls: `8px` to `10px`.
- Inputs and normal buttons: `12px` to `14px`.
- Cards and panels: `18px`.
- Auth panels: `24px` to `30px`.
- Pills and circular badges: `999px` or `50%`.
- Patient portal variables: `--radius-sm: 10px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-xl: 26px`.

## Shadows

Use shadows sparingly. Most admin surfaces should rely on borders.

| Token | Value | Use |
|---|---|---|
| Subtle card | `0 1px 2px rgba(16,24,40,0.04)` | Normal cards |
| Raised card | `0 18px 50px rgba(16,24,40,0.08)` | Auth/card emphasis |
| Primary button | `0 12px 24px rgba(0,82,204,0.18)` | Main CTA |
| Login brand | `0 30px 80px rgba(0, 82, 204, 0.22)` | Login hero panel |
| Modal content | `0 24px 70px rgba(16,24,40,0.25)` | Dialog boxes |

Patient portal shadows:

```css
--shadow-sm: 0 1px 3px rgba(30, 64, 175, 0.07), 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 16px rgba(30, 64, 175, 0.1), 0 1px 4px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 12px 40px rgba(30, 64, 175, 0.14), 0 4px 12px rgba(0, 0, 0, 0.08);
```

## Buttons

Primary button:

- Background: `#0052CC`.
- Text: `#FFFFFF`.
- Border: none.
- Radius: `12px` to `14px`.
- Font weight: `800` or `900`.
- Height: `42px` to `48px`.

Secondary/outline button:

- Background: `#FFFFFF`.
- Text: `#667085` or `#1D2939`.
- Border: `1px solid #E4E7EC`.

Danger button:

- Text or background uses `#D92D20`.
- Use light danger surfaces for warnings before destructive actions: `#FFF1F0` with border `#FECDCA`.

Icon buttons:

- Use `lucide-react` icons.
- Keep icon-only controls square and stable, usually `36px` to `42px`.
- Add accessible labels for icon-only buttons.

## Forms

Inputs:

- Height: `44px` to `48px`.
- Border: `1px solid #E4E7EC`.
- Radius: `12px` to `14px`.
- Text: `#1D2939`.
- Placeholder/helper: `#667085`.
- Background: `#FFFFFF`.

Focus state:

```css
border-color: #0052CC;
box-shadow: 0 0 0 4px rgba(0,82,204,0.10);
```

Labels:

- Use `12px` to `13px`.
- Weight `700` or `800`.
- Color `#1D2939`.

Validation:

- Inline error text: `#D92D20`.
- Error panel: background `#FFF1F0`, border `#FECDCA`, text `#D92D20`.

## Tables And Lists

- Tables should stay scannable and dense.
- Use sticky or clear headers where lists are long.
- Table header backgrounds should use neutral surfaces such as `#F9FAFB` or `#F2F4F7`.
- Row borders should use `#E4E7EC`.
- Keep row actions aligned to the right and use icons where obvious.
- Empty states should be calm, centered, and use `MUTED`.

## Cards And Stats

Stat cards usually include:

- Small muted label.
- Large numeric value.
- Optional icon block or status accent.
- White background, border, `18px` radius, compact padding.

Do not use purely decorative cards. Cards should hold a clear object: stat, record, form, detail summary, or repeated item.

## Status Badges

Badges should be compact, rounded, and semantic.

```js
{
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 800
}
```

Recommended mappings:

- `completed`, `paid`, `approved`: success tint.
- `confirmed`, selected, active: primary tint.
- `pending`, `low stock`, `near expiry`: warning tint.
- `cancelled`, `failed`, destructive: danger tint.

## Modals, Popups, And Alerts

Native `alert(...)` and `confirm(...)` should not be used directly in new code.

Use:

```js
import { showAlert, showConfirm } from "../../utils/dialogs";

await showAlert("Saved successfully.");

const ok = await showConfirm("Are you sure?");
if (!ok) return;
```

Popup colors are intentionally aligned with the admin theme:

- Popup text: `#1D2939`.
- Popup muted text: `#667085`.
- Confirm button: `#0052CC`.
- Cancel button: `#FFFFFF` with `#E4E7EC` inset border.
- Radius: `8px`.

Feature modals:

- Overlay: `rgba(15,23,42,0.45)`.
- Modal surface: `#FFFFFF`.
- Radius: `18px`.
- Max width depends on task: `680px`, `720px`, `820px`, or wider for EMR (`1180px`).
- Close on backdrop is currently common; make sure forms do not lose critical data unexpectedly.

## Animations

Existing global animation hooks:

- `animate-modal-in`: short scale/fade modal entrance.
- `animate-stream-feed`: content feed entrance.
- Patient portal has `fade-up`, `fade-in`, `sheet-up`, toast, pulse, spin, and shake animations.

Use short durations:

- Modal: around `0.2s`.
- Page/feed entrance: around `0.25s` to `0.35s`.
- Use `cubic-bezier(0.16, 1, 0.3, 1)` for polished entrances.

## Responsive Rules

- All major forms and grids must collapse to one column on narrow screens.
- Keep button text from overflowing by allowing wrapping or using shorter labels.
- Tables may use horizontal scroll for dense clinical/admin data.
- Admin sidebar becomes a mobile drawer.
- Do not scale font size with viewport width. Use media query breakpoints and fixed readable sizes.

Common breakpoints in the app:

- `900px`: auth layout switches from split view to single card.
- `768px`: global mobile adjustments.
- `420px`: tighter auth padding.

## Icons

Use `lucide-react` for:

- Navigation items.
- Button actions.
- Empty states.
- Status summaries.
- Form affordances such as email/password icons.

Avoid custom SVGs for common actions if a Lucide icon exists.

## Color Inventory

The following colors are currently present in `SCMS.Frontend/SCMS/src`. Prefer the canonical tokens above when writing new code; treat one-off colors as legacy or component-specific unless documented.

Admin and semantic colors:

- `#0052CC`, `#003D99`, `#EBF2FF`, `#B2CCFF`
- `#027A48`, `#ECFDF3`, `#A9EFC5`
- `#B54708`, `#FFFAEB`, `#FEDF89`
- `#D92D20`, `#FFF1F0`, `#FECDCA`
- `#F6F8FB`, `#FFFFFF`, `#1D2939`, `#667085`, `#E4E7EC`
- `#F2F4F7`, `#F9FAFB`, `#EAECF0`, `#D0D5DD`, `#475467`

User/patient colors:

- `#4F46E5`, `#4338CA`, `#EEF2FF`, `#312E81`
- `#1F2937`, `#6B7280`, `#E5E7EB`
- `#1e40af`, `#1e3a8a`, `#172554`, `#3b82f6`, `#eff6ff`, `#dbeafe`
- `#0f172a`, `#1e293b`, `#334155`, `#475569`, `#64748b`, `#94a3b8`, `#cbd5e1`, `#e2e8f0`, `#f1f5f9`, `#f8fafc`
- `#f59e0b`, `#d97706`, `#fffbeb`, `#fef3c7`
- `#8b5cf6`, `#7c3aed`, `#f5f3ff`, `#ede9fe`
- `#ef4444`, `#22c55e`

Other legacy/global colors:

- `#08060d`, `#6b6375`, `#e5e4e7`, `#f4f3ec`, `#aa3bff`
- Dark-mode starter values: `#16171d`, `#2e303a`, `#1f2028`, `#9ca3af`, `#f3f4f6`, `#c084fc`
- Additional one-offs found in feature code: `#0E7090`, `#15803d`, `#16a34a`, `#1d4ed8`, `#2563eb`, `#6d28d9`, `#7A5AF8`, `#92400e`, `#b91c1c`, `#dcfce7`, `#f0fdf4`, `#fef2f2`, `#FFF8F6`

Common opacity colors:

- Overlay: `rgba(15,23,42,0.45)`, `rgba(15, 23, 42, 0.5)`
- Card shadow: `rgba(16,24,40,0.04)`, `rgba(16,24,40,0.08)`, `rgba(16,24,40,0.25)`
- Primary focus/shadow: `rgba(0,82,204,0.10)`, `rgba(0,82,204,0.18)`, `rgba(0, 82, 204, 0.22)`
- White-on-primary surfaces: `rgba(255,255,255,0.08)` through `rgba(255,255,255,0.9)`
- Patient portal blue shadows: `rgba(30, 64, 175, 0.07)`, `rgba(30, 64, 175, 0.1)`, `rgba(30, 64, 175, 0.14)`, `rgba(30, 64, 175, 0.28)`

## Implementation Checklist

Before merging a new or changed frontend feature:

1. Use existing tokens from this guide.
2. Use `lucide-react` icons for common actions.
3. Use `showAlert` and `showConfirm` instead of native alert boxes.
4. Match admin layout rhythm: header, stats/actions, content grid/table, detail/modal.
5. Check mobile layout at narrow widths.
6. Keep text readable and inside controls.
7. Run `npm run build` from `SCMS.Frontend/SCMS`.
