# UK and EU accessibility standards: profiles for the Fournée standards dial

Researched 2026-11-10. Sources fetched this session unless marked *(not re-fetched)*. "Inferred" marks my own reasoning.

## Summary
1. Almost everything in the EU and UK resolves to **WCAG AA**. The UK public sector is already on **WCAG 2.2 AA** (monitored since Oct 2024). The EU is still on **EN 301 549 V3.2.1 (WCAG 2.1 AA)**.
2. **EN 301 549 V4.1.1 (WCAG 2.2 AA)** was published on 2 Sep 2026 but is **not yet harmonised**. Expected Official Journal (OJEU) citation dates conflict: 16 Dec 2026 (NDA) and 22 Jan 2027 (Deque, revised). The dial should offer it as a "pending" preset.
3. The **EAA** has applied to private-sector products and services since **28 Jun 2025**. Microenterprises providing services are exempt. National laws (DE BFSG, FR, ES Ley 11/2023, IT) add fines but keep the same technical standard.
4. The only binding colour/type rules beyond WCAG are the EAA's vague "fonts of adequate size and suitable shape… sufficient contrast… adjustable spacing", plus design-system conventions: GOV.UK 19px body, a yellow focus ring, a 3px focus width.
5. Biggest dial impact: add **target size 24px (2.5.8)** and **focus-not-obscured (2.4.11)**. Make the Fontdant "dense" 14px body opt-in only for GOV.UK/NHS presets, and treat the measure cap (1.4.8) as AAA guidance, not law.

