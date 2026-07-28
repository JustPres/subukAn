| version | 0.1 |
| name | mechanics |
| description | Core product logic: listings, slot math, task structure, escrow, review/rejection, timers. |

# Mechanics

## Listing creation

- Poster selects a per-tester rate from a discrete set of custom pricing tiers (₱50, ₱100, ₱200, ₱300, ₱400, ₱500, up to ₱1000, ₱1100, etc.).
- Poster sets a custom number of target participants (slots) that scales based on the desired reach and budget. For higher budget settings, the participant count can scale to 10 or more.
- The system calculates the total escrow budget based on `Rate × Participants` (e.g., 5 participants at ₱100/tester = ₱500 budget; 10 participants at ₱500/tester = ₱5,000 budget; 12 participants at ₱1,100/tester = ₱13,200 budget).
- Poster sets a review time window per task: 30 minutes or 1 hour.
- **Suggested but not enforced:** posters can run a 1-slot "preview round" first to sanity-check the task description and questions before committing the full budget. This uses the exact same mechanic as a full listing — just with 1 slot — so no separate logic is needed, only a UI nudge suggesting it.

## Task structure

Each listing includes:
- A task description the tester must read before starting
- A list of questions set by the poster
- **Per-task structured metrics (new):** a Yes/No "did you complete this task?", an auto-captured time-on-task duration, and a 1–5 difficulty/satisfaction rating — collected alongside the open-ended answers, not instead of them
- Support attachments per question: a recording up to 100MB and/or images

This mix of structured + open-ended data is what turns a submission into a usable insight report, not just a pile of comments.

## Tester flow

1. Tester reads the task description and clicks through an agreement (real payment is involved) before starting
2. Tester does **not** need to wait for the roster to fill — they can join and start immediately once a slot is open
3. Tester completes tasks within the poster's set time window, answering structured + open-ended questions and attaching recordings/images
4. If the tester doesn't submit before the window closes, the session auto-stops and the tester is notified (email/in-app) — the poster can still choose to review the incomplete submission

## Tester profile (new, lightweight)

At signup, testers provide basic profile fields: device type (mobile/desktop) and general tech comfort level (e.g. student/dev, casual user, non-technical). This isn't a filtering/matching engine yet — it's shown to posters in the insight report so they know who actually tested their site. Full persona-based tester matching is backlog (see `ROADMAP.md`).

## Escrow

- Funds move out of the poster's account into platform-held escrow **at the moment of posting**, not at review time. This is the standard marketplace pattern (Upwork/Fiverr-style) and is required so tester payouts don't depend on the poster's account still holding the money later.
- Requires a PH payment processor with real fund-holding/payout support (PayMongo or Xendit) — see `TECHSTACK.md`.

## Review and payment release

- Poster reviews each tester's submission **individually**, not as a batch, and releases payment per tester once satisfied it was completed genuinely.
- **Auto-release rule:** if the poster doesn't review in time, payment auto-releases, scaled to the review time window the poster originally set (not a flat rule across all listings).
- **Accountability rule:** if the poster ignores review entirely, they receive a warning, and the tester still gets paid from the escrowed funds regardless.

## Unfilled slots

- Only the amount for testers who actually completed the task is paid out; the remainder of an unfilled slot budget is forfeited with the listing (not refunded).
- The poster receives an **insight notification** on listing completion, including: date/time, who joined, per-tester time-to-answer, total listing duration, budget set, per-tester payout, and (new) the structured metrics summary — average task completion rate, average time-on-task, average satisfaction rating across testers.

## Rejection flow

- If a poster rejects a submission, they select a reason from a short dropdown (didn't follow instructions, answers don't match the recording, incomplete, low effort) plus a brief 2–3 sentence explanation.
- Voice or video justification is **optional**, not a mandatory 500-word requirement — disproportionate friction for transactions in these pricing tiers (₱50–₱1100+).
- Disputed rejections escalate to manual review (founder-reviewed in the early stage, not automated).

## Anti-copy / anti-screenshot

- Questions are protected from casual copying via frontend JS (disabled text selection/right-click/copy events).
- **Honest limitation:** this deters casual copying only — it does not prevent screenshots. Real protection against leaked task/question content is legal (an NDA-style clause in the click-through agreement) and limited exposure (gated details, signed URLs), not a JavaScript trick.

## Future test types (not v0.1 — see ROADMAP.md backlog)

- **Quick Impression / Five-Second Test:** show a screen for 5 seconds, then ask what the tester remembers. Cheap, fast, good for a lower price tier — but needs a different timed-display task format than the core async model, so it's a v1.1 fast-follow rather than part of the initial build.
