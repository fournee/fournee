# North America: accessibility standards for the Fournée standards dial

Researched 2026-11-10. Sources accessed 2026-11-10; the date after each link is the source's own date.

## Summary
1. No North American law sets a minimum font size or names a typeface. Type rules come only from design systems: USWDS sets a 16px body, and GC Design System sets a 20px body with 18px small text.
2. The legal text baselines are WCAG 2.0 AA (Section 508, AODA, California state agencies, and the TBS transition floor) or WCAG 2.1 AA (ADA Title II, Colorado, Manitoba, Quebec, and CAN/ASC-EN 301 549:2024). Only Quebec pulls in WCAG 2.2 criteria: 2.4.11, 2.5.8, and the AAA 2.4.13.
3. Changes in 2026: DOJ pushed the Title II deadlines back one year, to April 2027 and April 2028. Canada rescinded the TBS Standard on Web Accessibility (2026-03-12), and the Accessible Canada Regulations ICT amendments take effect on 2027-12-05 and 2028-12-05.
4. A WCAG 2.0 profile drops 1.4.10, 1.4.11 and 1.4.12, so Frosting's UI-contrast check would become advisory under those profiles.
5. No standard covers forced colours or gradients, and no standard sets a 12px floor. Those Fournée checks stay as house rules under every profile.

