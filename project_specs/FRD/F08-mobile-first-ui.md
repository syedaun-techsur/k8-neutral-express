
---

## F08: Mobile-First UI & Design System

**Description:** All pages in QuickNotes share a consistent visual design system implemented in plain CSS or CSS Modules. The design targets mobile viewports (≤375 px wide) first and enhances for wider screens via `min-width` media queries. Three colour tokens define the entire palette: near-black `#0A0A0A` for text, white `#FFFFFF` for surfaces, and Gold `#FBCA5C` as the sole accent applied sparingly. No external UI framework, icon library, or CSS-in-JS runtime may be used.

**Terminology:**
- **Mobile-first:** CSS rules written for the narrowest viewport first; larger-screen overrides added in `@media (min-width: ...)` blocks
- **Gold accent:** `#FBCA5C` — used only on primary CTAs, the pinned indicator, and active/focus states
- **Surface:** Background of a card, page, or panel — always `#FFFFFF`
- **Tap target:** Interactive element (button, link, input, checkbox) with a minimum hit area of 44 × 44 px (per WCAG 2.5.5 AAA / iOS HIG)
- **CSS Module:** A `.module.css` file scoped to a single component; class names are locally scoped by Next.js build

**Sub-features:**
- Global colour tokens (CSS custom properties or consistent hex literals)
- Mobile-first base layout (single-column, full-width)
- Responsive enhancement for wider viewports
- Gold accent on primary CTA buttons
- Gold accent on pinned note indicator
- Minimum 44 × 44 px tap targets on all interactive elements
- Accessible form labels (all inputs have associated `<label>`)
- No external CSS framework

**Design Tokens:**

| Token | Value | Usage |
|-------|-------|-------|
| Text | `#0A0A0A` | All body text, headings, input values |
| Surface | `#FFFFFF` | Page background, card backgrounds |
| Accent (Gold) | `#FBCA5C` | Primary CTA buttons, pinned indicator, focus ring |
| Accent constraint | ≤10% of any view | Gold must not dominate any screen |

**Layout Rules:**
- Base layout: single-column, `width: 100%`, `max-width: 600px`, centered with `margin: 0 auto`, `padding: 0 1rem`
- Larger screens (≥ 640 px): may increase padding to `0 2rem`; cards may gain a subtle border or shadow
- Note list: vertical stack of cards; each card full-width on mobile
- Forms: full-width inputs and textarea; submit button full-width on mobile, auto-width on larger screens

**Component Specs:**

*Note Card (list view):*
- Height: min-height sufficient to meet tap target (≥ 44 px)
- Contains: note title; pinned indicator (Gold accent element) if `pinned === true`
- Entire card is a tappable link to `/notes/[id]/edit`

*Submit / CTA Button:*
- Background: `#FBCA5C` (Gold); text: `#0A0A0A` (near-black for contrast)
- Min height: 44 px; min width: 44 px
- Border radius: implementation choice (≥ 4 px suggested)
- Hover/focus: darker gold or visible outline acceptable

*Search Input:*
- Full width; height ≥ 44 px; `#0A0A0A` text on white background
- Placeholder text: "Search notes…" (or equivalent)

*Form Inputs (title, body):*
- `title`: `<input type="text">` — full width, height ≥ 44 px
- `body`: `<textarea>` — full width, min-height 120 px, resizable vertically
- `pinned`: `<input type="checkbox">` — label text beside checkbox; overall tap area ≥ 44 × 44 px

*Delete Button:*
- Distinct from the Save/CTA button — must not use the Gold accent
- Acceptable: neutral grey, red, or outline style

**Accessibility Rules:**
- Every `<input>` and `<textarea>` must have an associated `<label>` (via `for`/`id` or wrapping)
- Colour must not be the sole means of conveying state (e.g., pinned indicator must include non-colour cue: icon, text, or different layout position)
- Focus styles must be visible (do not use `outline: none` without a replacement)

**Process (style application):**
1. Global base styles applied via a root CSS file (e.g., `app/globals.css`): reset, body colours, font.
2. Per-page and per-component styles via CSS Modules (`.module.css` files co-located with components).
3. Gold accent applied only to: submit CTA background, pinned indicator, active/focused interactive states.
4. All interactive elements verified to meet 44 × 44 px tap target on a 375 px viewport.

**Error States (design system):**

| Scenario | Visual treatment |
|----------|-----------------|
| Inline validation error | Red-tinted text `#CC0000` beneath the invalid field; `aria-invalid="true"` on input |
| Error banner (API failure) | Visually distinct block above or below the form; not using Gold accent |
| Empty state | Centered, muted text ("No notes yet"); optional subtle illustration in black/white |

**Validation:**
- No Tailwind, Bootstrap, Material UI, or any other CSS framework may be imported
- No CSS-in-JS libraries (styled-components, emotion, etc.)
- `X-Frame-Options` and CSP `frame-ancestors` constraints covered in F09

**API Surface (this feature):** None.

**Schema Surface (this feature):** None.

---
