# NASA and CERN: exact values for Fournée presets

Retrieved 2026-11-10. Contrast ratios were computed with the WCAG 2.x relative-luminance formula (script: `scratchpad/cr.py`).

## Summary
1. **NASA:** the HDS colour tokens are published in hsla in NASA's Terra UI `horizon.scss`, and nasa.gov's live CSS gives the hex: NASA Blue `#1C67E3`, NASA Red `#F64137`, and a 10-step "Carbon" grey scale.
2. **NASA fonts:** the brand guidelines name **Inter** (web display), **Public Sans** (web body) and **DM Mono** (numbers and labels), all OFL. Helvetica and Garamond are print-only.
3. **CERN:** the official colours chart (an image on design-guidelines.web.cern.ch) gives **CERN Blue `#0033A0`** (Pantone 286 C), black, white, four blue tints and four greys. The CERN WordPress theme adds status colours.
4. **CERN fonts:** the web theme self-hosts **Roboto** (Apache 2.0). The corporate faces Optima and Helvetica Neue are proprietary.
5. **Failures in the source palettes:** CERN's inline link blue `#4486E6` (3.62:1), CERN success `#1A8C48` (4.30:1), NASA's brand red, orange and green, and NASA's tertiary grey `#77777A` (4.46:1) all fail 4.5:1 as text. The mappings below swap in shades from the same families that pass.

---

## NASA

### Palette
Hex values marked "conv." are converted from the HDS hsla tokens. All others are as written in the source.

