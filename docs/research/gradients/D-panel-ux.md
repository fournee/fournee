# D. Panel UX: gradient editor and "lucky" gradients

**Summary.** Mainstream editors give every role the same small core: a Solid/Gradient switch, two stops to start, a bar where you click to add a stop, Delete to remove one, a Flip button and an angle control. Tasteful generated gradients come mostly from interpolating in OKLab/OKLCH and keeping endpoints close in lightness and chroma, with hue doing most of the changing. Hue alone can't tell ~80 cards apart: the practical limit is about 6–12 hues, so per-card identity needs a second channel such as a glyph, a label or a pattern.

## 10. Gradient editor: the minimal control set

**Evidence**
- **Figma:** four types (linear, radial, angular, diamond). New gradients start with 2 stops. Click the bar or "+" to add a stop; select it and press Delete or "−" to remove. **Flip gradient** and **Rotate gradient** controls arrived 27 Feb 2024. The help page doesn't describe a numeric angle field. Stops can be bound to variables and saved as styles. ([Figma Help](https://help.figma.com/hc/en-us/articles/34208860210199-Use-gradients-as-a-fill-or-stroke), undated; flip/rotate date from [Figma forum](https://forum.figma.com/suggest-a-feature-11/launched-quickly-reversing-gradients-2333))
- **Illustrator:** click below the slider to add a stop; press Delete, or drag the stop off the slider, to remove it. It also has **Reverse Gradient** and a numeric **Angle** field. ([Adobe Help, Modify gradients](https://helpx.adobe.com/illustrator/desktop/paint-and-fill/create-and-edit-gradients/modify-gradients.html))
- **Canva:** switching Solid to Gradient applies a two-colour gradient automatically. Style is picked from **preset tiles** (linear and circular directions), not from a dial. Up to 10 colours. Custom gradients aren't saved for reuse. (Third-party guides, [brendacadman.com 2026](https://brendacadman.com/how-to-use-custom-gradients-in-canva-complete-guide-2026/); not verified against Canva docs)
- **Penpot 2.5 (Mar 2025):** redesigned gradient UI with multiple stops and radial gradients ([AlternativeTo](https://alternativeto.net/news/2025/3/penpot-2-5-released-with-a-revamped-gradients-ui-shareable-board-links-and-much-more), [Penpot community](https://community.penpot.app/t/penpot-2-5-the-devil-is-in-the-details/7960)).
- **Chrome DevTools:** an "Angle Clock" for gradient angles ([Chrome DevTools tips](https://developer.chrome.com/blog/devtools-tips-03), undated, may be stale).
- **cssgradient.io:** a Linear/Radial switch, a stop bar and a picker ([site](https://cssgradient.io/), read 2026-11-10).
- **Josh Comeau's generator:** a colour-mode switch, Precision, Angle and an Easing curve ([site](https://www.joshwcomeau.com/gradient-generator/)).
- **Tailwind v4:** expresses angle as a number (`bg-linear-45`) plus an interpolation modifier (`/oklch`, `/srgb`). Most sources say the default is OKLab ([jakub.kr](https://jakub.kr/work/gradients); [Steve Kinney](https://stevekinney.com/courses/tailwind/gradients) says OKLCH, which conflicts). Not checked against Tailwind's own docs.
- **Swatch-first tools (uiGradients, Coolors):** offer **galleries plus randomise**. uiGradients is a single community `gradients.json` of named hex lists added by pull request ([README](https://cdn.jsdelivr.net/gh/ghosh/uigradients@main/README.md)). No published taste criteria were found. Coolors' spacebar randomises palettes; I couldn't confirm a spacebar randomiser in its gradient tool ([medialoot](https://medialoot.com/blog/7-free-tools-to-create-eye-catching-gradients/)).
- Adobe Express: no docs found.

**Recommendation.** Per role, offer Solid | Gradient. Gradient starts with 2 stops that come from the current solid colour plus a derived partner (Canva-style). Controls:
- 8 angle preset chips (0/45/90/…/315), instead of a dial
- a Flip/swap button
- one optional middle stop. Click the bar to add it; drag it off or use "−" to remove it.

Skip radial, angular and diamond for v1 *(inferred: none of the per-card parts need them)*. Whole page vs one card: one shared editor with a **scope chip** ("This page" / "This card: <name>") at the top. A card inherits from the page until a role is overridden, with a per-role "reset to page" control *(inferred; this follows Figma's style/variable binding model)*.

**Trade-offs.** Preset angles are faster with voice or mouse but lose fine angles. A numeric field could be hidden behind "more". Capping at 3 stops rules out rainbow looks.
**Confidence:** high for the core controls (Figma, Illustrator and Canva all agree); medium for the scope design (inferred).

## 11. Tasteful "lucky" gradients, and distinguishing ~80 cards

**Evidence: taste**
- **Gray dead zone:** a straight line through the middle of RGB space desaturates the midpoint. The fix is a polar or perceptual space. Keep saturation and lightness similar between endpoints so that hue does most of the changing. Plain HSL misjudges how light colours look. ([Comeau, updated 28 Oct 2025](https://www.joshwcomeau.com/css/make-beautiful-gradients/); [Kennedy, LearnUI](https://learnui.design/tools/gradient-generator.html); [CSS-Tricks](https://css-tricks.com/?p=335427))
- **OKLCH hue detours:** the hue can travel around the colour wheel and produce colours you never chose ([jakub.kr](https://jakub.kr/work/gradients)). In CSS the default is `shorter hue`; `longer` is opt-in ([MDN, modified 20 Apr 2026](https://developer.mozilla.org/en-US/docs/Web/CSS/hue-interpolation-method)).
- **Lightness ramps:** curated OKLCH palette tools fix the hue, step the lightness, and put chroma peaks in the mid-tones ([instantgradient](https://instantgradient.com/palettes/gradients); [Equinor EDS, Gaussian chroma](https://color-palette-generator-eds-prod.radix.equinor.com/about)).
- **Mesh look:** CSS mesh gradients are built from stacked radial gradients ([Pixlane](https://pixlane-site.pages.dev/gradient-generator/)).
- Not found: published curation rules for uiGradients, mesh-gradient galleries or shadcn themes, and any numeric hue-distance limit.

**Evidence: distinguishability**
- **Practical caps on categorical colours:**
  - Datawrapper: no more than 7; group categories or change the chart type beyond that ([Datawrapper, Muth 2022](https://blog.datawrapper.de/colors)).
  - Adobe Spectrum: fewer than 6 ([Spectrum](https://spectrum.adobe.com/page/color-for-data-visualization)).
  - Brath (Uncharted): hue is hard to use beyond about 8 categories. Label, icon, shape and texture scale further ([PDF](https://www.uncharted.software/assets/high-category-glyphs-in-industry.pdf); figure taken from the search summary, PDF text not read).
- **Upper bound with optimised palettes:** about 24–40 colours, at roughly 40 CIE L\*u\*v\* units apart, and only for viewers with normal colour vision ([Polychrome, JSS 2019](https://www.jstatsoft.org/article/view/v090c01), older).
- **Redundant colour plus shape** improves selection: about 66% accuracy for colour alone and 58% for shape alone, with redundant encoding doing better ([Nothelfer, Gleicher & Franconeri](https://visualthinking.psych.northwestern.edu/projects/papers/Nothelfer,%20Gleicher,%20&%20Franconeri%20-%20Redundant%20Encoding.pdf), pre-2024).

**Recommendation.**
- **Lucky gradient:** generate in OKLCH with the `shorter` hue path.
  - Hue difference between stops: 20–60° *(inferred threshold)* for "analogous", or a deliberate complement with a forced high-chroma middle stop.
  - Lightness: endpoints within about 0.15 L of each other *(inferred)*.
  - Chroma: never let the midpoint drop below the endpoints' chroma.
  - After generating, run the existing readability check against the darkest and lightest stop.
- **80 cards:** use hue family for about 8–12 groups *(inferred from the caps above)*. Within a group, vary the gradient angle, lightness or name glyph. Rely on the name and glyph for identity.

**Trade-offs.** Tight constraints make looks more alike across cards. A complement-plus-middle-stop option adds variety at a small risk of muddiness.
**Confidence:** high on interpolation space and the hue limits; low on the exact numeric thresholds (inferred).

## Changes to the proposed concept
- Start every gradient with two stops derived from the role's current solid colour. Offer 8 angle chips plus a Flip button instead of a free dial; put a numeric angle and a third stop behind "more".
- Store the interpolation space with the gradient: default `in oklch` with the shorter hue path, and avoid sRGB.
- Run readability checks against every stop, not just the average colour, because text can sit on any part of the fill.
- Constrain lucky and derive gradients in OKLCH:
  - similar lightness and chroma at the endpoints
  - limited hue distance, or a complement with a high-chroma middle stop
  - no grey midpoint
- Use one editor with a "This page / This card" scope chip. Cards inherit from the page, with per-role "reset to page".
- Don't rely on gradient hue to tell 80 cards apart. Plan for about 8–12 hue families and pair each with a second channel (glyph, name bar or pattern). Optionally, card-lucky could spread hues across the board.
- Leave radial, angular and mesh gradients out of v1.