## WCAG reference numbers (W3C)
These come from [WCAG 2.2](https://www.w3.org/TR/WCAG22/) (Rec. 2023-10-05, updated 2024-12-12) and apply in every row below unless a row says otherwise.
- 1.4.3: text contrast 4.5:1. Large text needs 3:1, where large means at least 18pt (24px), or at least 14pt (about 18.66px) bold.
- 1.4.11: UI and graphics contrast 3:1 (added in 2.1).
- 1.4.1: colour must not be the only way information is shown.
- 1.4.4: text resizes to 200%.
- 1.4.10: reflow at 320 CSS px (2.1).
- 1.4.12: text spacing must survive line-height 1.5, paragraph spacing 2× the font size, letter spacing 0.12em and word spacing 0.16em (2.1).
- 2.4.7: focus is visible.
- 2.4.11: focus is not obscured (2.2, AA).
- 2.4.13: focus appearance (2.2, AAA). The indicator area must be at least a 2px perimeter, with a 3:1 change of contrast.
- 2.5.8: targets of at least 24×24px (2.2, AA).
- 2.3.1: no more than 3 flashes.
- 2.3.3: animation from interactions (AAA).

---

## United States

### ADA Title II web rule (28 CFR 35.200)
- **Who must comply:** state and local governments.
- **Status:** law. The final rule was published 2024-04-24. A DOJ interim final rule, effective [2026-04-20](https://www.federalregister.gov/documents/2026/04/20/2026-07663/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web), moved the compliance dates:
  - population of 50k or more: 2026-04-24 becomes **2027-04-26**
  - under 50k, and special districts: 2027-04-26 becomes **2028-04-26**
  - Comments closed 2026-06-22.
- **Changed in 2026:** HHS made a matching Section 504 delay ([2026-05-11](https://www.federalregister.gov/documents/2026/05/11/2026-09266/extension-of-compliance-dates-for-nondiscrimination-on-the-basis-of-disability-accessibility-of-web)) to 2027-05-11 and 2028-05-10.
- **Pending:**
  - A lawsuit challenging the delay was reported in May 2026 ([pulse.bot](https://www.pulse.bot/legal/news/disability-advocates-sue-over-website-accessibility-delays-69fec763-9e9e-4720-a0d4-1a5496edac47/), secondary source, outcome unknown).
  - DOJ said it may re-examine the ADA regulations ([Mondaq 2026](https://www.mondaq.com/unitedstates/media-entertainment-law/1782220/doj-extends-ada-title-ii-digital-accessibility-deadlines-by-one-year)).
- **Enforcement:** DOJ enforcement and private suits.
- **Technical standard:** **WCAG 2.1 AA**, unchanged by the interim final rule.
- **Dial:** WCAG 2.1 AA. Frosting's 1.4.11 and Fontdant's reflow and spacing checks are mandatory.

### ADA Title III (private businesses)
- **Status:** case law only. DOJ withdrew its Title III web rulemaking (2017). The federal circuits remain split on whether a website alone counts as a "place of public accommodation" ([Seyfarth](https://www.seyfarth.com/publications/ADA122217), 2017; [Mondaq 2026 outlook](https://www.mondaq.com/unitedstates/discrimination-disability-sexual-harassment/1756190/2026-crystal-ball-what-to-expect-in-the-ada-title-iii-universe-this-year)).
- **Lawsuits:** more than 3,100 federal web suits were filed in 2025 (vendor count, secondary source).
- **De facto standard:** settlements usually name WCAG 2.1 AA *(inferred)*.
- **Dial:** a "US private" profile set to WCAG 2.1 AA, marked as guidance.

### Section 508 (36 CFR 1194, the 2017 "refresh")
- **Who must comply:** federal agencies' ICT and federal procurement.
- **Status:** law since [2018-01-18](https://www.section508.gov/manage/laws-and-policies/). I found no 2024–2026 rulemaking to move it to WCAG 2.1 or 2.2 (searched; gap).
- **Technical standard:** **WCAG 2.0 AA**, which has no 1.4.10, 1.4.11, 1.4.12 or 2.5.8.
- **Dial:** WCAG 2.0 AA. Under this profile, UI contrast, reflow and spacing are advisory.

### 21st Century IDEA (2018), OMB M-23-22 and USWDS
- **Status:**
  - IDEA §3(e) requires federal public websites to follow the TTS website standards, meaning USWDS ([digital.gov](https://digital.gov/resources/delivering-digital-first-public-experience), 2023).
  - [M-23-22](https://www.whitehouse.gov/wp-content/uploads/2023/09/M-23-22-Delivering-a-Digital-First-Public-Experience.pdf) (2023-09-22) adds more than 100 requirements.
  - **Changed:** [EO 14338](https://www.whitehouse.gov/fact-sheets/2025/08/fact-sheet-president-donald-j-trump-improves-our-nation-through-better-design/) (2025-08-21) created a National Design Studio and directed GSA to update USWDS, with initial results due 2026-07-04. I did not confirm whether M-23-22 is still in force.
- **USWDS colour** ([tokens](https://designsystem.digital.gov/design-tokens/color/overview/), updated 2022-06-03): colours sit on a grade scale from 0 (white) to 100 (black). The "magic number" is the difference in grade between two colours:
  - 40 or more: AA large text (3:1)
  - 50 or more: AA (4.5:1)
  - 70 or more: AAA (7:1)
  - Grade 50 passes AA against both pure white and pure black.
- **USWDS type** ([typography](https://designsystem.digital.gov/components/typography/)):
  - body at least 16px
  - line-height at least 1.5 for long text
  - measure of 45–90 characters, with a target of 66
  - Public Sans, Source Sans Pro, Merriweather and Roboto Mono
  - flush left, never justified
  - looser tracking at small sizes
- **Dial:** add a "grade" or magic-number mode to Frosting. Fontdant's 16px body and line-height bands already match USWDS.

### NASA
- **Status:** guidance. NASA is bound by Section 508.
- **Horizon Design System:** NASA's HDS is described as tested accessible, with custom colours targeting WCAG AA ([Terra UI docs](https://terra-ui.netlify.app/horizon-design-system), undated). It uses three type families ([NASA brand](https://www.nasa.gov/nasa-brand-center/brand-guidelines)).
- **Older system:** the earlier [NASAWDS](https://github.com/nasa/nasawds) is USWDS with Helvetica headings.
- No numeric rules beyond USWDS were found.
- **Dial:** same as Section 508, plus USWDS.

### California
- **Who must comply:** state agencies.
- **Status:** law. [Gov. Code 11546.7](https://california.public.law/codes/government_code_section_11546.7) (AB 434, 2017) has applied since 2019-07-01: every 2 years the agency's home page must certify **WCAG 2.0 AA** plus Section 508.
- **Pending:** AB 1757, which would have required WCAG 2.1 AA for private sites under the Unruh Act, stalled in the 2023–24 session ([LegiScan](https://legiscan.com/CA/text/AB1757/id/2832496)). I found no 2025–26 revival.
- **Dial:** WCAG 2.0 AA.

### Colorado (HB21-1110, SB23-244, HB24-1454; 8 CCR 1501-11)
- **Who must comply:** state and local government.
- **Status:** law. HB24-1454 moved the deadline to **2025-07-01**.
- **Changed:** OIT amended the rules effective 2025-06-30. The amendment added "compliance options" and exemptions (8 CCR 1501-11.5 and 11.7), with an emphasis on progress over strict conformance ([CIRSA](https://www.cirsa.org/wp-content/uploads/2025/05/CIRSA-Blog_Compliance-with-Tech-Accessibility-Standards.pdf), 2025-05; [HCPF](https://hcpf.colorado.gov/accessibility-progress-report)).
- **Penalties:** injunctions, actual damages, or $3,500 per violation per plaintiff ([C.R.S. 24-34-802](https://codes.findlaw.com/co/title-24-government-state/co-rev-st-sect-24-34-802/)).
- **Technical standard:** **WCAG 2.1 AA**.
- **Not verified:** the official OIT plain-language page returned HTTP 403.
- **Dial:** WCAG 2.1 AA.

---

## Canada

### Accessible Canada Act and the Accessible Canada Regulations ICT amendments ("Digital Technologies Phase 1")
- **Who must comply:** federal public sector, plus federally regulated private organisations with 100 or more employees. Organisations with 99 or fewer are exempt.
- **Status:** law. Published [2025-12-17](https://www.canada.ca/en/employment-social-development/programs/accessible-canada-regulations-guidance/digital-technologies-phase-1.html).
- **Deadlines:**
  - new or updated web pages: public sector **2027-12-05**, private **2028-12-05**
  - documents and mobile apps: 2028-12-05
- **Penalties:** breaches are "minor violations", enforced through administrative monetary penalties by the Accessibility Commissioner.
- **Technical standard:** [CAN/ASC-EN 301 549:2024](https://scc-ccn.ca/standardsdb/standards/4033458), which is EN 301 549 v3.2.1 (2021) adopted identically. It applies clauses 4–7 and 9 to the web. Clause 9 is **WCAG 2.1 AA** *(inferred from EN v3.2.1)*.
- **Dial:** WCAG 2.1 AA. Note the extra EN requirement 11.7, that apps respect user preferences such as text size and colours *(inferred)*.

### Treasury Board Standard on Web Accessibility
- **Status:** **rescinded 2026-03-12** ([TBS direction](https://www.canada.ca/en/government/system/digital-government/policies-standards/policy-service-digital-announcements/direction-information-communication-technologies-accessibility-towards-regulatory-implementation.html)).
- **Transition rules:** departments must hold a **WCAG 2.0 AA** floor until the Accessible Canada Regulations dates, and are told to adopt CAN/ASC-EN 301 549.
- **GC Design System** ([typography](https://design-system.canada.ca/en/foundations/typography), 2026-11-02):
  - body 1.25rem (**20px**) with line-height 160%
  - small text 1.13rem (about 18px) with line-height 155%
  - Lato for headings, Noto Sans for body, Noto Sans Mono for code
  - maximum line length **65ch**
  - Colour: components meet WCAG 2.1 AA, and semantic tokens are required ([colour](https://design-system.alpha.canada.ca/en/styles/colour)).
- **Dial:** a "GC" profile with a 20px body, an 18px floor and a 65ch cap.

### Ontario AODA (O. Reg. 191/11 IASR, s.14)
- **Who must comply:** public sector, plus private organisations with 50 or more employees.
- **Status:** law. **WCAG 2.0 AA** has been required since 2021-01-01, excluding 1.2.4 and 1.2.5 ([ontario.ca](https://ontario.ca/page/how-make-websites-accessible)).
- **Penalties:** prosecution fines of up to $100k per day for corporations and $50k per day for individuals. Administrative penalties run up to $15k (secondary sources, [BOIA](https://www.boia.org/blog/aoda-non-compliance-financial-penalties-overview)). e-Laws did not render, so this is unverified.
- **Pending:** no move to WCAG 2.1 was found.
- **Dial:** WCAG 2.0 AA.

### Quebec SGQRI 008 3.0
- **Who must comply:** public bodies under G-1.03.
- **Status:** law. Effective **2024-04-29**, and it replaced 2.0, which was WCAG 2.0 ([quebec.ca](https://www.quebec.ca/gouvernement/ministeres-organismes/cybersecurite-numerique/publications/standard-accessibilite-sites-web), page updated 2026-06-08).
- **Technical standard:** **WCAG 2.1 A and AA**, minus 1.2.4 and 1.2.5. It adds:
  - from WCAG 2.2: 3.2.6, 3.3.7, **2.4.11**, 2.5.7, **2.5.8 (24px)**, and the AAA **2.4.13 focus appearance**
  - from WCAG 2.1 AAA: 2.3.2 (no flashes at all), 3.1.4 (abbreviations) and 2.5.6 (concurrent input)
- **Dial:** this is the strictest profile in the region. It requires a 2.4.13 focus-ring check (2px perimeter at 3:1), a 24px target check, and a zero-flash motion rule.

### Manitoba AMA (Accessible Information and Communication Standard, M.R. 47/2022)
- **Status:** law. The public sector has been covered since 2022-05-01. Businesses and non-profits must comply from **2025-05-01** ([Accessibility MB](https://accessibilitymb.ca/public-sector/accessibility-for-public-sector.html); [RCC](https://www.retailcouncil.org/province-mandates-web-accessibility-compliance-required-by-may-1-2025/)).
- **Technical standard:** **WCAG 2.1 AA** for websites, applying to the public sector, large municipalities and education. What private organisations must do differs (unverified).
- **Dial:** WCAG 2.1 AA.

### British Columbia (Accessible B.C. Act, 2021)
- **Status:** the Act is a framework only. No technical web regulation was found. Private-sector standards are expected after late 2026 (vendor source, unverified).
- **Government web standards** ([gov.bc.ca](https://www2.gov.bc.ca/gov/content/governments/services-for-government/service-experience-digital-delivery/web-content-development-guides/web-standards), updated 2026-09-15), which are policy:
  - the "most current WCAG, Level AA" (so WCAG 2.2 *(inferred)*)
  - plain language at a **Grade 8** reading level or lower
- **Dial:** WCAG 2.2 AA, plus a readability flag that is out of scope for Fontdant.

---

## Dial settings

All contrast ratios are WCAG ratios.

| Profile | Text contrast min | Large-text definition | UI/non-text contrast | Focus rule | Min body px | Min any-text px | Spacing/resize/reflow | Motion | Extra rules |
|---|---|---|---|---|---|---|---|---|---|
| ADA Title II | 4.5:1 | ≥24px, or ≥18.66px bold | 3:1 | 2.4.7 visible | none | none | 200% resize, 320px reflow, 1.4.12 | 2.3.1 (3 flashes) | Deadlines 2027-04-26 and 2028-04-26 |
| ADA Title III (case law) | 4.5:1 | same | 3:1 | 2.4.7 | none | none | 2.1 set | 2.3.1 | Guidance only, de facto 2.1 AA |
| Section 508 | 4.5:1 | same | not required (2.0) | 2.4.7 | none | none | 200% resize only | 2.3.1 | WCAG 2.0 |
| USWDS / IDEA | 4.5:1 (magic number 50) | magic number 40 = 3:1 | 3:1 *(inferred)* | 2.4.7 | 16 | none stated | line-height ≥1.5, measure 45–90ch | 2.3.1 | Grade system; flush left; Public Sans |
| NASA | as 508 + USWDS | same | as USWDS | 2.4.7 | 16 (USWDS) | none | as USWDS | 2.3.1 | Horizon tokens |
| California (state) | 4.5:1 | same | not required (2.0) | 2.4.7 | none | none | 200% resize | 2.3.1 | Home-page certification |
| Colorado | 4.5:1 | same | 3:1 | 2.4.7 | none | none | 2.1 set | 2.3.1 | $3,500 per violation |
| Canada ACA/ACR | 4.5:1 | same | 3:1 | 2.4.7 | none | none | 2.1 set | 2.3.1 | EN 301 549 clause 11 user preferences |
| TBS (transition) | 4.5:1 | same | not required (2.0 floor) | 2.4.7 | none | none | 200% | 2.3.1 | Rescinded 2026-03-12 |
| GC Design System | 4.5:1 | same | 3:1 | 2.4.7 | 20 | 18 | line-height 1.55–1.6, ≤65ch | 2.3.1 | Lato / Noto Sans |
| Ontario AODA | 4.5:1 | same | not required (2.0) | 2.4.7 | none | none | 200% | 2.3.1 | Applies to private orgs with ≥50 staff |
| Quebec SGQRI 008 3.0 | 4.5:1 | same | 3:1 | 2.4.11 + **2.4.13** (2px, 3:1) | none | none | 2.1 set | **2.3.2 zero flashes** | 2.5.8 24px targets, 3.1.4 |
| Manitoba AMA | 4.5:1 | same | 3:1 | 2.4.7 | none | none | 2.1 set | 2.3.1 | none |
| BC (government policy) | 4.5:1 | same | 3:1 | 2.4.11 *(inferred, 2.2)* | none | none | 2.1 set | 2.3.1 | Grade 8 plain language |

## Conflicts and gaps against current Frosting and Fontdant defaults
1. **WCAG 2.0 profiles** (Section 508, AODA, California, TBS) do not require 1.4.11, 1.4.10 or 1.4.12. The dial should show those checks as "advisory", not "fail".
2. **Quebec needs checks Fournée lacks:**
   - 2.4.13 focus appearance: a 2px perimeter, with 3:1 contrast between the focused and unfocused states. Frosting checks pairs, not state change.
   - 2.5.8 24×24px targets.
   - 2.3.2, zero flashes.
3. **GC Design System is stricter on type than Fontdant:** a 20px body versus Fontdant's 16px, an 18px floor versus its 12px, a 65ch cap, and line-height 1.55–1.6.
4. **USWDS's magic-number grades** are a different model from ratio checks. The dial needs a grade-mapping mode so Frosting output can carry USWDS token names.
5. **Forced colours, prefers-contrast and gradients** are not addressed by any law here. EN 301 549 clause 11.7 (user preferences) is the closest *(inferred)*. Text on gradients needs a worst-stop contrast rule (house rule).
6. **Fontdant's 12px floor and 16px body** have no legal basis in North America; only design systems set them. Keep them as house defaults and label them "guidance".
7. **Things still moving:**
   - Title II dates, with a pending lawsuit and possible DOJ revision
   - Section 508 still on WCAG 2.0
   - BC regulations not yet made
   - Colorado's 2025 rule text unverified (403)
   - AODA penalty figures from secondary sources only