## Shared baseline: WCAG 2.2 numbers
Source: [WCAG 2.2, W3C Rec, 2023-10-05](https://www.w3.org/TR/WCAG22/) *(not re-fetched; values are standard)*. Also ISO/IEC 40500:2025 ([W3C, 2025-10-21](https://www.w3.org/WAI/news/2025-10-21/wcag22-iso)).
- 1.4.3 text contrast **4.5:1**, large text **3:1**. Large text = ≥18pt (24px) regular or ≥14pt (≈18.66px) bold.
- 1.4.6 (AAA): 7:1 / 4.5:1.
- 1.4.11 UI and graphics contrast **3:1**.
- 1.4.1 colour must not be the only means of conveying information.
- 1.4.4 text resizes to **200%**; 1.4.10 reflow at **320 CSS px**.
- 1.4.12 text spacing must survive line height **1.5×**, paragraph spacing **2×**, letter spacing **0.12em**, word spacing **0.16em**.
- 2.4.11 Focus Not Obscured (AA). 2.4.13 Focus Appearance (AAA): an area ≥ a **2px perimeter** with a **3:1** change of state.
- 2.5.8 targets **24×24 CSS px** (AA).
- 2.3.1 no more than **3 flashes** per second (A); 2.3.3 animation from interactions can be disabled (AAA).
- WCAG 2.1 lacks 2.4.11, 2.4.13 and 2.5.8.

## Profiles

### EU — European Accessibility Act (Directive 2019/882)
- **Who:** private economic operators supplying listed products and services to consumers (e-commerce, banking, e-books, transport, telecoms). Microenterprises are defined as <10 staff and ≤€2M turnover or balance sheet ([EUR-Lex, Art 3(23), 4(5)](https://eur-lex.europa.eu/eli/dir/2019/882/oj)). Those providing services are **exempt**; those making products are not.
- **Status:** law, applied from **28 Jun 2025**. Existing service contracts may continue to 2030; self-service terminals may stay in use to the end of their life, max 20 years. Penalties are set nationally and must be "effective, proportionate and dissuasive" (Art 30).
- **Standard:** presumption of conformity via harmonised standards (Art 15) = EN 301 549 V3.2.1 today *(inferred from the NDA/Deque reports below)*.
- **Beyond WCAG:** Annex I §I 1(a)(iv), §III (b)(v) require information "presented in fonts of adequate size and suitable shape… using sufficient contrast, as well as adjustable spacing between letters, lines and paragraphs" ([EUR-Lex](https://eur-lex.europa.eu/eli/dir/2019/882/oj)). There are no numbers.
- **Dial:** WCAG 2.1 AA. Also require that letter, line and paragraph spacing is user-adjustable, as with 1.4.12.

### EU — Web Accessibility Directive (2016/2102)
- **Who:** public-sector bodies' websites and apps. Public broadcasters are exempt, and so are schools and NGOs for non-essential content.
- **Status:** law. Websites from 23 Sep 2019/2020; apps from 23 Jun 2021 ([EUR-Lex](https://eur-lex.europa.eu/eli/dir/2016/2102/oj) *(not re-fetched)*). Enforcement is national, through monitoring plus a complaints procedure.
- **Standard:** EN 301 549 V3.2.1 = WCAG 2.1 AA, cited by Implementing Decision (EU) 2021/1339 *(not re-fetched)*.
- **Dial:** WCAG 2.1 AA.

### EN 301 549 (ETSI/CEN/CENELEC)
- **V3.2.1 (2021):** WCAG 2.1 AA, plus extras. Clause 11.7 makes software follow the platform's user preferences for colour, contrast and font *(not re-fetched)*. This is relevant to the forced-colours and prefers-contrast handling.
- **V4.1.1:** **published 2 Sep 2026**, WCAG 2.2 AA baseline, reworked user-preferences clause, new EAA mapping annex ([NDA](https://nda.ie/news/en301549-published); [Deque, 2026-09-08](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/)).
- **Pending:** OJEU citation. NDA says 16 Dec 2026; Deque revised to 22 Jan 2027. No Commission confirmation found. V3.2.1 "remains in force" until then (NDA).
- **Dial:** two presets, `en301549-v3` (WCAG 2.1 AA) and `en301549-v4` (WCAG 2.2 AA, flagged "pending harmonisation").

### UK — Public Sector Bodies Accessibility Regulations 2018 + Equality Act 2010
- **Who:** public-sector websites and apps. Schools and nurseries are partially exempt. Charities are exempt unless mostly publicly funded. Public broadcasters are exempt. A disproportionate-burden claim needs an assessment.
- **Status:** law. Required standard is **WCAG 2.2 AA** ([GOV.UK, updated 2024-09-30](https://www.gov.uk/guidance/accessibility-requirements-for-public-sector-websites-and-apps)). GDS has monitored against WCAG 2.2 **from Oct 2024** ([GDS blog, 2024-01-11](https://accessibility.blog.gov.uk/2024/01/11/get-to-wcag-2-2-faster-with-the-gov-uk-design-system); [monitoring report](https://www.gov.uk/government/publications/accessibility-monitoring-of-public-sector-websites-and-mobile-apps-from-2022-to-2024/accessibility-monitoring-of-public-sector-websites-and-mobile-apps-from-2022-to-2024)). EHRC (GB) and ECNI (NI) enforce through investigations, unlawful act notices and court action.
- **Equality Act 2010:** covers all service providers. It is a duty to make reasonable adjustments, with no technical standard named *(not re-fetched)*.
- **Dial:** WCAG 2.2 AA.

### UK — GOV.UK Design System / Service Manual (guidance; de facto for central government)
- **Type:** body **19px/25px** at all widths; `body-s` 16/20. Headings 48/36/24/19 on desktop, 32/27/21/19 on mobile. The smallest size on the scale is **16px** ([type scale](https://design-system.service.gov.uk/styles/type-scale/)). Output uses relative units. Typeface: "New Transport" (the GOV.UK brand font).
- **Colour:** text `#0b0c0c`, link `#1a65a6`, error `#ca3535`, success `#0f7a52`, focus `#ffdd00`. "Always use the GOV.UK colour palette." 1.4.3 AA applies ([colour](https://design-system.service.gov.uk/styles/colour/)). **Recently changed:** the brand refresh started June 2025, and Frontend v6.0.0 (Feb 2026) moved to the new web palette ([What's new](https://design-system.service.gov.uk/community/whats-new); [v6 changes](https://frontend.design-system.service.gov.uk/changes-to-govuk-frontend-v6)).
- **Focus:** links get a yellow background with a thick black bottom border. Inputs get a yellow outline with a thickened black border, meeting 1.4.11 on any GOV.UK background ([focus states](https://design-system.service.gov.uk/get-started/focus-states/)). `$govuk-focus-width: 3px`; form border 2px ([source](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_measurements.scss)).

### UK — NHS digital service manual (guidance)
- Frutiger with an Arial fallback. Body **19px desktop / 16px mobile**; `body-s` drops to **14px on mobile**. Scale runs 14–64px ([typography](https://service-manual.nhs.uk/design-system/styles/typography)).
- Colours: text `#212b32`, link `#005eb8`, focus `#ffeb3b` with `#212b32` text. AA 4.5/3:1, and it aims for **AAA "as far as possible"**. "Don't rely on colour alone." The border colour `#d8dde0` is admitted to be low-contrast ([colour](https://service-manual.nhs.uk/design-system/styles/colour)).

### Germany — BFSG (EAA) and BITV 2.0 (WAD)
- **BFSG:** private sector, in force **28 Jun 2025**. Microenterprises providing services are exempt (<10 staff, ≤€2M) ([IHK](https://www.ihk.de/cottbus/innovation-und-nachhaltigkeit/innovation-und-digitalisierung/bfsg-6492896)). Fines up to **€100,000**, or €10,000 for other breaches ([§37 BFSG](https://www.gesetze-im-internet.de/bfsg/__37.html)).
- **BITV 2.0** (public, 2019 version) references EN 301 549 V3.2.1. No amendment was found as of a June 2026 audit report ([BIK report](https://report.bitvtest.de/8d3097d4-4db0-4f6f-ad31-0a2bc4056e37.pdf)).
- **Dial:** WCAG 2.1 AA via EN 301 549.

### France — RGAA 4.1.2; EAA transposition
- Law of 9 Mar 2023 + Décret 2023-931 (9 Oct 2023), applying from 28 Jun 2025. Arcom sanctions are reported at **€50,000** (accessibility) / **€25,000** (declarations), renewable ([Scroll](https://agence-scroll.com/blog/accessibilite-numerique-obligations-entreprises), secondary source). A Décret 2026-816 (24 Aug 2026) reportedly moved the sanction provisions. **Unverified.**
- **RGAA 4.1.2** = WCAG 2.1 AA. **RGAA 5** (WCAG 2.2) is expected **end 2026** but is not published ([LPALaw, Apr 2026](https://www.lpalaw.com/wp-content/uploads/2026/04/Editions-Multimedia-x-LPALaw.pdf)).

### Italy — Legge Stanca / AgID guidelines
- Covers the public sector, plus private firms with an average 3-year turnover of **>€500M**. Fines up to **5% of turnover**. Operating guidelines for the EAA extension arrived Mar 2026, and no fines had been issued as of May 2026 ([Agenda Digitale](https://www.agendadigitale.eu/?p=266343)).
- The technical reference is still **WCAG 2.1 AA / EN 301 549:2021**. It updates automatically when a new version is harmonised ([AgID guidelines](https://docs.italia.it/projects/lg-accessibilita-docs/downloads/epub/stabile)).

### Spain — RD 1112/2018 (public) and Ley 11/2023 (EAA)
- Ley 11/2023 transposes the EAA from 28 Jun 2025. The standard is UNE-EN 301 549 (WCAG 2.1 AA). Very-serious fines are cited as **€600k or €1M**; the sources conflict and the BOE was not checked ([Level Access, Jan 2026](https://www.levelaccess.com/wp-content/uploads/2026/01/Spains-Digital-Accessibility-Laws.pdf); [Fieldfisher](https://www.fieldfisher.com/es-es/locations/espana/actualidad/accesibilidad-obligatoria-claves-de-la-transposicion-accesibility-act)). RD 1112/2018 transposes the WAD *(not re-fetched)*.

### Norway — IKT-forskriften (FOR-2013-06-21-732)
- Covers the **private and public sector** (websites, apps, kiosks) ([Uutilsynet, mod. 2026-02-03](https://www.uutilsynet.no/english/regulations/278)).
- **Private sector:** WCAG 2.0 AA, only **35 of 61** criteria ([Skatteetaten](https://www.skatteetaten.no/en/stilogtone/god-praksis/universell-utforming/krav-og-standarder/)).
- **Public sector:** WCAG 2.1 AA via the WAD, extended from 1 Feb 2023.
- Daily fines are used, e.g. **NOK 50,000/day** (Dec 2025, secondary source: [UsableNet](https://blog.usablenet.com/norways-helsami-case-daily-accessibility-fines-and-eaa-era-compliance)). EAA transposition into Norwegian law was not confirmed.

## Dial settings

| Profile | Text contrast min | Large-text definition | UI/non-text contrast | Focus rule | Min body px | Min any-text px | Spacing/resize/reflow | Motion | Extra rules |
|---|---|---|---|---|---|---|---|---|---|
| EAA (EN 301 549 V3.2.1) | 4.5:1 | ≥24px / ≥18.66px bold, 3:1 | 3:1 | Visible (2.4.7) | none (law) | none | 1.4.12 / 200% / 320px | 2.3.1 | Annex I "adequate size, suitable shape, adjustable spacing"; follow OS prefs (11.7) |
| WAD | 4.5:1 | same | 3:1 | 2.4.7 | none | none | same | 2.3.1 | Accessibility statement |
| EN 301 549 V4.1.1 (pending) | 4.5:1 | same | 3:1 | 2.4.7 + 2.4.11 not obscured | none | none | same + 2.5.8 24px targets | 2.3.1 | Reworked user-preference clause |
| UK PSBAR | 4.5:1 | same | 3:1 | 2.4.7 + 2.4.11 | none | none | same + 24px targets | 2.3.1 | Accessibility statement |
| GOV.UK DS | 4.5:1 | same | 3:1 | Yellow `#ffdd00` + black, 3px | 19 | 16 | Relative units | 2.3.1 | GOV.UK palette only; New Transport |
| NHS DS | 4.5:1 (aim 7:1) | same | 3:1 (aim 4.5:1) | Yellow `#ffeb3b` + black | 19 desktop / 16 mobile | 14 | Relative units | 2.3.1 | Frutiger/Arial; AAA where possible |
| DE BFSG / BITV 2.0 | 4.5:1 | same | 3:1 | 2.4.7 | none | none | 1.4.12 / 200% / 320px | 2.3.1 | EN 301 549 extras |
| FR RGAA 4.1.2 | 4.5:1 | same | 3:1 | 2.4.7 | none | none | same | 2.3.1 | RGAA test methodology; RGAA 5 (2.2) pending |
| IT AgID | 4.5:1 | same | 3:1 | 2.4.7 | none | none | same | 2.3.1 | Private scope only >€500M turnover |
| ES Ley 11/2023 / RD 1112 | 4.5:1 | same | 3:1 | 2.4.7 | none | none | same | 2.3.1 | UNE-EN 301 549 |
| NO private | 4.5:1 | same | 3:1 (1.4.11 not in 2.0) — off | 2.4.7 | none | none | 1.4.4 only (1.4.10/1.4.12 not in 2.0) | 2.3.1 | 35 of 61 WCAG 2.0 criteria |
| NO public | as WAD | | | | | | | | |

## Conflicts and gaps against current Fournée defaults
1. **Target size (2.5.8, 24px) is not checked** by either engine. It is needed for UK PSBAR now and for EN 301 549 V4 soon. A Fontdant `ui` role check or a new Frosting/kitchen check is required *(inferred)*.
2. **Focus:** Frosting has no focus-ring role check. Add 3:1 against adjacent colours (1.4.11), an optional 2px/3:1 test (2.4.13 AAA), and GOV.UK/NHS presets that pin yellow-plus-black focus tokens. These presets conflict with Frosting's rule of auto-fitting the accent colour.
3. **Fontdant "dense" mode body = 14px.** That is legal under every profile (no law sets a px floor), but it falls below GOV.UK 19px and NHS 19/16px. Those presets need floors of body 19, any 16 (GOV.UK) or any 14 (NHS mobile).
4. **The 12px any-text floor** is stricter than any law, which sets none. It is looser than GOV.UK (16) and NHS (14). Keep it as the Fournée default.
5. **Measure max 80 (T4) is cited as WCAG 1.4.8**, which is AAA and not required by any profile here. Relabel it as "guidance" in law-only presets.
6. **Gradient fills:** 1.4.3/1.4.11 must hold at the worst-contrast point of the gradient. No profile gives a gradient-specific rule *(inferred)*.
7. **Norway private (WCAG 2.0 subset)** is the only profile looser than Fournée's defaults. The dial should never *loosen* below Fournée's baseline, only label it.
8. **Unverified or pending items to recheck:**
   - EN 301 549 V4 OJEU citation date (Dec 2026 vs Jan 2027)
   - RGAA 5 publication
   - French Décret 2026-816
   - Spanish fine ceilings
   - Norway's WCAG 2.1 update for the private sector and its EAA transposition
