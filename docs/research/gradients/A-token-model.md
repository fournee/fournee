# Track A: Token model for gradients

**Summary.**
1. No mature system I checked treats a colour *role* as a gradient. Where gradients exist, they are a separate token whose stops refer to colour tokens. That supports "solid role + optional fill".
2. The stable DTCG 2025.10 `gradient` type stores stops only (`color` and `position` from 0 to 1). It has no angle and no linear/radial/conic kind, so Frosting needs `$extensions` for those.
3. Checking contrast at the stops alone is not safe. With hex stops, CSS blends in sRGB by default, and the colour between two stops can be darker than both. Name `in oklab` explicitly and check contrast on samples taken along the gradient.

## 1. How mature systems represent gradients

| System | Gradient as token? | Evidence |
|---|---|---|
| W3C DTCG 2025.10 (stable, "Final Community Group Report", 28 Oct 2025) | Yes, a composite `$type: "gradient"`. Its `$value` is a list of `{color, position}` stops. A stop's colour can reference a colour token, and positions outside 0–1 are clamped. **No angle or kind.** Issue 101 asks whether to add one and is still open. | [Format §9.7](https://www.designtokens.org/tr/2025.10/format/) |
| DTCG colour | `{colorSpace, components, alpha?, hex?}`, across 14 colour spaces including `srgb` and `oklab`/`oklch` | [Color module 2025.10](https://www.designtokens.org/tr/2025.10/color/) |
| Style Dictionary v4/v5 | Reads DTCG files, but core has no gradient-to-CSS transform. People use the community `style-dictionary-utils` `gradient/css` transform or write their own (Wix does). | [style-dictionary-utils README](https://unpkg.com/style-dictionary-utils@4.0.5/README.md), [Wix tokens README](https://cdn.jsdelivr.net/npm/@wix/design-system-tokens@1.213.0/README.md) |
| Figma variables | **No gradient variable type.** Colour variables can be bound to individual gradient stops (announced at Framework 2024). Forum requests for a gradient type are still open as of Jul–Oct 2026. | [Forum: support gradient values in variables](https://forum.figma.com/suggest-a-feature-11/support-gradient-values-in-variables-56401), [add gradients as a variable type](https://forum.figma.com/suggest-a-feature-11/add-gradients-as-a-variable-type-26400) (forum evidence, not an official roadmap) |
| Tokens Studio | A CSS-like string in a *colour* token, e.g. `linear-gradient(180deg, {colors.gray.50} 0%, …)`. Only linear works in Figma export; radial and conic are "Requested". | [Docs: gradient](https://docs.tokens.studio/manage-tokens/token-types/color/gradient) |
| Tailwind v4 | No gradient tokens. Utilities compose gradients from colour tokens: `bg-linear-<angle>`, `bg-radial`, `bg-conic-<angle>`, plus `from-`/`via-`/`to-` and their positions. **Default is `in oklab`**, changeable with `/srgb`, `/oklch`, `/longer` and similar. | [Docs: background-image](https://tailwindcss.com/docs/background-image) |
| Open Props | 30 finished gradients `--gradient-1..30`, each a separate prop and not tied to roles. Direction can be changed with a custom-property mixin. | [open-props.style](https://open-props.style/#gradients) |
| Material 3, Radix Colors | I found no gradient tokens. M3 roles and the Radix steps (9–10 solid backgrounds, 11–12 text) are single colours. | [Radix scale](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale), [Flutter ColorScheme](https://api.flutter.dev/flutter/material/ColorScheme-class.html). *Inferred from absence.* |

**Recommendation:** keep "solid role + optional fill". It matches what this table shows. Roles stay solid, and the gradient is a separate composite whose stops point at colours, as in DTCG and Figma's stop binding. **Trade-off:** two values per role (solid and fill) can drift apart; the panel has to show both. **Confidence: high** for DTCG, Tailwind and Tokens Studio; **medium** for M3 and Radix, where the finding is that I saw no gradient tokens.

## 2. What stands in as the role's solid colour

- WCAG 1.4.3 has no gradient method. It measures against "the specified background over which the text is rendered" and lists F83, background images with too little contrast, as a failure ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). Practitioner guides say to test the **lowest-contrast point under the text** ([gradientshub, undated](https://gradientshub.pages.dev/blog/why-gradients-need-their-own-contrast-test), [instantgradient, undated](https://instantgradient.com/blog/accessible_gradient_guide)). Gradientshub also warns that checking only 0/50/100% can miss the minimum.
- **sRGB blending can dip below both stops.** I computed this: between `#FF00FF` and `#00FF00`, relative luminance is 0.285 and 0.715 at the stops but falls to **0.179 at t≈0.32**. Black text passes at both stops (6.7:1 and 15.3:1) but gets **4.59:1** at that point, which still passes 4.5:1 only barely. Blended `in oklab`, the minimum stays at the stop (0.285). Local Node calculation, *computed*. The dip happens because each linearised channel is convex along the sRGB blend.
- CSS Color 4 says interpolation defaults to Oklab, **except between legacy sRGB colours (hex, `rgb()`, `hsl()`), which blend in gamma sRGB** ([CSS Color 4 §Interpolation, CRD 3 Nov 2026](https://www.w3.org/TR/css-color-4/#interpolation-space)). Frosting stores hex (`readability.js` accepts only `HEX`), so without `in oklab` it gets the sRGB path.

**Recommendation:** treat "solid" and "contrast basis" as two different things.
- *Solid* (used for borders, text and the `background-color` fallback) is an explicit hex that the panel seeds automatically from the **worst-contrast stop** against the role's contrast partner. The worst stop is the safe fallback colour, while an average can create contrast the real gradient does not have *(inferred)*. First stop and plain average both fail that safety test.
- *Contrast checks* take the **minimum over sampled points** of the gradient, about 16 per segment, using the same blending space the CSS uses. Checking the stops is enough only if the blend is `in oklab` *(computed for one case; approximately true in general, inferred)*.
- **Confidence: medium.** The evidence is clear, but there is no normative standard for gradients.

## 3. Stop schema and DTCG mapping

- **Colour:** hex sRGB stops, so the current engine works unchanged. Stops may *reference* a role (`{role: "accent"}`), so a gradient follows the look. On export, write DTCG colour objects with `hex`.
- **Positions:** a number from 0 to 1, the same as DTCG. Clamp it and keep stops in ascending order. DTCG extends the end colours if no stop sits at 0 or 1.
- **Direction:** store the angle as a number in degrees and offer keywords only as UI presets. CSS corner keywords (`to top right`) depend on the box's aspect ratio ([CSS Images 4 WD, 30 Sep 2025](https://www.w3.org/TR/css-images-4/#linear-gradients)), so the same token would look different on 80 differently shaped tiles. **Inferred**, from the spec's definition.
- **Kind:** `linear` in v1. Leave room for `radial` and `conic`, since CSS, Tailwind and Figma all have them, but Tokens Studio's export supports only linear.
- **Interpolation:** store it and default to `oklab`, matching Tailwind and CSS Color 4 for non-legacy colours. Always write it out (`linear-gradient(135deg in oklab, …)`).
- **Stop count:** 2–4. Tailwind's from/via/to covers 3. More stops make contrast sampling and the panel harder *(inferred; no source sets a limit)*.
- **DTCG export:** `$type: "gradient"` and `$value: [{color: "{color.accent}", position: 0}, …]`, with `$extensions: {"com.frosting": {kind, angle, interpolation}}`. Keep the solid as its own `$type: "color"` token, e.g. `accent` and `accent-fill`. Note: I found **no DTCG export code** in `frosting/` (grep for `$type` and `colorSpace` found nothing), so it may live elsewhere.

**Confidence:** high on the DTCG structure; medium on the stop limit and the decision to store angles only.

## Changes to the proposed concept

- Keep "solid + optional fill", but make the solid an **explicit, auto-seeded value**: by default the worst-contrast stop, not the first stop or the average.
- Run contrast checks on the **minimum over sampled points** along the rendered gradient, not on "the worst stop". sRGB blending can dip below every stop (computed: 6.7:1 at the stops, 4.59:1 in between).
- **Always write `in oklab`** in the CSS. Hex stops otherwise blend in sRGB, which looks muddier and creates those contrast dips.
- Store the angle as a number in degrees. Treat `to <side>` keywords as UI shortcuts only, and avoid corner keywords because they change with tile shape across the 80 tiles.
- Let stops **reference roles** as well as hold hex, so a fill follows the look and stays editable in DTCG.
- Allow 2–4 stops. Ship linear first, with radial and conic reserved in the schema.
- For DTCG export, use `$type: gradient` with stops and put `kind`, `angle` and `interpolation` under `$extensions["com.frosting"]`, because the stable spec has no field for them. Emit the solid as a sibling colour token.
- Note: Style Dictionary and Figma can't use the fill directly (Figma has no gradient variables), so downstream tools need a custom transform or will fall back to the solid.
