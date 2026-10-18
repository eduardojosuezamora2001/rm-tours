---
name: RM Tours
description: Literal implementation of the approved desktop and mobile Stitch screens.
colors:
  primary: "#003756"
  primary-container: "#0e4f75"
  primary-fixed: "#cbe6ff"
  on-primary: "#ffffff"
  secondary: "#006c4f"
  secondary-container: "#99f5ce"
  on-secondary: "#ffffff"
  on-secondary-fixed-variant: "#00513b"
  tertiary: "#6a1100"
  tertiary-container: "#921d02"
  on-tertiary: "#ffffff"
  surface: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f3ff"
  surface-container: "#e7eeff"
  surface-container-high: "#dee8ff"
  surface-container-highest: "#d8e3fb"
  on-surface: "#111c2d"
  on-surface-variant: "#41474e"
  outline-variant: "#c1c7cf"
  input: "#c7d3dc"
  ring: "#147b77"
  destructive: "#a91d26"
typography:
  display-hero:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "56px"
    fontWeight: 800
    lineHeight: "64px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "-0.015em"
  headline-lg-mobile:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "34px"
    letterSpacing: "-0.01em"
  headline-md:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
    letterSpacing: "-0.01em"
  headline-sm:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
  body-md:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
  label-md:
    fontFamily: "Plus Jakarta Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.03em"
rounded:
  tag: "4px"
  control: "8px"
  card: "12px"
  gallery: "16px"
  contact: "24px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  desktop-gutter: "48px"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-coral:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-mint:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-fixed-variant}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-soft:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 16px"
  button-chat:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 16px"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "4px 10px"
  catalog-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
  home-card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.card}"
  desktop-navigation-active:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary-fixed}"
    rounded: "{rounded.control}"
  destination-chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
---

# Design System: RM Tours

## Overview

The user's instruction is binding: **“Las interfaces deben seguir al pie de la letra los diseños de Stitch.”** Stitch project `4366171717337285856` and its saved source HTML and full-resolution images in `front/desing/stitch` are the visual authority. This refresh supersedes the earlier visual interpretation and its approval. Preserve the source compositions, palette, hierarchy, geometry, imagery roles and responsive differences; do not redesign them to suit generic design preferences.

The seven screen references are desktop home `9c2671ea77f1488ba46ab3410d54d3ab`, catalogue `61d46cf5d8c548d081dad5101cd27de6`, detail `cea7a57b40944a608fd7abf54e5a32ba`, administration `ce1dcd1953be4a37aad150307919c9af`, mobile home `de3538226ad6447f9d9c84a0d3cda6f1`, mobile catalogue `aad1dd39ddc243f79879de0debcdbb44`, and mobile detail `ef6bb58f6d2c4e40b2208e3e51c6a4c1`. The adjacent `2f9307579ab045a2bd481091a009e697` asset is the brand reference.

**Key Characteristics:**

- Source-specific desktop and mobile compositions, not a uniform stacked desktop layout.
- Navy headings, mint accents, coral actions and prices, and lavender surface layers.
- Montserrat headings, declared Plus Jakarta Sans body text and locally served Material Symbols.
- Distinct home, catalogue and detail photographs selected by the documented media order.

This document records the current implementation and source contract. It does not certify pixel equality or replace comparison with the saved reference images. Old screenshots outside the refreshed Stitch review set are not evidence for this version. Unverified claims from the source are omitted or replaced truthfully: ratings, reviews, certifications, capacity, weather, exchange rates, payment claims and sample phone numbers are not production facts. Quotations still require manual confirmation; the design correction adds no bookings or payments.

Validation evidence recorded on 2026-10-15: final home, catalogue and detail captures at 1323px and 390px are saved as `.impeccable/review/stitch/{home,catalog,detail}-{1323,390}-build-{top,full}.png`; administrative list/editor captures are `.impeccable/review/admin-{list,editor}-{desktop,mobile}.png`. The implementation agent reports loaded fonts and no horizontal overflow for all six public combinations, passing final build/lint and ten end-to-end tests, including desktop/mobile hero selection and navigation of four gallery images. Nine unit tests and two targeted gallery-navigation tests also passed earlier in the implementation pass. The documentation pass inspected the six final public top captures and mobile home full capture, and inventoried all sixteen artifacts; it did not rerun application checks. The reviewer marked all eight requested fixes resolved and returned **ship**, limited to those fixes and the reported regression checks. That verdict is not a new full-surface review or a pixel-perfect certification.

## Colors

The frontmatter preserves the exact values of the source palette used by the current implementation. `front/src/stitch-tokens.css` holds the fuller Stitch token set; `front/src/index.css` supplies shadcn aliases and effective page treatments.

### Primary

- **Ocean Navy** (`primary`): brand, headings, default actions and selected destination filters.
- **Ocean Panel** (`primary-container`) and **Pale Ocean** (`primary-fixed`): selected desktop navigation, notice treatments and contrasting pale text.

### Secondary

