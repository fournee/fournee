# International bodies and big organisations: standards for the Fournée dial

Researched 2026-11-10. "Accessed" means the page had no date of its own, so the date given is the day it was read.

## Summary
1. **WCAG 2.2 (12 Dec 2024 edition)** is the baseline everywhere. **ISO/IEC 40500:2025** (Sept 2025) now equals WCAG 2.2, but the **Oct 2023** text. A newer DIS is in progress.
2. **WCAG 3** is still a Working Draft (10 Sep 2026). Its contrast metric is literally "to be determined". APCA is **not** named, so it can only ever be an optional "future" setting.
3. The **UN** is the strictest body found: WCAG 2.1 AA **plus 7:1 for regular text and 4.5:1 for large text**. Frosting's 7:1 main-text contract already meets this; its 4.5:1 muted and accent text does not.
4. Big-tech design systems set **smaller type floors than Fontdant**: Fluent's smallest style is 10px, and Apple, Material and Carbon go down to 11–12. Fontdant's 16px body and 12px floor are stricter than all of them, so the dial must allow these looser profiles without losing the WCAG-only floors.
5. None of these bodies sets a focus-ring, non-text-border or gradient rule that Frosting checks today. Those are the main **gaps** to add.

## Profiles

### WCAG 2.2 (W3C)
- **Who it applies to:** the referenced standard, worldwide. **Status:** W3C Recommendation, 12 Dec 2024 edition ([w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/), 2024-12-12). Binding only through the laws that cite it.
- **Text contrast:** 4.5:1 at AA, 7:1 at AAA. Large text needs 3:1 (AA) or 4.5:1 (AAA). "Large" means ≥18pt, or ≥14pt bold. The px conversion of about 24px, or 18.66px bold, is *inferred* from the 1pt = 1.333px CSS ratio.
- **Non-text contrast:** 3:1 (1.4.11).
- **Focus:** 2.4.11 at AA, "not entirely hidden". 2.4.13 at AAA: an area at least as large as a 2px perimeter, and 3:1 contrast between focused and unfocused states.
- **Resize and reflow:** text resizes to 200%. Reflow works at 320 CSS px wide, or 256px high for horizontally scrolling content.
- **Text spacing (1.4.12):** line-height 1.5, paragraph spacing 2× the font size, letter spacing 0.12em, word spacing 0.16em.
- **Motion:** 2.2.2 covers auto-moving content that lasts more than 5s. 2.3.3 (AAA) lets people disable animation triggered by interaction.
- **Target size:** 2.5.8 sets 24×24 CSS px at AA, and 2.5.5 sets 44×44 at AAA. These are from WCAG's standard text; that part of the page was not reached on this fetch.
- **No minimum font size.**
- **Dial:** this is the default profile. Add an "AAA" variant.

