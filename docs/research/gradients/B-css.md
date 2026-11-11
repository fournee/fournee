# Track B: CSS implementation of gradient roles

**Summary.**
1. Emit each fill as registered `<color>` stop properties (`inherits: true`) plus a separate unregistered angle and space. Have Frosting assemble `linear-gradient()` in its stylesheet, always with an explicit `in oklab`. Keep the solid role painted underneath as `background-color`.
2. Per-element `setProperty` was about 60x cheaper than writing to `:root` in a local benchmark, and `@scope` and style queries don't replace it.
3. Gradient text needs a solid-colour base and an `@media (forced-colors: active)` reset. Without the reset, Firefox renders it invisible.

Local experiment: Playwright with Chromium 158, Firefox 159 and WebKit 27.2, 2026-11-10. Scripts are in `research/exp/` (exp.cjs, exp2.cjs, exp3.cjs). Results marked **[measured]** come from it.

## 4. One whole-gradient variable vs registered stop properties

**Recommendation:** use registered stops, for example `--fr-accent-fill-1..n` with `syntax:"<color>"; inherits:true; initial-value:<solid role>`. Keep the angle and space as plain variables. Frosting's CSS composes the gradient.

**Evidence**
- An unregistered value that is invalid makes `background-image` compute to `none`, the initial value, and no earlier declaration can rescue it ([MDN guaranteed-invalid](https://developer.mozilla.org/en-US/docs/Glossary/guaranteed_invalid_value); [moderncss.dev](https://moderncss.dev/how-custom-property-values-are-computed/)). **[measured]** `--grad: notagradient` gave `none` in all three engines. A solid `background-color` on the same box survives because it is a different property.
- An invalid registered value falls back to the registered type rather than the whole declaration dying ([MDN, Registering properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Properties_and_values_API/Registering_properties)). **[measured]** `--reg: notacolor` computed to its `initial-value` in all three engines.
- `color-mix(in srgb, var(--reg) …)` resolved normally in all three engines **[measured]**, so the derived roles keep working.
- Cost: `inherits:true` registered properties run at about 98% of the speed of unregistered ones. `inherits:false` is much faster, but descendants stop seeing the value ([web.dev, Bramus, 2024-10-02](https://web.dev/blog/at-property-performance)). Looks rely on inheritance, so roles need `inherits:true`.
- Registration applies to the whole document. `@property` inside shadow roots is ignored in every browser ([Chrome, "CSS names", 2024](https://developer.chrome.com/docs/css-ui/css-names); [csswg #10541, open as of 2024](https://lists.w3.org/Archives/Public/public-css-archive/2024Jul/0180.html)). One name therefore has one type and one initial value page-wide. Two Frosting builds with different `@property` rules would collide, and the last rule wins ([MDN @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)).
- Animating registered properties runs on the main thread: style recalc plus a repaint on every frame ([bram.us, 2023-02-01, older](https://www.bram.us/2023/02/01/the-gotcha-with-property); [crbug 1411864](https://crbug.com/1411864)).

**Trade-off:** a whole-string variable is simpler and allows any number of stops, but it can't be type-checked or transitioned, and one bad value blanks the fill. Registered stops fix that at the price of a fixed maximum stop count. **Confidence: high.**

## 5. Interpolation space

**Recommendation:** `linear-gradient(in oklab <angle>, …)`. Allow `in oklch` only as an explicit opt-in for multi-hue fills, never for fills that run to white, black, grey or transparent. Gate it with `@supports (background-image: linear-gradient(in oklab, red, red))` over an sRGB fallback.

**Evidence**
- **[measured]** A blue-to-yellow gradient with no `in` clause matched `in srgb` pixel for pixel in all three engines, with a grey midpoint of 128,128,127. `in oklab` gave 108,172,199. Without the keyword, authors get the muddy sRGB midpoint, even though CSS Images 4 names Oklab as the default interpolation space ([css-images-4 §3.5.2](https://drafts.csswg.org/css-images-4/)). That the gap comes from the legacy-colour exception is *inferred*.
- **[measured]** For blue to white `in oklch`, Firefox and WebKit returned the same colour as oklab (116,163,255). Chromium returned 77,172,255, a cyan shift. Per the spec, white's hue should be powerless and treated as missing ([CSS Color 4 §4.4](https://www.w3.org/TR/css-color-4/)). The same symptom and a workaround (give the neutral stop the hue of the gradient) were documented in [Keith Grant, 2023-11](https://keithjgrant.com/posts/2023/11/problematic-color-gradients-and-workarounds/) (older, but it still reproduces). Chris Coyier also recommends Oklab as the gradient default ([2023-05](https://chriscoyier.net/2023/05/25/two-things-that-are-not-great-about-oklch/), older).
- Polar spaces default to `shorter hue`. `longer`, `increasing` and `decreasing` change the route around the hue wheel ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method)).
- Support: Chrome 111, Safari 16.2, Firefox 127. Baseline since 2024-06-11 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/gradient-interpolation)).
- On banding: no source found compares banding across spaces. Oklab's smoother lightness ramp is the likely benefit (*inferred*).

**Confidence:** high on the defaults and support; medium on banding.

## 6. Scoping a look to one element of ~80

**Recommendation:** keep the inline `setProperty` on the target element. Use `:root` only for the page look.

**Evidence**
- **[measured, Chromium]** Setup: 80 tiles × 40 spans, timing setProperty plus a style/layout flush. `:root` took 2.4–3.0 ms; one tile took 0.04–0.05 ms. Registered, unregistered and whole-string variables cost about the same. Recalc scales with the size of the subtree.
- Painting a gradient happens on the main thread. Changing `background-image` costs a repaint without relayout. Animated layers underneath can implicitly promote overlapping content into layers; one report found 34 layers and 200 MB ([DEV, ouvarov](https://dev.to/ouvarov/i-crashed-a-mobile-browser-with-one-css-property-heres-what-i-learned-about-rendering-3o53); practitioner report, undated). For the radar sweep: keep it as a transform/opacity-only layer at the bottom of the stack (`position:fixed; z-index:-1`). Static gradient tiles then aren't repainted per frame (*inferred*, check with Paint Flashing).
- `@scope` (Chrome 118, Safari 17.4, Firefox 146; [caniuse](https://caniuse.com/css-cascade-scope)) scopes selectors, not runtime values, so it doesn't help with looks chosen per tile at runtime.
- Style queries: every element is a style container by default, and `style(--x)` can test whether a property is present ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries)). Support: Chrome 111, Safari 18, Firefox 151, Baseline 2026-05-19 ([web-features](https://web-platform-dx.github.io/web-features-explorer/features/container-style-queries)). They work as a switch ("paint the fill only if a fill is set"), not as a replacement.

**Confidence:** high for the direction; the numbers are from one machine.

## 7. Text gradients

**Recommendation (safe pattern):**
```css
.fr-grad-text { color: var(--fr-text); }               /* solid base */
@supports (background-clip: text) or (-webkit-background-clip: text) {
  .fr-grad-text { background-image: var(--_fill); -webkit-background-clip: text;
    background-clip: text; -webkit-text-fill-color: transparent; }
}
@media (forced-colors: active) {
  .fr-grad-text { background: none; -webkit-text-fill-color: currentColor; }
}
```

**Evidence**
- In forced-colours mode, `background-image` computes to `none` unless it contains `url()`, and `text-shadow` computes to `none` ([css-color-adjust-1](https://drafts.csswg.org/css-color-adjust-1/#forced-colors-properties)). **[measured]** This held in Chromium and Firefox.
- **[measured, emulated forced colours]** Firefox: gradient text without the reset drew 0 visible pixels, so it was invisible. With the reset it was readable. Chromium stayed readable either way. WebKit was inconclusive because emulation had no effect.
- Selection: Firefox doesn't paint the selection on `background-clip:text` runs, while Blink and WebKit paint it on top ([Bugzilla 1516361](https://bugzilla.mozilla.org/show_bug.cgi?id=1516361)). Status not confirmed for 2026.
- Unprefixed `background-clip:text` arrived in Chrome 120 ([blink-dev intent](https://groups.google.com/a/chromium.org/g/blink-dev/c/szcfsqyaFsg)). Keep the `-webkit-` line for older Safari and Firefox ([caniuse](https://caniuse.com/background-clip-text)).
- MDN asks for contrast checks against the background, a solid fallback, and `@supports` ([MDN background-clip](https://developer.mozilla.org/en-US/docs/Web/CSS/background-clip)).
- No source found covers `prefers-contrast` with gradient text. Swapping to the solid role under `prefers-contrast: more` is the obvious step (*inferred*).

**Confidence:** high for forced colours in Firefox and Chromium; medium for selection and WebKit.

## Changes to the proposed concept
- Store each fill as registered `<color>` stops (`inherits:true`, initial value = the solid role) plus plain angle and space variables, not as one gradient string. Cap the stop count (for example 3).
- Frosting's stylesheet always writes `in oklab` explicitly. Unspecified gradients render as sRGB in all three engines. Offer `oklch` only for multi-hue fills, and never with neutral or transparent stops (Chromium shifts the hue).
- Always paint `background-color: var(--fr-<role>)` under `background-image`. This gives one fallback for invalid values, forced colours and missing support.
- Contrast is checked against every stop and the solid colour, and gradient text falls back to the solid role under `forced-colors` and `prefers-contrast: more`.
- Don't animate fill stops on the 80 tiles; registered properties repaint on the main thread every frame. Allow a one-shot transition on change at most. Keep the radar sweep transform/opacity-only and at the bottom of the stack.
- Keep `setProperty` on the target element; `@scope` and style queries don't replace it. A style query `style(--fr-x-fill-1)` can act as the "fill present" switch where Firefox 151+ is acceptable.
- `@property` is document-wide and ignored in shadow DOM. Ship the registrations once in `frosting.css`, and don't depend on stop properties inside shadow roots.
