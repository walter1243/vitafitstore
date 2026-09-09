---
name: apple-style-showcase
description: Use when building or editing a full-bleed product/category spotlight section on the Thermallis storefront — the visual pattern modeled after apple.com's product pages (large imagery, huge typography, two pill CTAs, no icon-cards). Invoke this before adding any new "featured" section to app/page.tsx or app/preview/page.tsx.
---

# Apple-style full-bleed showcase

This captures the page-engineering pattern from apple.com product pages
(iPhone, Apple Watch, AirPods) so it can be reproduced consistently on this
store instead of reinventing a different look — generic icon-in-circle
"feature cards" — every time.

## What makes it look like Apple, not a template

- **One section per thing, full viewport height (`min-h-[80vh]` or taller), stacked vertically.**
  Never a grid of small cards, never a carousel, never an icon-in-a-circle
  feature bullet. Each idea gets its own full-bleed moment.
- **Background is the content.** Either a real, full-bleed product/category
  photo with a gradient scrim for text contrast, or (if no image exists) a
  smooth two-tone gradient in the brand palette. No white card floating on a
  page background, no drop shadow around the section itself.
- **Typography carries the section.** One huge bold headline (5xl–7xl), one
  short line of real supporting copy underneath, generous vertical spacing.
  No paragraph blocks, no bullet lists inside the section.
- **Exactly two pill-shaped buttons, equal visual weight**, side by side: one
  filled, one outline — e.g. "Ver productos" / "Todo el catálogo". Never a
  plain text link, never more than two buttons, never a button styled
  differently in weight/size than its sibling.
- **Hard color cuts between sections, not gradual blends.** Apple alternates
  dark and light sections abruptly (e.g. black AirPods section directly
  followed by white iPhone section) — no wave-divider SVGs, no fade
  transition trying to soften the seam. The contrast itself is the effect.
- **Motion is a single fade+rise on scroll per section** (opacity 0→1,
  y +40→0, ~0.9s power3.out, triggered once via ScrollTrigger `start: 'top
  75%'`). Not staggered per-icon, not parallax, not multiple competing
  animations.

## Non-negotiable: no fabricated content

Every headline/subline/count in these sections must come from real data —
category name, product name, actual product count, real price. Never invent
a marketing tagline, a stat, or a spec that isn't in the database. If a
punchier line is wanted, it needs a new admin-editable field — don't write
one in and pretend it's real copy.

## Reference implementation in this repo

`components/category-spotlight.tsx` — one full-bleed section per real
product category (name + first product's photo + real product count from
`/api/categories` + `/api/products`), alternating dark/light per index,
wired into `app/page.tsx` (`pin` block) and `app/preview/page.tsx`. Use it as
the template: fetch real data client-side, build the `Spotlight[]` array,
render alternating sections, reuse the same button/typography classes.

When asked to spotlight something else (e.g. a single hero product instead
of a category), copy this component's structure rather than building a new
visual language from scratch — same button pills, same typography scale,
same hard light/dark alternation, same GSAP reveal.
