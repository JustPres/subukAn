| version | 0.1 |
| name | design |
| description | Visual system adapted from Notion's design language, plus interaction rules grounded in Norman's design psychology. |

# Design

## Direction

Adapted from Notion's design system (sober, rectangular geometry + pastel status tints), not copied wholesale. Ruled out: near-black-plus-neon-accent systems (VoltAgent/xAI/Minimax style — reads "crypto/trading app," the wrong signal for a platform holding real money) and warm cream-plus-terracotta systems (an overused AI-generated default, not a choice made for this brief). Also ruled out: pure code-editor aesthetics (Replicate-style) — this audience includes students and non-engineers who need approachability, not a dev-tool look.

## Color tokens

| Token | Value / role | Notes |
|---|---|---|
| `--color-primary` | A confident blue (not Notion's signature purple) | Primary CTAs, links, brand identity — distinct from the Notion source so this doesn't read as a clone |
| `--color-ink` | Near-black text | Primary text |
| `--color-slate` | Mid-gray text | Secondary text |
| `--color-steel` | Light-gray text | Tertiary text, timestamps, metadata |
| `--color-canvas` | Off-white background | Base page background |
| `--tint-open` | Sky pastel | Listing status: open |
| `--tint-filling` | Yellow pastel | Listing status: slots filling |
| `--tint-review` | Lavender pastel | Listing status: under review |
| `--tint-released` | Mint pastel | Listing status: payment released |
| `--tint-rejected` | Rose pastel | Listing status: rejected |
| `--tint-expired` | Muted gray/cream | Listing status: expired / unfilled slots forfeited |

**Money-screen exception:** payment/escrow/release screens should use restrained, near-monochrome treatment (ink/slate/steel + primary blue only) rather than the pastel tint system — those moments should feel a notch more serious, closer to a banking app than a browsing screen.

## Typography

- Primary typeface: **Inter** (open-source, free, unlike Notion's proprietary font) — works well across PH devices without licensing concerns
- Body line-height: 1.55 — supports careful reading of task instructions before a tester commits to anything

## Geometry

- Buttons: 8px radius (rectangular, deliberately not pill-shaped)
- Cards: 12px radius
- Base spacing unit: 4px scale (4/8/12/16/24/32...)

## Components (behavior notes, not just visuals)

- **Escrow status bar** — always visible, plain language: "₱500 held — 3 of 5 slots filled" → "Your ₱100 is reserved, pending review" → "Released." Never hidden state.
- **Timer display** — persistent, visible countdown during an active task, not a silent background timer that surprises the tester at cutoff.
- **Agreement modal** — requires scrolling to the bottom before the accept button activates; includes a one-line plain-language restatement above the button ("You're agreeing to complete this task honestly — payment depends on it"), not just a bare checkbox.
- **Release Payment / Reject Submission buttons** — deliberately "heavier": larger, with a confirm step, visually distinct from routine actions like browsing. Friction here is a feature, not a UX cost — people should pause before an irreversible money action.
- **Slot state** — filled slots render visibly unclickable rather than clickable-then-rejected on click.
- **Submit button** — stays disabled until every required question/metric is answered, rather than allowing submission and then listing what's missing.

## Design psychology grounding (Norman, *The Design of Everyday Things*)

| Principle | Applied as |
|---|---|
| Signifiers > affordances | Agreement click-through needs a stronger signal than a bare checkbox (see Agreement modal above) |
| Conceptual models | Escrow status must be visible in plain language at every stage — "where's my money" should never be an unanswered question |
| Constraints | Invalid actions (filled slots, incomplete submissions) should look disabled, not fail after the fact |
| Feedback | Timers and auto-stop notifications must be immediate and clearly state what happens next |
| Weight-as-seriousness (metaphor) | Consequential actions (release, reject) get heavier visual treatment than routine ones (browsing) |

**Explicitly not applicable:** the physical Need-for-Touch / haptic-carryover research (weight of objects, texture effects on judgment) doesn't transfer to a web app and isn't part of this system beyond the weight-as-visual-metaphor point above.