### ISO/IEC 40500:2025 (ISO/IEC JTC 1)
- **Status:** International Standard, Edition 2, published 2025-09-23 ([SCC](https://scc-ccn.ca/standardsdb/standards/2057701); [ISO](https://www.iso.org/standard/91029.html), 2025-09). The W3C notes it is the **October 2023** WCAG 2.2, and that a next version, **DIS 40500**, is under development ([W3C news](https://lists.w3.org/Archives/Public/w3c-news/2025OctDec/0002.html), 2025-10-21).
- **Numbers:** the same as WCAG 2.2.
- **Recently changed:** the 2012 edition (WCAG 2.0) is superseded.
- **Dial:** an alias of WCAG 2.2 AA.

### WCAG 3.0 (W3C AG WG)
- **Status:** Working Draft, 10 Sep 2026 ([TR](https://www.w3.org/TR/wcag-3.0/)). An Editor's Draft followed on 7 Oct 2026 ([ED](https://w3c.github.io/wcag3/guidelines)). The previous Working Draft was 3 Mar 2026 ([WAI news](https://www.w3.org/WAI/news/2026-03-03/wcag3)). Not binding.
- **Contrast:** "Text contrast sufficient (minimum)" is at the *Developing* stage, with "@@[contrast measure to be determined]". The editor's note says the algorithm "is yet to be determined" and "will include a size/weight factor". APCA is not mentioned.
- **Focus and text style:** focus-indicator contrast, size and default-indicator requirements are listed by title only. "Blocks of text readable" and "Text style readable" have values to be determined.
- **Dial:** a placeholder only. Do not ship any thresholds.

### APCA / SAPC (Myndex; ARC, Accessible Reading Technology)
- **Status:** third-party draft, labelled "beta" ([ARC Bronze Simple Mode](https://a11yreadtech.github.io/ARC/tests/bronze-simple-mode), last change 2023-02-10). Not adopted by WCAG 3 (see above). Apple does name APCA as one "popular standard of measure" ([HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), accessed 2026-11-10).
- **Bronze Simple thresholds:**
  - body text: Lc 75 minimum, Lc 90 preferred
  - other content text: Lc 60
  - large text (>36px): Lc 45 minimum, Lc 90 maximum
  - not covered: placeholder, disabled and decorative text, and logos. No non-text value is given.
- **Conflict:** the ARC pages disagree with each other on the large-text cutoff (36px versus 32px). *(Assumption: use 36px.)*
- **Dial:** an optional "future: APCA Bronze" setting. Its maximum contrast cap (Lc 90 for large text) is a rule WCAG does not have.

### ISO 9241-112 / -125 / -171; ISO/IEC 29138; ISO/IEC 30071-1
- **9241-112 (principles for presentation of information):** a **2025** edition (2025-06-04) replaces 2017 ([NSAI](https://shop.standards.ie/en-ie/standards/iso-9241-112-2025-607350_saig_iso_iso_3633770)).
- **9241-125 (visual presentation):** the 2017 edition, confirmed 2022. It has clauses 4.4.1–4.4.2 on character legibility and height ([iTeh](https://standards.iteh.ai/catalog/standards/iso/6f01b865-46f6-45ab-9cdc-eadb10aabe8e/iso-9241-125-2017)). Its numeric values are paywalled and **not verified**.
- **9241-171 (software accessibility):** 2008, with no newer edition found ([DIN listing](https://www.din.de/de/mitwirken/normenausschuesse/naerg/veroeffentlichungen/wdc-beuth:din21:148091717/toc-1859012/download)).
- **29138-1:2018 (user accessibility needs):** a catalogue of user needs that gives "no requirements"; review closed 2024-03-04 ([Genorma](https://genorma.com/en/standards/iso-iec-29138-1-2018)).
- **30071-1:2019 (code of practice):** a process standard, confirmed in 2024 ([BSI](https://knowledge.bsigroup.com/products/information-technology-development-of-user-interface-accessibility-code-of-practice-for-creating-accessible-ict-products-and-services)).
- **All five are guidance.** None adds web contrast or type numbers that could be verified. **Dial:** no separate setting. Cite them as process references only.

### United Nations (Department of Global Communications)
- **Applies to:** UN websites. Mandatory for un.org under ST/AI/2022/2 §3.10 ([un.org/webguidelines](https://www.un.org/en/webguidelines)).
- **Standard:** "WCAG 2.1, level AA, with enhanced contrast for text" ([un.org/webaccessibility](https://www.un.org/en/webaccessibility/), accessed 2026-11-10).
- **Masthead guideline:** **7:1 for regular text and 4.5:1 for large text**, where large text is 24px, or 18.5px bold. Font sizes must be in % or em. Do not remove focus indicators. Colour must not be the only cue, so links are underlined ([masthead](https://www.un.org/en/webaccessibility/guidelines/masthead.html)).
- **Inconsistency:** the footer page says only "3:1" ([footer](https://www.un.org/en/webaccessibility/guidelines/footer.html)).
- **Dial:** "UN". Raise **every text pair to 7:1** (or 4.5:1 for large text), and require relative units.

### ITU, WHO, World Bank, OECD, CERN, ESA
- **ITU:** "aims" for WCAG 2.1 AA ([ITU statement](https://www.itu.int/en/Pages/accessibility.aspx), accessed 2026-11-10).
- **WHO:** no site-wide statement found. Individual WHO pages claim WCAG 2.1 AA ([Learning on TAP](https://www.who.int/teams/health-product-policy-and-standards/assistive-and-medical-technology/assistive-technology/learning-on-tap)). WHO's 2025 RDT guidance asks for **WCAG 2.2 AA** ([PDF](https://cdn.who.int/media/docs/default-source/ncds/sdr/disability/rdt-accessibility-document-v5.0.pdf)).
- **World Bank:** "partially conformant with WCAG 2.1 AA", last updated 2022-09-01 and so stale ([statement](https://www.worldbank.org/en/who-we-are/site-accessibility)). The disability-data site claims partial WCAG 2.2 AA conformance ([statement](https://disabilitydata.worldbank.org/en/site-accessibility)).
- **OECD:** the main page returned 403. The OECD Nuclear Energy Agency targets WCAG 2.1 AA ([NEA](https://oecd-nea.org/jcms/pl_104685/accessibility-statement)).
- **CERN:** aims for WCAG AA ([2023 workshop deck](https://indico.cern.ch/event/1293028/contributions/5439085/attachments/2673040/4634222/presentation_the_future_of_web_accessibility_at_cern.pdf)). The CERN Design Guidelines pages expose no numbers ([site](https://design-guidelines.web.cern.ch/node/144)).
- **ESA:** no statement found, and esa.int/Services/Accessibility returned 404.
- **Dial:** all of these collapse to WCAG 2.1 AA or 2.2 AA. No separate settings are needed.

### Apple Human Interface Guidelines (guidance; App Store review is the only enforcement)
- **Source:** [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) and [Typography](https://developer.apple.com/design/human-interface-guidelines/typography). The Accessibility page's change log runs to 2025-06-09.
- **Contrast:** 4.5:1 up to 17pt, and 3:1 at 18pt or for any bold text. Bold text at **any size** counts as "large", which is looser than WCAG. The HIG asks for a higher-contrast scheme under the Increase Contrast setting.
- **Type sizes:**

  | Platform | Default size | Minimum size |
  |---|---|---|
  | iOS | 17pt | 11pt |
  | macOS | 13pt | 10pt |
  | visionOS | 17pt | 12pt |
  | watchOS | 16pt | 12pt |

  Text should enlarge to 200% (140% on watchOS).
- **Targets:** 44pt by default, 28pt minimum on iOS.
- **Motion:** honour Reduce Motion, and replace slides with fades.

### Google Material 3 (guidance)
- **Contrast** is tone-based, via ContrastCurve(low, normal, medium, high) ([color_spec_2021](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts)):

  | Role | Low | Normal | Medium | High |
  |---|---|---|---|---|
  | onSurface / onPrimary | 4.5 | 7 | 11 | 21 |
  | onSurfaceVariant | 3 | 4.5 | 7 | 11 |
  | outline | 1.5 | 3 | 4.5 | 7 |
  | outlineVariant | 1 | 1 | 3 | 4.5 |

- **New in 2026:** a `color_spec_2026` uses getCurve(9) for onSurface on light, getCurve(11) on dark, getCurve(6) for onPrimary, and getCurve(3) for outline ([source](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2026.ts)). Reading the argument as the "normal" level is *inferred*.
- **Type:** Body Large 16sp, Body Medium 14sp, Body Small 12sp, Label Small **11sp** ([MDC-Android](https://github.com/material-components/material-components-android/blob/master/docs/theming/Typography.md)).

### Microsoft Fluent 2 (guidance)
- **Contrast:** 4.5:1 for text, and 3:1 for large text (18.5px bold or 24px regular) and for UI and icons ([accessibility](https://fluent2.microsoft.design/accessibility), accessed 2026-11-10).
- **Resize and reflow:** reflow at 400% zoom (a 320px wide layout), and 200% text zoom with no clipping.
- **Type ramp:** Body 1 is **14px/20**, Caption 1 is 12px, and **Caption 2 is 10px** ([typography](https://fluent2.microsoft.design/typography)).

### IBM Carbon (guidance)
- **Contrast:** 4.5:1. Large text is defined as **24px regular, or 19px semibold**, and needs 3:1. UI states and boundaries need 3:1. Text over gradients and images must pass "everywhere it appears" ([color a11y](https://carbondesignsystem.com/guidelines/accessibility/color/), updated 2026-09-25).
- **Type:** body-01 is 14/20 with +0.16px tracking. The smallest styles (label, helper and legal) are **12px**, with +0.32px tracking ([type sets](https://carbondesignsystem.com/elements/typography/type-sets/)).

### Atlassian Design System (guidance)
- 4.5:1 for regular text, and 3:1 for large text and graphics. Respect reduced-motion settings. No size numbers are given ([foundations](https://atlassian.design/foundations/accessibility), accessed 2026-11-10).

### Adobe Spectrum (guidance)
- Colour scales are generated with Leonardo from **target contrast ratios**. Tokens meet WCAG minimums, but the page states no numbers and does not mention APCA ([color fundamentals](https://spectrum.adobe.com/page/color-fundamentals/), undated).
- **Dial (inferred):** Frosting's auto-fit is the same method.

## Dial settings

| Profile | Text contrast min | Large-text definition | UI / non-text | Focus rule | Min body px | Min any-text px | Spacing / resize / reflow | Motion | Extra rules |
|---|---|---|---|---|---|---|---|---|---|
| WCAG 2.2 AA (= ISO 40500:2025) | 4.5:1 | ≥24px, or ≥18.66px bold | 3:1 | not hidden (2.4.11) | none | none | 1.4.12 values; 200%; 320px | pause content over 5s | targets 24px |
| WCAG 2.2 AAA | 7:1 | same | 3:1 | 2px perimeter, 3:1 change | none | none | same | disable interaction animation | targets 44px |
| WCAG 3 WD | TBD | TBD (size and weight factor) | TBD | TBD | TBD | TBD | TBD | TBD | placeholder only |
| APCA Bronze (future) | Lc 75 body (90 preferred); Lc 60 other text | >36px gets Lc 45 | not covered | — | — | — | — | — | Lc 90 maximum for large text |
| UN | **7:1** | 24px, or 18.5px bold, gets 4.5:1 | 3:1 (WCAG 2.1) | never remove the focus indicator | none | none | % or em only; 2.1 AA | 2.1 AA | links underlined |
| ITU / WHO / World Bank / OECD / CERN | 4.5:1 | WCAG | 3:1 | WCAG 2.1 AA | none | none | WCAG | WCAG | none |
| Apple HIG | 4.5:1 | ≥18pt, **or bold at any size** | — | — | 17pt (iOS) | 11pt (iOS) | 200% | Reduce Motion | Increase Contrast scheme; targets 44pt |
| Material 3 | 4.5 / 7 / 11 by contrast level | WCAG | outline at 3:1 (normal) | — | 16 (Body Large) | 11 | — | — | tone curves |
| Fluent 2 | 4.5:1 | 24px, or 18.5px bold | 3:1 | — | 14 | **10** | 200% text; 400% reflow | — | — |
| Carbon | 4.5:1 | 24px, or **19px semibold** | 3:1 | — | 14 | 12 | — | — | gradient text must pass everywhere |
| Atlassian | 4.5:1 | WCAG | 3:1 | — | — | — | — | reduced motion | — |
| Spectrum | WCAG | WCAG | WCAG | — | — | — | — | — | contrast-generated scales |

## Conflicts and gaps against Fournée's current defaults
Fournée's defaults were read from `frosting/tokens.json` and `fontdant/type-tokens.json`.

1. **Muted and accent text at 4.5:1 fail the UN profile.** The UN needs 7:1 for all regular text. Frosting enforces 7:1 only for `text`.
2. **No border/control contrast contract.** `control-border` is derived at 50% muted and never checked. WCAG 1.4.11 needs 3:1 on input boundaries, and Carbon and Material's outline do too.
3. **No focus-ring role or check.** Add a focus colour checked at 3:1 against adjacent colours, plus 3:1 between focused and unfocused states, for AAA and 2.4.13.
4. **Large-text exemption is unmodelled.** Each profile defines it differently: Apple counts any bold, Carbon uses 19px semibold, and WCAG uses 18.66px bold. Frosting has no size input, so the dial needs a contrast check that knows the role's size, linked to Fontdant.
5. **Fontdant floors are stricter than every big-tech profile.** Fluent has a 10px caption, Apple and Material an 11px minimum, and Fluent and Carbon a 14px body. Fontdant's Dense mode already allows a 14px body. The dial can loosen floors per profile, but WCAG itself has none.
6. **Text spacing check is narrower than 1.4.12.** T3 covers leading of 1.5 and T16 paragraph spacing. The letter 0.12em and word 0.16em overrides are only checked when rendered (T13).
7. **Gradients:** only Carbon has a rule ("pass everywhere"). Check the worst stop of the gradient, not its average *(inferred)*.
8. **APCA:** no dial thresholds for non-text, and a maximum-contrast cap exists. Keep it opt-in and label it as not a legal standard.
9. **Pending:** WCAG 3's contrast metric and ISO DIS 40500 (the late-2024 WCAG 2.2 text).
