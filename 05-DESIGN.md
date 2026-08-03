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

| version | 0.2 |
| name | design |
| description | Visual system rebuilt around mobile banking app psychology (GCash, Wise, GoTyme, Maribank) for money-critical screens, with Linear/Stripe density for everything else. Supersedes the earlier Notion-first draft. |

# Design

## Direction (revised)

**Primary reference shifted from Notion to mobile banking/fintech apps.** The earlier draft borrowed Notion's restraint, which is right for a general SaaS tool but wrong for the specific thing this platform does: move real money between strangers. Financial interfaces have their own, more specific design language, built around trust and anxiety-reduction rather than general elegance — and that's the correct north star here, since escrow, release, and balance are the emotional core of the product, not an add-on feature.

**Two references now work together, not against each other:**
- **Banking-app psychology** (GCash, Wise, GoTyme, Maribank) — governs anything touching money: balance display, escrow status, payout, withdrawal
- **Linear/Stripe density** — governs everything else: task lists, listing boards, submission history

These aren't contradictory once split by what they're actually for. A balance is emotionally loaded; a task list row is not. Applying banking-app prominence everywhere would feel heavy and cluttered. Applying Linear's density to the balance would undersell the one number people are most anxious about. See "The one loud element rule" below.

## Design psychology (the actual foundation now, not an afterthought)

**State clarity is the top-level goal.** Financial interfaces build trust when three things are instantly clear: the user's current financial state, the system's current processing state, and what happens next. This matters more than visual polish — apply it to every money-adjacent screen: escrow amount, review status, payout status, always stated in plain language, never inferred.

**Money causes real anxiety, not neutral interest.** Checking a balance is stressful for a meaningful share of people. A cluttered dashboard around financial information doesn't just look worse, it actively adds to that stress. This is the reasoning behind demoting secondary stats (submission counts, verification details) and giving the balance itself room to breathe.

**The "card" metaphor borrows trust from something already trusted.** Shaping a balance display like a physical debit/wallet card — rounded rectangle, masked account number, prominent placement — isn't decoration. It bridges the digital number to something people already trust: the card in their actual wallet.

**GCash's own redesign is a directly relevant precedent.** Their most recent update specifically changed the numeral typeface used for the balance to make it easier to read at a glance, explicitly for the moment of paying in person, when speed and legibility matter most — the same instinct behind using tabular/monospace numerals here. Their broader "balance-led home" pattern — balance as hero, key actions directly below it, transaction history simple and grouped by date — is the template for any money-facing screen on this platform (poster's escrow view, tester's balance card).

**High trust drives high retention.** Financial apps see unusually strong 30-day retention because trust turns "using" into "relying on." Every design decision on a money screen should be evaluated against: does this increase or decrease the user's confidence that their money is accounted for.

### Norman's principles (retained from v0.1, still fully applicable)

| Principle | Applied as |
|---|---|
| Signifiers > affordances | The real-money agreement click-through needs a stronger signal than a bare checkbox — scroll-to-bottom before the accept button activates, plus a plain-language restatement above it |
| Conceptual models | Escrow status visible in plain language at every stage — "₱500 held — 3 of 5 slots filled" → "Released" — never hidden state |
| Constraints | Invalid actions (filled slots, incomplete submissions) look disabled, not fail after the fact |
| Feedback | Timers and auto-stop notifications are immediate and state what happens next |
| Weight-as-seriousness (metaphor) | Consequential actions (release, reject, withdraw) get heavier visual treatment than routine ones |

**Not applicable:** physical Need-for-Touch / haptic-carryover research doesn't transfer to a web app.

## The one loud element rule

Exactly one element per screen is allowed to be visually prominent in the banking-app sense (large, high-contrast, card-shaped): the thing representing the user's money. Everywhere else on that same screen stays dense and restrained, Linear-style. Don't apply balance-card treatment to more than one element, or the hierarchy collapses and nothing reads as more important than anything else.

- Tester dashboard: the balance card is loud. The task board underneath is dense.
- Poster dashboard (not yet built): the escrow-held amount for an active listing is loud. The listing board and submission review list are dense.

## Color tokens

| Token | Value / role |
|---|---|
| `--color-primary` | `#2955E3` — confident blue, chosen for trust association, consistent with why most financial apps default to blue |
| `--color-ink` / `--color-slate` / `--color-steel` | Text hierarchy, unchanged from v0.1 |
| `--color-canvas` / `--color-surface` / `--color-border` | Backgrounds and borders, unchanged from v0.1 |
| `--tint-open` / `--tint-filling` / `--tint-review` / `--tint-released` / `--tint-rejected` / `--tint-expired` | Status tints, unchanged — used as small dots in dense rows now, not large badges (see Components) |

**Balance card exception:** solid `--color-primary` background, white text, white/20%-opacity pill for the "Verified" tag. No gradients — flat, confident, matches the rest of the system's restraint even in the one loud spot.

## Typography

- Primary typeface: **Inter**, unchanged
- **New: monospace/tabular numerals for all financial figures and counts** — balance, prices, timers, item counts. Use `font-variant-numeric: tabular-nums` plus a monospace stack (`'JetBrains Mono', ui-monospace, monospace`) for the balance figure specifically; `tabular-nums` alone is sufficient for smaller inline numbers. This is what makes numbers read as precise rather than casual — directly from the 2026 dashboard-density research and GCash's own numeral-legibility redesign.

## Geometry

- Buttons: 8px radius (unchanged)
- Standard cards: 12px radius (unchanged)
- **Balance card: 16–20px radius** — deliberately larger, reinforcing the physical-card metaphor. This is the one intentional exception to the 12px rule.
- Dense rows (task/submission lists): 6–8px radius, tighter padding than v0.1's card spec

## Components (updated)

- **Balance card** — solid primary blue, large tabular-nums balance figure, masked account/GCash number + Verified tag below in white/20%-opacity styling, inverted-contrast white button for the primary action (Withdraw). One per screen, always at the top.
- **Dense row** (replaces the v0.1 "Card" pattern for lists) — small status dot (colored per tint token) + title + one line of gray meta text, tabular-nums price right-aligned, compact single-word action button if applicable. Built for scanning many items quickly, not for standing alone.
- **Status dot** — replaces large pastel badges for in-context list items. A badge is still fine as a standalone element (e.g. inside a detail view), but inside a dense list, a dot + label is enough and keeps rows scannable.
- **Escrow status bar, timer display, agreement modal, filled-slot states** — all retained from v0.1 exactly as specified; these were never in conflict with the banking-app direction.

## What changed from v0.1

- Primary design reference: Notion → mobile banking apps (money screens) + Linear/Stripe (everything else)
- Status indicators in lists: large pastel badges → small dots, badges reserved for standalone/detail contexts
- Numerals: no prior rule → tabular-nums + monospace required for all financial figures
- New: the balance/escrow amount gets explicit card treatment and prominence; new: "one loud element" rule to prevent that prominence from spreading and flattening the hierarchy