- **Forest Green** (`secondary`): WhatsApp/contact actions, selected activity filters and supporting icons.
- **Bright Mint** (`secondary-container`): source accent panels, chat icon controls and highlighted hero text, paired with dark green text.

### Tertiary

- **Coral Rust** (`tertiary-container`): package and prepare-message actions and monetary prices. Its deeper companion (`tertiary`) supplies hover feedback.

### Neutral

- **Coastal Canvas** (`surface`) and **White Surface** (`surface-container-lowest`): page canvas and elevated card or panel surfaces.
- **Lavender Layers** (`surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest`): catalogue footers, fields, filters, metrics and supporting panels according to each reference.
- **Ink** (`on-surface`) and **Slate** (`on-surface-variant`): reading text and secondary copy.
- `outline-variant`, `input`, `ring` and `destructive` retain the current border, field, keyboard-focus and error roles. They are not substitute brand accents.

## Theme selection

The public header now uses shadcn Select for Spanish/English and Light/Dark, available on desktop and mobile. Language changes preserve the route, query, hash and in-memory quote. Light remains the default; the selected theme persists in browser storage and synchronizes across tabs. An external initialization script applies the saved theme before rendering without weakening the Content Security Policy.

Dark mode extends the coastal palette with a deep ocean canvas (`#0b1822`), raised blue surfaces, pale blue headings, mint accents and coral prices/actions. Semantic variables in `front/src/index.css` theme public pages, forms, overlays and administration; photographic overlays retain their ocean treatment. The dark logo variant keeps the original artwork with readable lettering. On mobile, preference selects stay in the header; administration access is also available in the navigation sheet.

## Typography

**Display Font:** Montserrat, with sans-serif fallback; local imports supply weights 600, 700 and 800.

**Body Font:** Plus Jakarta Sans, with sans-serif fallback; local imports supply weights 400, 500, 600 and 700. Preserve the declared family spelling; source assets and component overrides remain relevant to the rendered appearance.

The frontmatter uses the source's reusable type roles. Desktop hero text uses the large display treatment. The implemented mobile home hero, mobile catalogue title and mobile detail title use the smaller headline-mobile treatment rather than mechanically shrinking every desktop title. Desktop detail uses the large headline role. Home-card titles use Montserrat (600, 20px/28px); catalogue-card titles use Plus Jakarta Sans (600, 16px/24px). Labels, service tags and compact mobile controls retain their component-specific sizes.

Material Symbols Outlined is served from `/brand/material-symbols.woff2` through `StitchIcon`. The local font subset is part of the source appearance; do not replace its icons globally with an unrelated family. Existing administrative utility controls also use their current Lucide icons.

## Layout

The effective public container has a maximum outer width of 1376px, desktop horizontal padding of 48px and mobile padding of 16px. The public header is fixed, 80px on desktop and 64px on mobile. Desktop navigation yields to the menu below 1280px. Mobile includes the source bottom navigation and safe-area padding; detail additionally has its contextual top bar and quotation action.

Desktop home retains the photograph-backed hero, search console, destination tiles, featured cards, geographic coverage map, four-step explanation, group panel and FAQ. Home uses three featured columns on wide screens and two from 768px through 1279px. Mobile displays four featured cards in one column, followed by the compact assurance, FAQ and contact ending. Its legal footer and contact panel are dedicated mobile compositions; the desktop coverage map and long explanatory ending are hidden there.

Desktop catalogue uses four columns at 1280px and above, three from 1024px through 1279px, two from 768px through 1023px and one below 768px. Preserve its lavender desktop card base, destination strip, activity strip and sorting placement. Mobile has two compact horizontally scrollable filter strips; sorting sits inside the intro information panel. Search expands explicitly through its search control, and stays exposed when a query is present. Do not replace this with the former large filter form.

Desktop detail has the source gallery and broad content column beside its quotation panel. Mobile presents the leading gallery image before the location, title and teaser hierarchy, then the source content cards and notice treatment. The quote form pairs phone/email and date/time in the embedded desktop panel; mobile stacks these fields and keeps the two participant controls side by side. The standalone quote page retains its own summary and field layout.

Spanish administration uses a white 288px sidebar, top bar, real catalogue metrics, filters and photograph cards. Editing opens an official shadcn Sheet at the right, up to 576px wide, over the catalogue. Mobile retains photograph cards, price and grouped actions, with the editor using the available viewport width. Continue to use the existing responsive rules between reference widths.

## Elevation & Depth

Use the shadows and tonal layering shown by Stitch. The current implementation intentionally has subtle header and card shadows, lifted card hover feedback, gallery shadows and stronger quotation/search-panel depth. The earlier blanket claim that tour cards have no shadows is superseded. Sidecar shadow entries capture the actual reusable values; do not impose a flat-only rule or remove source depth as a matter of taste. Focus rings communicate interaction separately from structural shadows.

## Shapes

Preserve the source's rounded controls, pill filters, clipped photo cards and gallery frames. The reusable radii are in the frontmatter; component overrides include larger contact panels and compact service tags. The home hero is a full photographic composition, not the former asymmetric image beside a text column. Neither the previous asymmetric-corner rule nor the previous active-navigation underline describes the current system.