| Name | Hex | Source |
|---|---|---|
| NASA Blue (primary) | `#1C67E3` (token converts to `#1C68E3`) | [nasa.gov theme CSS](https://www.nasa.gov/); [horizon.scss L86](https://github.com/nasa/terra-ui-components/blob/main/src/themes/horizon.scss) |
| NASA Red (primary) | `#F64137` | same two sources |
| Carbon Black / Spacesuit White | `#000000` / `#FFFFFF` | horizon.scss |
| Blue shade / tint | `#0B3D93` conv. (nasa.gov uses legacy `#0B3D91`) / `#288BFF` | horizon.scss, nasa.gov |
| Red shade / tint | `#B60109` (nasa.gov; token converts to `#BA160D`) / `#F95853` conv. | same |
| International Orange (additional) | `#EB7024` conv. | horizon.scss |
| Active Green (additional) | `#48DB85` conv. | horizon.scss |
| Carbon 90 → 5 | `#17171B`, `#2E2E32`, `#444447`, `#58585B`, `#77777A`, `#959599`, `#B9B9BB`, `#D1D1D1`, `#E3E3E3`, `#F6F6F6` | nasa.gov CSS, which matches the conv. tokens to ±1 |
| Success / warning / error (bold) | green-600 `#29C269`, orange-500 `#EB7024`, red-600 `#E7180D` (all conv.) | horizon.scss `--terra-color-bg-*-bold` |
| Text on success / warning / error | green-900, orange-900, red-900 | horizon.scss |
| Call-to-action | chartreuse-500 `#38FF4F` conv. | horizon.scss |
| Focus (nasa.gov, USWDS) | `#2491FF` | nasa.gov CSS `outline:.25rem solid #2491ff` |

- **Dark mode:** exists. Terra's `terra-theme-dark` mixin re-tones the brand colours "to ensure proper contrast" (horizon.scss L2345–2366). The dark values were not extracted.
- **Caveat:** Terra UI is NASA's open-source implementation of HDS. HDS's own site (website.nasa.gov/hds/foundations/color/) returned HTTP 403.

### Proposed role mapping (light)

| Role | Hex | Pair | Ratio | Result |
|---|---|---|---|---|
| bg | `#FFFFFF` | | | |
| surface | `#F6F6F6` | | | |
| border | `#D1D1D1` | border/bg | 1.53 | decorative only; fails 3:1 if it is the only input boundary (use `#77777A`, 4.46) |
| text | `#17171B` | text/bg | 17.88 (surface 16.54) | pass |
| muted | `#444447` | muted/bg | 9.71 (surface 8.98) | pass |
| accent (accent-as-text) | `#1C67E3` | accent/bg | 5.12 (surface **4.74**) | pass, but thin margin on surface |
| accent-text | `#FFFFFF` | on accent | 5.12 | pass |
| button / button-text | `#1C67E3` / `#FFFFFF` | | 5.12 | pass |
| progress-fill / track | `#1C67E3` / `#D1D1D1` | fill/track | 3.36 | pass (3:1) |
| ok | green-800 `#1F7F47` *(inferred choice)* | /bg | 5.02 | pass. Brand green-600 = **2.33 FAIL**, green-700 = **3.61 FAIL** |
| warn | orange-700 `#A34B14` *(inferred)* | /bg | 5.88 | pass. Brand orange-500 = **3.05 FAIL** |
| bad | red-shade `#B60109` | /bg | 7.01 | pass. NASA Red `#F64137` = **3.67 FAIL**; red-600 = 4.63, a thin pass |
| series-1..4 | Blue `#1C67E3`, Red `#F64137`, Orange `#EB7024`, Carbon-60 `#58585B` | /bg | 5.12, 3.67, 3.05, 7.19 | all ≥3:1 as graphics |

### Type

| Face | Weights | Role | Licence | Open substitute |
|---|---|---|---|---|
| Inter | 300/400/600/700 (tokens); 100–900 loaded | display and headings (h1–h5 at 700) | SIL OFL | — (self-hostable) |
| Public Sans | 100–900 | body (`html` font-family on nasa.gov) | SIL OFL (USWDS) | — |
| DM Mono | 300/400/500 | mono: numbers, labels (500, uppercase, 3.5px tracking) | SIL OFL | — |
| Helvetica | — | print and identifier only | proprietary (Linotype) | **TeX Gyre Heros** (GUST licence, metric-compatible Helvetica clone) or Nimbus Sans; Inter for web |
| Garamond | — | print only | proprietary variants | **EB Garamond** (OFL, a Garamond revival) |

Sources: [NASA brand guidelines](https://www.nasa.gov/nasa-brand-center/brand-guidelines), horizon.scss L1–3 and L840–891, nasa.gov CSS. Weights per role come from the CSS.

### Type scale
- **HDS tokens (rem; 1rem = 16px):** 10, 12, 14, **16 (body)**, 20, 24, 36, 48, 72px.
- **Line-heights:** 1, 1.4, 1.8 (normal; used for body, alerts and captions), 2.2, 2.6.
- **nasa.gov:**
  - Paragraphs are 16px at line-height 1.65em.
  - Headings are 1.0 line-height. Section h2 is 2.1rem, page h1 runs 4–6.25rem, and display goes up to 7.5rem.
  - h6 is 0.81rem, uppercase, letter-spacing 0.025em.
  - Measure is `max-width: 68ex` / `72ex` (USWDS).
  - Smallest text is the 0.7rem (11.2px) DM Mono label.
- **Minimum size:** no stated minimum (not found). The smallest token is 10px.

### Extra rules
- **Focus:**
  - HDS: `--terra-focus-ring: solid 3px`, offset 1px, colour blue-500 (`#1C68E3`).
  - nasa.gov: 4px (`.25rem`) solid `#2491FF` (USWDS).
- **Accessibility claim:** HDS colours are "tested for accessibility", and custom colours should meet "WCAG AA contrast" ([Terra HDS overview](https://terra-ui.netlify.app/horizon-design-system)).
- **Legal:** Section 508, which incorporates WCAG 2.0 AA (prior research).
- **Links:** USWDS underlines them *(inferred from the USWDS base; not rechecked)*.
- **Motion:** no HDS rule found. `scroll-behavior: smooth` is set with no reduced-motion guard seen.

### Usage restrictions
The brand guidelines say:
- The Insignia, Logotype and Seal "are not public domain", may be used only by NASA, and not on third-party sites or in a way that implies endorsement.
- Decorative fonts that resemble the insignia or logotype typefaces are not permitted.

No restriction was found on colour values or on the OFL fonts. A personal theme with no logos, called something like "NASA-inspired", is fine *(inferred; US-government works are generally public domain, but the marks are protected)*.

---

## CERN

### Palette

| Name | Hex | Source |
|---|---|---|
| CERN Blue (primary; Pantone 286 C, CMYK 100/75/0/0, RGB 0/51/160) | `#0033A0` | [CERN Colours chart](https://design-guidelines.web.cern.ch/guidelines/colours) (image `Colours-286_A_A_0.png`) |
| Black (primary) | `#000000` | same |
| White (primary) | `#FFFFFF` | same |
| Blue tints 80 / 60 / 40 / 20% | `#385CB4`, `#6B84C5`, `#9BAEDB`, `#CDD6ED` | same. These are recommended "for layout of brochures, posters, etc." |
| Grey 80 / 60 / 40 / 20% | `#333333`, `#666666`, `#999999`, `#CCCCCC` | same |
| Web black | `#151515` | [home.cern](https://home.cern/) WP theme v3.38.0 preset `--wp--preset--color--black` |
| Web blue-200 / 300 / 400 | `#8AAFEB`, `#4486E6`, `#265CBF` | same |
| Web grays 50 / 100 / 400 / 800 | `#F6F6F7`, `#EBEBEB`, `#B0B0B3`, `#3D3D41` | same |
| Indigo, Mint-blue-800 | `#16222B`, `#224D53` | same |
| Orange, Orange-400 | `#FD6109`, `#FF8667` | same |
| Purple-300 / 500 | `#D45BB5`, `#6E2466` | same |
| Status: success / info / warning / error | `#1A8C48`, `#1B7DC5`, `#FFCD0C`, `#E6001D` | same (`table-*` presets) |
| Link focus colour | `#996C00` | home.cern global styles |

- **Logo colour:** the CERN logo is always Pantone 286 C, with black or white allowed where needed.
- **Dark mode:** none found.

### Proposed role mapping (light)

| Role | Hex | Pair | Ratio | Result |
|---|---|---|---|---|
| bg | `#FFFFFF` | | | |
| surface | `#F6F6F7` | | | |
| border | `#999999` (chart grey 40%) | /bg | 2.85 | below 3:1. Use `#666666` (5.74) for input boundaries; `#CCCCCC` = 1.61 is decorative only |
| text | `#151515` | /bg | 18.26 (surface 16.91) | pass |
| muted | `#666666` | /bg | 5.74 (surface 5.32) | pass |
| accent (accent-as-text) | `#0033A0` | /bg | 10.60 (surface 9.81) | pass |
| accent-text / button-text | `#FFFFFF` | on `#0033A0` | 10.60 | pass |
| button | `#0033A0` | | | |
| progress-fill / track | `#0033A0` / `#CDD6ED` | fill/track | 7.29 | pass |
| ok | `#1A8C48` | /bg | **4.30 FAIL** as text | pass as UI (3:1). For text use a darker green *(not in source; would need inventing)* |
| warn | `#FFCD0C` | /bg | **1.50 FAIL** | usable only as a fill with `#151515` text (12.17) |
| bad | `#E6001D` | /bg | 4.79 | pass |
| series-1..4 | `#0033A0`, `#FD6109`, `#6E2466`, `#224D53` | /bg | 10.60, 3.05, 9.97, 9.31 | all ≥3:1 |
| (live site link) | `#4486E6` | /bg | **3.62 FAIL** | CERN's own inline-link colour fails AA. Use `#0033A0` or `#385CB4` (6.25) |

### Type

| Face | Weights | Role | Licence | Open substitute |
|---|---|---|---|---|
| Roboto | 400, 700, 900 (+ italics), self-hosted TTF | web: body and headings | Apache 2.0 | — |
| Optima | — | logotype lettering | proprietary (Linotype) | **Marcellus** or **Linux Biolinum** *(inferred)*. Optima-like flared sans: Biolinum (OFL/GPL) shares the humanist flare. No metric clone exists. |
| Helvetica Neue | — | corporate companion face | proprietary | **TeX Gyre Heros** or Nimbus Sans (Helvetica lineage, near-metric); Inter for screen |
| Arial | — | fallback | proprietary (Monotype) | **Liberation Sans** / Arimo (metric-compatible, OFL/Apache) |
| (mono) | — | not found | — | suggest Roboto Mono (Apache) *(inferred, same family)* |

The Optima / Helvetica Neue / Arial roles come from a search-index snippet of design-guidelines.web.cern.ch/node/29 ("Corporate fonts"). That URL now serves the frontpage, so this is **unverified today**. Roboto comes from home.cern `@font-face` rules.

### Type scale (home.cern theme.json output)
- **Body:** 16px with line-height **20px** (1.25). Small is 12px. Large is 24px.
- **Headings:**

  | Level | Size / line-height |
  |---|---|
  | h1 | 64 / 72px |
  | h2 | 56 / 64 |
  | h3 | 48 / 56 |
  | h4 | 40 / 48 |
  | h5 | 32 / 40 |
  | h6 | 24 / 32, underlined (2px thickness, 4px offset) |

- **Content width:** 1200px.
- **Not found:** letter-spacing, measure and minimum size.

### Extra rules
- **Links:** inline links underlined. Focus changes link colour to `#996C00` (4.67:1) and removes the underline.
- **Focus:** global `:focus-visible { outline: 3px auto; outline-offset: 3px }`.
- **Motion:** WordPress core blocks respect `prefers-reduced-motion`. There is no CERN policy.
- **Policy:** the target is WCAG AA ([2023 workshop](https://indico.cern.ch/event/1293028/contributions/5439085/attachments/2673040/4634222/presentation_the_future_of_web_accessibility_at_cern.pdf)). The design site's footer links the [Europa Web Guide accessibility checklist](https://wikis.ec.europa.eu/display/WEBGUIDE/02.+Content+accessibility+checklist).

### Usage restrictions
From [Name, protection and responsibility](https://design-guidelines.web.cern.ch/our-identity/name-protection-responsibility):
- "CERN's logo is protected by international law."
- "Any usage by third parties is subject to prior approval."

No rule was found on colour values or fonts. A personal theme with no logo and no CERN name in the branding is low-risk *(inferred)*. Roboto is free to use.

---

## Dial settings

| Preset | Text contrast min | Large-text definition | UI / non-text contrast | Focus rule | Min body px | Min any-text px | Spacing / resize / reflow | Motion | Extra rules |
|---|---|---|---|---|---|---|---|---|---|
| NASA | 4.5:1 (508 = WCAG 2.0 AA) | ≥18pt (24px), or ≥14pt (18.66px) bold | 3:1 is not required by WCAG 2.0. HDS targets AA; recommend 3:1 (2.1 SC 1.4.11) *(inferred)* | visible focus (2.4.7). House style: 3px solid ring, 1px offset (HDS) / 4px `#2491FF` (nasa.gov) | 16 | not stated; smallest token 10px, smallest used 11.2px | 200% resize (1.4.4). Reflow and text-spacing are 2.1-only (not legally required) | no rule found | measure 68–72ex; underlined links (USWDS, inferred) |
| CERN | 4.5:1 (WCAG AA target, version 2.1 expected) | WCAG default (24px / 18.66px bold) | 3:1 (2.1 AA) | visible focus. House style: `outline 3px auto`, offset 3px; link focus colour `#996C00` | 16 | 12 (small preset) | 2.1 AA: 200% resize, 320px reflow, text spacing | no CERN rule; WP core honours reduced motion | inline links underlined; Europa Web Guide checklist |

---

## Not found / unverified
- **HDS official site** (website.nasa.gov/hds): HTTP 403. HDS values come via Terra UI (NASA GitHub) and nasa.gov CSS.
- **NASA brand-guide hex values:** they sit in an image ("color guide"). Red and Blue hex values were not confirmed from the brand page itself. `#0B3D91` and `#FC3D21` are legacy third-party values.
- **NASA dark-mode values:** not extracted. A minimum font size and a motion rule are not found.
- **CERN fonts:** the corporate-fonts page content is unverified (the page now redirects). CERN mono face: not found.
- **CERN GitLab Drupal themes** (gitlab.cern.ch): connection timed out, not checked. The Drupal "CERN colours" docs list settings without values.
- **CERN:** dark mode, letter-spacing, measure and minimum size: not found. The PowerPoint palette (`Colours_image_PPT`) is a photo with no values.
- **Inferred, not stated by either organisation:**
  - the ok and warn shade choices for NASA
  - the Optima substitutes
  - the "personal theme is fine" readings
