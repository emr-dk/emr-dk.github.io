# emr-dk.github.io

Personal website hosted on GitHub Pages. A collection of individual one-page sites linked together in a chain, each with a distinct visual style. No framework or build step — plain HTML, CSS, and vanilla JS.

## Structure

The root `/` is a hub page. It does not participate in the sub-site chain — it links to all sub-sites via a Classic Mac OS terminal listing and a mystery `?` keycap button that navigates to a random sub-site.

The 8 sub-sites form a circular chain navigated by `.page-dots` at the bottom of each page:

```
site_colorful (1) → site_funky (2) → site_terminal (3) → site_programming (4)
  → site_huge (5) → site_old_school (6) → site_minimalist (7) → site_design (8) → (loops)
```

`site_ragchat`, `site_rainbow`, and `site_lazy` exist but are **not in the chain**.

## Navigation pattern (page-dots)

Each sub-site has a fixed `.page-dots` nav at the bottom with 8 dots + left/right arrows:

```html
<nav class="page-dots" aria-label="Sidenavigation">
  <a href="/site_design/"      class="pd-arrow" aria-label="Forrige side">&lt;</a>
  <a href="/site_colorful/"    class="pd-dot" aria-current="page" aria-label="Side 1"></a>
  <a href="/site_funky/"       class="pd-dot" aria-label="Side 2"></a>
  <a href="/site_terminal/"    class="pd-dot" aria-label="Side 3"></a>
  <a href="/site_programming/" class="pd-dot" aria-label="Side 4"></a>
  <a href="/site_huge/"        class="pd-dot" aria-label="Side 5"></a>
  <a href="/site_old_school/"  class="pd-dot" aria-label="Side 6"></a>
  <a href="/site_minimalist/"  class="pd-dot" aria-label="Side 7"></a>
  <a href="/site_design/"      class="pd-dot" aria-label="Side 8"></a>
  <a href="/site_funky/"       class="pd-arrow" aria-label="Næste side">&gt;</a>
</nav>
```

Set `aria-current="page"` on the current site's dot. Left arrow links to the previous site; right arrow links to the next site.

## Index page (`/`)

Redesigned April–May 2026. Two files: `index.html` (EN) and `index-da.html` (DA), linked by a fixed `EN`/`DA` toggle (`.lang-toggle`) in the top-right corner.

### Palette & fonts
- Background: lilac `#D4C4F0` throughout all sections
- Text: `#1A0F2E` (deep plum), period accent: `#3A0D7A`
- Font: Space Grotesk (Google Fonts) — 700 hero, 300 body

### Section order
1. **Hero** — full-viewport, name in `clamp(4rem, 12vw, 16rem)`, `riseUp` animation (`overflow: hidden` + `translateY(110%)` → 0), 0.2s stagger on second line
2. **Intro** — flex column, `padding: 6rem 8vw`:
   - `.intro-text`: bio paragraph ("Emil is a data engineer and GIS specialist…")
   - `.intro-sub`: CTO line, flex row — `.intro-sub-dash` ("—") + `.intro-sub-text` ("he is also the CTO of aiknowit"), `align-self: flex-end`
   - `.intro-body`: resume paragraph ("He has worked for agencies, cities, and municipalities*…"), same font size as bio, `margin-top: 20vh`
   - `.ast`: superscript asterisk after "municipalities" with CSS tooltip (`data-tip`) listing all clients; tooltip floats up on hover
   - `.currently`: italic "now" line with small-caps `.currently-label` ("Now" / "Nu"), `margin-top: 3rem`
3. **Socials** — centered flex, `padding: 20vh … 20vh`: `.socials-heading` ("Get in touch") above Email / GitHub / LinkedIn links at `clamp(1.8rem, 4vw, 3.5rem)`
4. **Explore** — Classic Mac OS terminal (36px title bar, striped `repeating-linear-gradient`, 0.95rem title font, `6px 6px 0` shadow) listing 9 sub-sites + `?` keycap mystery button
5. **`<footer class="site-footer">`** — outside `<main>`, "Emil Møller Rasmussen · 2026", small muted text

### Commented-out
- Skills strip (`.skills-strip` / `.skill-icon`) using devicons — HTML commented out in both files, CSS still present. Can be re-enabled. Icons: Python, PostgreSQL, Docker, Go, Bash, Git, Jupyter, Linux via `devicons@v2.15.1` CDN.

### CSS notes
- No borders between sections (all lilac, seamless)
- `20vh` vertical rhythm used throughout (intro-sub margin, intro-body margin, socials padding)
- `--border` CSS variable exists but is not currently applied to any visible element

## Shared assets

`/static/` (root) contains:
- `bulma.min.css` — some older sites use it
- `favicon-big/` — favicon assets
- `site.webmanifest`
- `style.css` — index page styles only

Each sub-site has its own `static/style.css` and sometimes local fonts.

## Per-site notes

| Site | Status | Notes |
|------|--------|-------|
| `/` (index) | ✅ Done | Lilac editorial hub. Hero name animation, bio, socials, Mac terminal, mystery button. |
| `site_colorful` | ✅ Done | Dark bg, Roboto, per-letter colour animation. Dot-nav position 1. |
| `site_funky` | ✅ Done | Pink bg, Budge font, devicons rain. Bulma removed. Dot-nav position 2. |
| `site_terminal` | 🔲 Untouched | Typed terminal → penguin scatter chart (Chart.js). Dot-nav position 3. |
| `site_programming` | ✅ Done | Dark bg, dot-grid, VS Code editor aesthetic. JetBrains Mono, GitHub Dark syntax colors, 19-line staggered reveal, mouse spotlight. Dot-nav position 4. |
| `site_huge` | ✅ Done | Deep red bg, Sofia Sans Extra Condensed wght 1000, giant staggered diagonal text. Dot-nav position 5. |
| `site_old_school` | ✅ Done | IBM VGA font, CRT scanlines, boot sequence animation. Dot-nav position 6. |
| `site_minimalist` | ✅ Done | 3×3 photo grid, images resized to 400×400. Dot-nav position 7. |
| `site_design` | 🔲 Untouched | Editorial serif typography, animate.css. Dot-nav position 8. |
| `site_ragchat` | ✅ Done | Standalone RAG demo. Light lavender bg, Outfit font, keyword-matched Q&A (no backend). Not in nav chain. |
| `site_rainbow` | 🔲 Orphaned | Rainbow layered text effect, no nav. |
| `site_lazy` | 🔲 Orphaned | Unknown state. |

## Rules / gotchas

- **Do not put `overflow: hidden` on `<html>`** — it clips `position: fixed` elements in some browsers. Put it on `<body>` only if needed, or avoid it entirely.
- **Avoid Bulma where not needed** — most sites have dropped it. Only use if the site already depends on it.
- **Use `/static/` (absolute) not `../static/` for shared assets** — more consistent across subdirectory pages.
- **Images in `site_minimalist`** are already resized to 400×400 @ quality 80. Don't re-compress.
- **`site_funky` devicons only** — custom `icon-*` classes (bicycle, clarinet, etc.) have no font loaded. Only use `devicon-*` classes.
- **`site_ragchat`** — standalone demo, not wired into nav chain. Uses keyword-matched local Q&A (no backend). Frontend only: `Outfit` font, lavender light theme, pill-shaped input bar. If a real backend is added, it expects `POST /api/ask` → `{ answer: string }`.
- **Index mystery button** — the `sites` array in the inline script must stay in sync with the terminal listing in the HTML. If you add or remove a sub-site from the terminal, update the array too.
