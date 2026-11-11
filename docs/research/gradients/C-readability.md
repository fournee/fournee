# Track C: Readability and accessibility of gradient roles

**Summary.** Checking against the worst stop is not safe. Gradients interpolated in sRGB, or in OKLCH taking the longer way round the hue wheel, can dip below both stops, so the check has to sample the actual interpolated line in the colour space the browser uses. No mainstream tool measures gradients for you (axe marks them "incomplete", Chrome shows no ratio, Firefox reports a min to max range), so Frosting's own engine is the only gate. Under forced-colors, gradients are removed by the browser anyway, and Frosting should fall back to the solid role in every other reduced or high-contrast context too.

## 8. Measuring contrast over a gradient

**Recommendation:** for each painted gradient, sample N≥32 points along the gradient line in the **same interpolation space the CSS declares** (default Oklab), then take the **minimum** WCAG 2 ratio against the paired text colour. Keep "worst stop" only as a quick pre-check. *Confidence: high.*

**Evidence**
- WCAG 2.2 Understanding 1.4.3 doesn't mention gradients. Contrast is "measured with respect to the specified background over which the text is rendered", and background images that fail are listed as failure F83. [W3C Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (living doc, read 2026-11-10)
- F83's test compares the text with "the area of the image that is darkest (for dark text) or lightest (for light text)". If that fails, it then checks "the background behind each letter". This amounts to taking the worst point of the actual background, with an escape hatch for each glyph. [F83](https://www.w3.org/WAI/WCAG22/Techniques/failures/F83)
- CSS Images 4: when no `in <space>` is given, gradients interpolate in "the default interpolation color space, Oklab". [CSS Images 4](https://www.w3.org/TR/css-images-4/). *Not confirmed:* whether all-legacy-sRGB stops still interpolate in sRGB in browsers. Test this before relying on it.
- **Midpoint dips, my own calculation** (script using WCAG luminance and the standard Oklab matrices, 101 samples; *inferred, not a published source*):

| Stops → text | Stop ratios | sRGB min | Oklab min | OKLCH shorter | OKLCH longer |
|---|---|---|---|---|---|
| #FF0000→#00FF00, black | 5.25 / 15.30 | **3.94** | 5.25 | 5.25 | 5.25 |
| #00A0FF→#FF6000, black | 7.47 / 6.93 | **5.29** | 6.93 | **6.77** | 6.95 |
| #00C8FF→#FF4FD8, black | 10.71 / 7.36 | **6.49** | 7.39 | 7.38 | **6.63** |
| #0050FF→#FF0050, white | 5.85 / 3.91 | 3.98 | 3.92 | 3.92 | **3.38** |

  Oklab never went below the worse stop in these cases. OKLCH can dip slightly through gamut clipping, and sRGB and longer-hue OKLCH dip a lot.
- **Tools:**
  - axe-core returns *incomplete* "Element's background color could not be determined due to a background gradient". [axe-core locales](https://raw.githubusercontent.com/dequelabs/axe-core/develop/locales/_template.json) (develop branch, read 2026-11-10)
  - Chrome DevTools shows no ratio without a solid background, so you sample by hand with the eyedropper. [WebAIM](https://webaim.org/articles/contrast/devtools) (undated, *may be stale*)
  - Firefox's Accessibility Inspector reports a range, for example "4.72 to 5.98". [Firefox docs](https://firefox-source-docs.mozilla.org/devtools-user/accessibility_inspector/index.html)
  - Polypane's algorithm handles colour, opacity and stacked backgrounds, but "can't automatically determine" contrast over images. I found no documentation of how it handles gradients. [Polypane blog](https://polypane.app/blog/find-and-fix-accessibility-issues-with-polypane/)
  - Stark: I found nothing on gradients.
- **APCA:** removed from the WCAG 3 draft in July 2023. The April 2026 editor's draft says "the contrast algorithm used in WCAG 3 is yet to be determined", and APCA's author says APCA should not be called "WCAG 3". [Roselli, Apr 2026](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html)

**Trade-offs:**
- Sampling the whole line is conservative. Text may sit only over part of it, and F83's per-letter clause would allow that. But card sizes vary across ~80 cards, so the part of the line under the text can't be known when the theme is built *(inferred)*.
- Sampling only the text box needs layout, which means runtime DOM work.

## 9. Behaviour under user preferences, print, and gradient text

**Recommendation:** fall back to the solid role colour in all four contexts. *Confidence: high for forced-colors, medium for the rest.*
- **forced-colors: active.** The browser does this for you. `background-image` "is forced to 'none' for values that are not url-based", and `color` gets a system colour. [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors). Risk: gradient text that uses `-webkit-text-fill-color: transparent` may become invisible. MDN doesn't cover `background-clip`, so this is *inferred*. Practitioner write-ups reset the text to `CanvasText` [example](https://dev.to/alphashark/css-gradient-text-that-actually-works-cross-browser-13ca) (*secondary source*). Never set `forced-color-adjust: none` on gradients.
- **prefers-contrast: more.** No W3C guidance on gradients. Using the solid role, as the existing high-contrast block already does when it lifts muted, matches Frosting's current pattern *(inferred)*.
- **prefers-reduced-transparency.** "Limited availability", experimental, not Baseline. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency). Use it only as a progressive enhancement, and drop gradient overlays that use alpha.
- **Print.** With `print-color-adjust: economy` (the default), the browser "might opt to leave out all background images and to adjust text colors". [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust). A gradient background then disappears while light text stays, so `@media print` must restore the solid role pair.

**Gradient text legibility:** WCAG notes that thin fonts "may be rendered … with a much fainter color" and encourages "a font with stronger/thicker lines" (Understanding 1.4.3). APCA's guidance (undated, *may be stale*): Lc 60 needs ≥24px/400 or 16px/700, and Lc 90 is "a recommended minimum for extremely thin fonts". [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell). No standard sets a minimum size for gradient text. A rule of large text only (≥24px regular, or ≥18.66px bold, the WCAG large-text threshold) at weight ≥600 is *inferred*.

## Auto-fit for gradients

**Recommendation:** nudge each stop independently, changing **OKLCH L only**. Re-sample the whole interpolated line after each move, iterate until the minimum passes, then reduce chroma if needed. The current `fit()` adjusts HSL lightness and checks a single colour (`readability.js` lines 40–54). HSL lightness isn't perceptually uniform, so OKLCH L keeps hue changes smaller *(inferred)*. *Confidence: medium.*
- If the stops pass but the midpoint fails, the fix is to change the interpolation space (sRGB to Oklab) or add a mid stop, not to move the end stops. In the table, Oklab removes every dip.
- Trade-off: a gradient running from light to dark behind fixed text often can't pass on both ends. The analogue is `bgHeadroom`, which already shows that mid-tones can't reach 7:1. In that case, fit fails closed to the solid role.

## Changes to the proposed concept
- Replace "check against the worst stop" with "sample the interpolated line (≥32 points) in the declared space and take the minimum".
- Make every gradient declare its interpolation space, defaulting to `in oklab`. Lint against `in srgb` and `longer hue` on any gradient that sits behind text.
- Extend `fit()` to adjust stops in OKLCH L only. If the midpoint fails, add a mid stop or switch to Oklab. If still unfixable, fail to the solid role.
- Under forced-colors, prefers-contrast: more, prefers-reduced-transparency and print, drop the gradient and use the solid role pair. Always pair gradient text with a solid `color` fallback.
- Limit gradient text to large text (≥24px, or ≥18.66px bold) at weight ≥600 *(inferred)*. Body, muted and button text stay solid.
- Report gradients as a min–max range, like Firefox, in the readability check output. External audits (axe) will mark them "incomplete", so Frosting's own report is the evidence.