## Component implementation

Use the official shadcn Radix components throughout the public site and administration. All dropdowns use Select, composed through SelectField with SelectTrigger, SelectValue, SelectContent, SelectGroup and SelectItem. Empty domain choices use an internal sentinel decoded before updating application state; React Hook Form fields use Controller. The catalogue search uses InputGroup; galleries use the shared Button media variant; tour, plan and authentication panels use Card composition. Navigation uses NavigationMenu, Sidebar, Breadcrumb and Pagination as appropriate. In-app removal and unsaved-change confirmations use AlertDialog. The frontend conventions are recorded in front/AGENTS.md.

## Components

### Buttons

Use the official shadcn Button and its current variants: navy default, coral, mint, soft, green secondary and pill-shaped chat. Coral is used for preparing a quotation message; mint supplies the catalogue chat control; soft supplies supporting actions. Default controls are 44px high, large actions 48px, and source-specific cards and compact mobile controls override these sizes. Preserve actual hover, disabled and keyboard-focus feedback.

### Chips

Destination filters use pill geometry with navy selection; activity selection uses green. Photo badges have a translucent pale surface with navy text; duration overlays use a dark surface. Home-card service tags use a lavender fill. Do not collapse these distinct roles into the old universal green badge.

### Cards / Containers

Home and catalogue cards are intentionally different. Desktop home cards use a 240px photograph, white body and footer, metadata above the title, compact service tags and a green quotation action. Their mobile photograph is 192px high and the first four featured cards are visible. Desktop catalogue cards use a 16:10 photograph, smaller body typography, a lavender service/footer area, coral price, mint chat action and navy detail action. Mobile catalogue photographs are 190px high and the lower card area is white. Cards have source shadows and clipped corners.

### Inputs / Fields

Continue using shadcn Field, FieldGroup, Input, Select and related primitives. Page-specific fields use the source's pale fills and rounded corners. Participant controls use InputGroup with a centered editable numeric value and explicit decrease/increase buttons; adults start at one, children at zero, and both cap at 99. The prepare action is coral. Keep validation messages, consent and prepared-message feedback within this composition.

### Navigation

Desktop active links have an ocean-panel fill, pale ocean text and rounded corners. The former three-pixel underline belongs to the superseded implementation. Language and theme controls use shadcn Select with visible focus and translated labels. Mobile uses the source header/menu and bottom navigation; detail has its dedicated back/title header treatment. Admin active rows use the existing ocean fill and white text.

### Photography and captions

`front/src/features/catalog/media.ts` defines a positional convention, not a new database field. Sort photos without a `section_id` by ascending `position`: the first is the catalogue cover, the second is the home cover, and the remaining photos form the detail gallery. With one photo, reuse it for home and gallery; with two, the second is also the detail-gallery fallback. With none, preserve the existing placeholder behavior. Photos with a `section_id` remain in their associated section galleries and do not consume these cover positions.

The fourth detail-gallery photo optionally supplies the dedicated mobile detail hero (`gallery[3] ?? gallery[0]`). With at least six unassigned photos, this is the sixth unassigned photo in total (index 5), not a fixed index across section-associated photos. If that fourth gallery photo is absent, the first gallery photo remains the mobile hero. Desktop retains the first three gallery photographs in its leading composition; tapping the mobile hero opens its corresponding image in the viewer. The mobile viewport hook keeps the chosen image, bilingual alt, caption and viewer target synchronized when the viewport changes.

`TourCard` chooses the home or catalogue role explicitly; detail consumes the gallery and mobile-hero roles. The admin photo editor explains the convention with help and catalogue/home/detail/mobile-detail role badges, and reorder controls persist the sequence. The editor saves each photo's `position`, `section_id` and bilingual `alt` text. Gallery `alt[lang]` supplies both accessible image text and visible captions: the leading desktop gallery caption uses destination plus alt, and secondary desktop captions use alt. Secondary captions are hidden on mobile by the source layout. Write bilingual alt text with both purposes in mind.

The gallery dialog retains previous/next controls, a live image count and left/right arrow-key navigation when more than one image is available.

Development fixtures use distinct source photographs for the different contexts. They are illustrative development data, not production demonstrations or owner-approved factual claims.

## Do's and Don'ts

### Do:

- Do treat the seven saved Stitch HTML/image pairs as the authority for desktop and mobile composition.
- Do preserve exact navy, mint, coral, font, icon and surface roles from the source.
- Do preserve separate home/catalogue card variants and the positional media convention.
- Do retain semantic controls, keyboard focus, reduced-motion behavior and truthful content.
- Do compare refreshed captures at the reference widths before asserting visual parity.

### Don't:

- Don't let prior DESIGN.md claims, earlier screenshots or a previous approval override the user's literal-Stitch instruction.
- Don't replace source geometry, shadows, mobile composition or icon treatment with a new aesthetic preference.
- Don't present mockup reviews, ratings, certifications, payment claims, capacity, weather, exchange rates or sample contact information as verified facts.
- Don't add bookings or payments to reproduce a source label.
