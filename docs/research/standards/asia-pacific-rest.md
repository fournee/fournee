# Accessibility standards: Asia-Pacific and the rest of the world (for the Fournée standards dial)

Researched 2026-11-10. "(inferred)" = my reading, not stated by the source. "(prior knowledge)" = not re-fetched this session. Most numeric rules come by reference from WCAG. Where a profile says "= WCAG 2.x AA", use the WCAG numbers: 4.5:1 text, 3:1 large text (≥24px, or ≥18.66px bold), 3:1 non-text (2.1+), 200% resize, 320px reflow, text spacing 1.5/2/0.12/0.16 (2.1+), 24px target (2.2), focus not obscured (2.2).

## Summary
1. Most of the region points at WCAG AA. The version varies: 2.0 (Japan, Israel's legal baseline, Mexico), 2.1 (India, Singapore, China in part) or 2.2 (NZ since March 2025, Korea KWCAG 2.2, Brazil NBR 17225:2025, Australia by "latest version").
2. Changes from 2024 to 2026: NZ moved to WCAG 2.2 AA (17 Mar 2025). Japan began revising JIS X 8341-3 toward WCAG 2.2 (Oct 2025, still pending). Brazil published ABNT NBR 17225 (Mar 2025). India's Supreme Court struck down Rule 15 as non-binding (Nov 2024), and draft RPwD amendment rules (2026) tie compliance to IS 17802.
3. Rules that go beyond WCAG and touch type: China's MIIT ageing-friendly specs (≥18dp large-font option, ≥1.3× line spacing), Korea's KWCAG control-size rule (6.0mm diagonal), and government design systems with **17px** body text (Japan DADS, Korea KRDS).
4. No regional standard found sets a CJK/Hangul/Devanagari minimum text size in law. Script rules live in design systems and guidance.
5. The dial needs a WCAG version switch (2.0/2.1/2.2), an "ageing-friendly" overlay for China, and per-design-system body defaults of 16px or 17px. Frosting and Fontdant defaults already meet or exceed every legal floor except the ones listed under Conflicts.

## Profiles

**Australia: DDA 1992 + Digital Service Standard v2.0 + Style Manual/GOLD**
- Who: DDA covers everyone providing goods or services, public or private. The DSS covers Commonwealth agencies. DSS v2.0 was released late 2023 and applies to new services from 1 Jul 2024; services that existed before then must meet it from 1 Jul 2025 ([DSS v2.0 PDF, DTA, Nov 2023](https://www.dta.gov.au/sites/default/files/2023-11/Digital%20Service%20Standard%202.pdf)).
- Enforcement: DDA works through complaints to the AHRC, then Federal Court (prior knowledge). The DSS works through policy and exemption requests.
- Technical standard: v2 drops the fixed WCAG version and level, so the latest WCAG applies, i.e. **WCAG 2.2 AA** ([Intopia, 2024](https://intopia.digital/articles/australias-digital-service-standard-gets-an-upgrade)). Criterion numbering is inconsistent across sources ("Leave no one behind" vs "Criterion 4 – Make it accessible", which may belong to the Digital Inclusion Standard; [digital.gov.au](https://www.digital.gov.au/policy/digital-experience/digital-inclusion-standard/dis-criterion-4-make-it-accessible)). That page timed out, so the numbering is unverified.
- Design systems: GOLD and the Style Manual are guidance, not law. No mandated body-text px size was found. NSW tests text resize at 200% ([NSW Digital, typography](https://www.digital.nsw.gov.au/delivery/accessibility-and-inclusivity-toolkit/design/typography)).
- Dial: WCAG 2.2 AA preset.

**New Zealand: Web Accessibility Standard 1.2**
- Who: Public Service departments, Police, NZDF, PCO, NZSIS, and the wider Executive branch per some pages. Mandatory for these bodies (government standard, not statute).
- Status: **WCAG 2.2 AA from 17 Mar 2025**, replacing v1.1 (WCAG 2.1) ([NZ draft 1.2](https://digital.govt.nz/standards-and-guidance/nz-government-web-standards/proposed-changes-to-web-standards-review-2024/web-accessibility-standard-1-2-draft); [New standards for March 2025](https://dns.govt.nz/standards-and-guidance/nz-government-web-standards/new-web-standards-for-march-2025)). Exceptions cover complex maps and some media.
- **Pending:** a Digital Accessibility Standard will replace it. Consultation was held 13 Jul–7 Aug 2026, with the standard expected early 2027 ([DAS large print PDF](https://www.digital.govt.nz/assets/Standards-guidance/NZ-government-web-standards/DAS/Digital-Accessibility-Standard-DAS-Large-print.pdf), per search summary). The official pages returned empty when fetched, so this is unverified beyond the search snippets.
- Dial: WCAG 2.2 AA preset.

**Japan: JIS X 8341-3:2016**
- Who: national and local government via the MIC guideline, and procurement. For private businesses, "reasonable accommodation" became mandatory on 1 Apr 2024 under the amended Act for Eliminating Discrimination against Persons with Disabilities (prior knowledge). It has no web-specific penalties.
- Technical standard: identical to ISO/IEC 40500:2012 = **WCAG 2.0**, with levels A/AA/AAA and conformance claims of "準拠 / 一部準拠 / 配慮". Government sites still test against 2016 (Cabinet Office statement dated 27 Mar 2026) ([CAO](https://www5.cao.go.jp/j-j/sekai_chouryuu/sh25-01/webaccessibility.html)).
- **Pending:** a revision committee formed 30 Oct 2025 aims at ISO/IEC 40500:2025 (= WCAG 2.2). Publication date not confirmed ([issoh, 2025](https://www.issoh.co.jp/column/details/3022/); [gihyo, Jan 2025](https://gihyo.jp/article/2025/01/web-accessibility-prospect)).
- Design system: Digital Agency DADS sets body **17px / line-height 1.7 / weight 400** (token Std-17N-170), **≥16px** in general, 14px only for limited supplementary use, and Noto Sans JP. Source is a secondary mirror ([open-design.ai DADS copy](https://open-design.ai/design-system-assets/locales/ja/DESIGN-japan-dads.md)).
- Dial: WCAG 2.0 AA legal floor. Add a "DADS" type preset (17px body, 1.7 leading, 14px floor).

**South Korea: KWCAG 2.2 (KS X OT0003:2022)**
- Who: public bodies, and private entities under the Disability Discrimination Act Art. 21 (prior knowledge). A web accessibility quality mark run by MSIT is valid for 1 year ([Seoul](https://www.seoul.go.kr/helper/web_accessibility.do); [bizinfo](https://www.bizinfo.go.kr/biz/bizd/selectBIZD130View.do?null)).
- Technical standard: made a national standard in Dec 2022. It has **33 check items**, a condensed restructuring of WCAG ([bizinfo](https://www.bizinfo.go.kr/biz/bizd/selectBIZD130View.do?null)). How it differs from WCAG:
  - Contrast (1.3.3) is 4.5:1, or 3:1 for text ≥18pt or ≥14pt bold ([velog, secondary](https://velog.io/@yona_inthe_fish/명도대비)).
  - Control size requires a **diagonal ≥ 6.0mm** (KWCAG 2.1.3) ([Chrome Web Store tool](https://chromewebstore.google.com/detail/kwcag-a11y-inspector/ngcmkfaolkgkjbddhjnhgoekgaamjibo)).
  - "Distinguishing content" (콘텐츠 간의 구분) and "no autoplay" are their own items (prior knowledge).
  - Reflow, text spacing and non-text contrast don't appear as separate items (inferred, unverified).
- Design system: KRDS sets body **17px / 400 / 1.5** and targets WCAG AA ([secondary](https://www.oppadu.com/tools/design-systems-site/brand/krds.html)).
- Dial: KWCAG preset = WCAG 2.2 AA contrast, plus a 6mm control-diagonal check (≈ 22.7 CSS px at 96dpi, inferred), plus a KRDS type preset (17px body, 1.5 leading).

**India: RPwD Act 2016 + GIGW 3.0 + IS 17802**
- Who: GIGW 3.0 (MeitY/NIC, 2023) binds all central, state and local government websites and apps ([guidelines.india.gov.in, updated 03.11.2026](https://guidelines.india.gov.in/?p=9790)). STQC certifies.
- Law: on 8 Nov 2024 the Supreme Court held RPwD Rule 15(1) ultra vires because it was only persuasive, and ordered mandatory standards ([SCC Online, 12 Nov 2024](https://www.scconline.com/blog/post/2024/11/12/union-mandate-rules-under-rpwd-act-ensure-accessibility-of-public-places-supreme-court/)). **Pending:** draft RPwD Amendment Rules 2026 align ICT with IS 17802 Parts 1–2 ([Mondaq](https://www.mondaq.com/india/compliance/1824050/the-new-accessibility-conformance-regime-key-takeaways-from-the-draft-rpwd-amendment-rules-2026)). The financial sector was already told to comply with IS 17802 ([NHB circular, 2025](https://www.nhb.org.in/wp-content/uploads/2026/05/17.-Compliance-with-IS-17802-Part-I-Part-II-standards-published-by-Bureau-of-Indian-Standards-BIS.pdf)).
- Technical standard: GIGW 3.0 = **WCAG 2.1 AA**. IS 17802-1:2021 = EN 301 549 v3.2.1 (also WCAG 2.1 AA), with Amendment 2 in Apr 2025 ([BIS](https://services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/Indian_standards/isdetails/MjY3NTI=)).
- No Devanagari or Indic type sizes are mandated in what I found.
- Dial: WCAG 2.1 AA preset.

**China: GB/T 37668-2019 + MIIT ageing-friendly specs**
- Status: GB/T is a *recommended* national standard, in force since 1 Mar 2020 and still valid in 2026 ([chinesestandard.net](https://www.chinesestandard.net/PDF/English.aspx/GBT37668-2019)). It references WCAG 2.0/2.1 ([W3C blog, Feb 2020](https://www.w3.org/blog/2020/02/updated-chinese-accessibility-standard)). No newer edition was found. The Barrier-Free Environment Construction Law took effect 1 Sep 2023 (prior knowledge).
- MIIT ageing-friendly specs (Apr 2021) apply to sites and apps seeking the barrier-free mark, which is valid for 2 years. Mobile web must offer **at least one ≥18dp/pt large font**, paragraph line spacing **≥1.3×**, and no ad pop-ups in elder mode ([IT之家](https://www.ithome.com/0/544/652.htm); [IT之家](https://www.ithome.com/0/599/692.htm)). One unofficial source claims **≥30dp** for primary information in elder-mode apps (unverified).
- Dial: WCAG 2.1 AA base, plus an "ageing-friendly" overlay: 18px minimum in large mode, line-height ≥1.3, and no auto-popups.

**Singapore: Digital Service Standards**
- Who: mandatory for government agencies. Not law for businesses ([GovTech developer portal](https://developer.tech.gov.sg/guidelines/standards-and-best-practices/wcag-2-1)).
- Technical standard: WCAG **2.1 AA**. The current DSS catalog says "WCAG Levels A and AA" without naming a version (updated 26 Mar 2026) ([DSS catalog](https://info.standards.tech.gov.sg/control-catalog/dss/)). Enhancements were announced at COS 2025 ([MDDI](https://www.mddi.gov.sg/newsroom/designing-for-digital-accessibility-and-inclusion/)).
- Dial: WCAG 2.1 AA, with 2.2 a likely next step (inferred).

**Israel: IS 5568 + Equal Rights (Service Accessibility) Regulations 2013**
- Who: public and private service providers.
- Enforcement: by the Commission for Equal Rights of Persons with Disabilities. Statutory damages can be awarded without proof of harm (amounts unverified).
- Technical standard: the legal baseline is **WCAG 2.0 AA**. Vendors report IS 5568:2020 aligning with WCAG 2.1 and a Part 1 update in Sep 2023, and say WCAG 2.2 is not required ([user-a.co.il](https://user-a.co.il/en/standards/israeli-accessibility-standards-vs-wcag); [BOIA](https://www.boia.org/blog/israels-digital-accessibility-laws-an-overview)). These are vendor sources only.
- RTL Hebrew/Arabic: no type-size rules were found.
- Dial: WCAG 2.0 AA (2.1 recommended).

**Brazil: LBI 13.146/2015 + eMAG 3.1 + ABNT NBR 17225:2025**
- LBI Art. 63 requires accessible sites for companies with HQ or commercial presence in Brazil and for government (prior knowledge, in force since Jan 2016). eMAG binds federal bodies.
- **New:** ABNT NBR 17225 was published 11 Mar 2025, based on **WCAG 2.2**. It has levels A/AA/AAA, regular conformance at A+AA, and about 146 requirements and recommendations ([Teletime, 11 Mar 2025](https://teletime.com.br/11/03/2025/abnt-lanca-norma-para-aprimorar-a-acessibilidade-de-sites/); [Câmara PDF](https://www2.camara.leg.br/a-camara/estruturaadm/gestao-na-camara-dos-deputados/responsabilidade-social-e-ambiental/acessibilidade/pdfs/ABNTNBR17225AcessibilidadeDigitalparaWeb.pdf)). Whether it replaces eMAG is unconfirmed.
- Dial: WCAG 2.2 AA preset.

**Mexico**: the federal Acuerdo (DOF, 3 Dec 2015) requires **WCAG 2.0** for federal agencies and state enterprises ([IMER PDF](https://www.imer.gob.mx/phpwrappers/NormatecaInterna/apitrck/uploads/acuerdo_establecen_disp_grales_accesibilidad_web_deben_obs_depend_entid_apf_empresas_produc_edo.pdf); [gob.mx](https://www.gob.mx/en/accessibility)). No binding private-sector web standard was found. Dial: WCAG 2.0 AA.

**South Africa**: **no binding web standard was found**. GCIS guidance reportedly points to WCAG 2.0 (unverified), and the general legal duty comes from equality law ([AllAccessible](https://allaccessible.org/blog/is-website-accessibility-a-legal-requirement-in-south-africa)). Dial: WCAG 2.0 AA as an advisory setting.

## Dial settings

| Profile | text contrast min | large-text definition | UI/non-text contrast | focus rule | min body px | min any-text px | spacing/resize/reflow | motion | extra rules |
|---|---|---|---|---|---|---|---|---|---|
| Australia DSS v2 | 4.5:1 | ≥24px / ≥18.66px bold | 3:1 | visible + not obscured (2.2) | none (Fontdant 16) | none | 200% / 320px / WCAG spacing | 2.3.1 flashes; pause >5s | – |
| NZ WAS 1.2 | 4.5:1 | same | 3:1 | 2.2 AA | none | none | 200% / 320px / spacing | as WCAG | DAS replaces it ~2027 |
| Japan JIS 2016 | 4.5:1 | same | none (2.0) | visible only | DADS 17 | DADS 14 | 200%; no reflow or spacing (2.0) | as WCAG 2.0 | revision to 2.2 pending; DADS leading 1.7 |
| Korea KWCAG 2.2 | 4.5:1 | ≥18pt / ≥14pt bold | not separate (inferred) | visible | KRDS 17 | none | resize per WCAG (inferred) | no autoplay | control diagonal ≥6.0mm; KRDS leading 1.5 |
| India GIGW 3 / IS 17802 | 4.5:1 | same | 3:1 | visible (2.1) | none | none | 200% / 320px / spacing | as WCAG 2.1 | binding rules pending (2026) |
| China GB/T + MIIT | 4.5:1 (WCAG ref.) | same | 3:1 (2.1 ref.) | visible | 18 in large mode | none | line-height ≥1.3 | no ad pop-ups (elder mode) | 18dp large-font option; ≥30dp claim unverified |
| Singapore DSS | 4.5:1 | same | 3:1 | visible (2.1) | none | none | 200% / 320px / spacing | as WCAG | – |
| Israel IS 5568 | 4.5:1 | same | none (2.0 law) | visible | none | none | 200% | as WCAG 2.0 | RTL |
| Brazil NBR 17225 | 4.5:1 | same | 3:1 | 2.2 AA | none | none | 200% / 320px / spacing | as WCAG 2.2 | – |
| Mexico | 4.5:1 | same | none | visible | none | none | 200% | as WCAG 2.0 | federal only |
| South Africa | advisory 4.5:1 | same | none | visible | none | none | – | – | not binding |

## Conflicts and gaps against Frosting and Fontdant defaults
1. **WCAG version switch is missing.** Non-text 3:1 and text spacing don't exist in WCAG 2.0, which is the legal floor in Japan, Israel and Mexico. The dial should *loosen* them to warnings rather than failures for 2.0 presets, and keep them on as best practice.
2. **Body 16px vs 17px.** DADS and KRDS both default to 17px. A Fontdant "gov-JP/KR" preset should raise the body default to 17px.
3. **12px floor vs DADS 14px.** DADS restricts text below 16px to 14px supplementary use. Fontdant's 12px floor is looser than DADS, so tighten it for that preset.
4. **Leading bands.** DADS uses 1.7 for CJK body text, KRDS 1.5 and MIIT ≥1.3. If Fontdant's band is Latin-tuned (around 1.4–1.6), it will flag 1.7 as too loose. CJK needs a higher upper bound.
5. **Large-mode check is missing.** China's ageing-friendly spec requires a reachable ≥18px large-font option. That is a new Fontdant check (a size-ladder step of at least 18px when a "large" mode is toggled).
6. **Target size in mm.** KWCAG measures the control's diagonal in physical millimetres (6.0mm), whereas WCAG 2.2 uses 24×24 CSS px. Add a unit-converted check.
7. **APCA or other non-ratio contrast** is not referenced by any law in this region. Keep WCAG 2.x ratios as the legal metric.
8. **Gradient fills.** No regional standard defines contrast on gradients. Apply the WCAG approach and test the worst-case stop (inferred).
9. **Script-specific minimum sizes** (CJK, Hangul, Devanagari) are not law anywhere surveyed. Treat them as design-system presets, not jurisdiction rules.
10. **Unverified items:** the official NZ, DTA and KWCAG texts could not be fetched; Israel's penalties and the 2020 edition; the GCIS status in South Africa; whether DADS and KRDS values match the official sites.
