| version | 0.1 |
| name | features |
| description | Full feature list per role, derived from the mechanics already defined — the missing bridge between MECHANICS.md and actual dashboard screens. |

# Features by Role

This file exists because a feature/screen list was never written explicitly — `MECHANICS.md` describes the transactional logic, but not what each role actually sees and can do, screen by screen. Use this as the checklist against any dashboard build or redesign.

## Poster features

**Listings**
- Create a listing: site URL, total budget, per-tester rate (₱50–100), task description, question list, time window (30/60 min)
- See slot count auto-computed from budget ÷ rate as they set it
- Optional 1-slot "preview round" before committing full budget
- View listing status at a glance: open / filling / under review / released / rejected / expired (maps to the pastel status tints in `DESIGN.md`)
- See live slot-fill progress ("3 of 5 filled")
- Duplicate/repost a past listing as a starting point for a new one

**Review & payment**
- Review each tester's submission individually — recording, images, structured metrics (completed Y/N, time-on-task, 1–5 rating), and open-ended answers, all in one place
- Release payment per tester
- Reject a submission: dropdown reason + short required explanation, optional voice/video attachment
- See escrow status in plain language at every stage ("₱500 held — 3 of 5 slots filled" → "Released")
- Receive a warning if review is ignored past the deadline; see that the tester still gets paid automatically

**Insights**
- Post-listing insight report: who joined, time-per-question, total listing duration, budget vs. amount actually paid out, structured metrics summary (avg. completion rate, avg. time-on-task, avg. satisfaction rating)
- View tester profile tags for context (device type, tech comfort level) — not filtering, just visibility for now

**Account**
- Sign in via Google or GitHub
- Manage connected payout/payment method
- View spend history across all past listings, with receipts
- Notification center (review reminders, auto-release notices, rejection disputes)
- View archive of past listings

## Tester features

**Discovery**
- Browse public listing teasers without logging in (budget, slots filled, time left — no full task details)
- View full listing details once logged in (task description, questions, rate, time window)

**Onboarding**
- Sign in via Google or GitHub
- Phone number verification before joining any paid task (fraud mitigation, see `SECURITY.md`)
- Set up profile: device type, general tech comfort level

**Doing a task**
- Join an open slot immediately — no waiting for the roster to fill
- Read the agreement, scroll to the bottom, and explicitly accept before starting (real-money consent, not a bare checkbox)
- Persistent, visible countdown during the active task
- Answer structured metrics (completed Y/N, auto-timed duration, 1–5 rating) and open-ended questions per task
- Attach a recording (≤100MB) and/or images to support answers
- Submit before the time window closes
- If time runs out: automatic stop, in-app/email notification, submission still exists for the poster to review

**After submitting**
- See submission status: pending review / released / rejected
- See the reason if rejected, and a path to dispute it (escalates to manual review)
- View earnings history and total balance
- Withdraw/cash out earnings

**Account**
- Notification center (slot reminders, auto-stop alerts, payment released, rejection notices)

## What's deliberately not here

Anything in the `ROADMAP.md` backlog (persona-based tester filtering, A/B testing, accessibility-specialty tags, debrief threading, benchmark analytics, Five-Second Test) is out of scope for this feature list on purpose — adding it to a dashboard now would be building ahead of what's been validated.
