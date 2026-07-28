| version | 0.1 |
| name | security |
| description | Non-negotiable protections for a platform moving real money, plus the recurring per-version audit checklist. |

# Security

## The threat specific to this business model: sybil / self-dealing fraud

A single person could create a poster account plus multiple tester accounts, post a fake listing, and "test" it themselves across the fake accounts to launder money or farm incentives. Any platform with real payouts attracts this immediately.

**Mitigations:**
- Require phone number verification before someone can join as a tester (not just OAuth login)
- Flag or limit poster-and-tester activity originating from the same device fingerprint or IP
- Manually review the first weeks of activity personally — at pilot scale, this is the best fraud detector available

## Non-negotiable from day one

| Concern | Approach |
|---|---|
| Data access control | Supabase Row Level Security (RLS) on every table, designed in at the schema stage — posters see only their listings, testers see only their own submissions |
| Payment data | Never store card/GCash numbers directly — PayMongo/Xendit handle that. Verify webhook signatures so a fake "payment succeeded" call can't be spoofed. Use idempotency keys so a retried request can't double-charge or double-pay |
| Secrets | API keys in environment variables only, never client-side or committed to GitHub — especially the Supabase service role key, which bypasses RLS if exposed |
| File uploads | Validate file type and size server-side (not just trusting the frontend); serve recordings/images via signed URLs with expiry, not public buckets |
| PII / Data Privacy Act (RA 10173) | Applies once handling real users beyond a private pilot group — a short privacy policy is needed at that point |

## Standard, low-effort (comes mostly free)

- HTTPS is automatic on Vercel
- Supabase Auth handles session tokens and OAuth securely out of the box
- Basic rate limiting on API routes is enough at pilot scale — no need for enterprise WAF tooling yet

## On anti-screenshot specifically

There is no reliable way to block screenshots on the web. Disabling right-click/text-selection stops casual copy-paste, nothing more. The real protection for a poster's questions or unreleased site details is legal (an NDA-style clause in the click-through agreement) plus limited exposure (gated details, signed URLs) — not a JavaScript trick.

## Recurring security audit (every version)

A security pass happens before every version ships — new features can quietly reopen previously-fixed issues (a new table without RLS, a new upload path without validation, etc.).

**Cadence:** before any version that touches auth, payments, or file uploads ships — capstone milestones or releases, not every commit.

**Lightweight checklist, run each version:**

| Check | How |
|---|---|
| RLS still covers every table | Re-check policies against the current schema — new tables/columns are the easiest thing to miss |
| No leaked secrets | GitHub secret scanning (free) or truffleHog, before pushing |
| Dependency vulnerabilities | `npm audit`, or GitHub Dependabot for automatic flagging |
| Auth blocks direct API calls | Test as a logged-out user hitting the API directly, not just checking the UI hides things |
| Payment webhook signature verification | Re-test after any change near payment code — most likely thing to silently break |
| File upload validation | Size/type checks still server-side; signed URLs still short-lived, not public |
| Sybil/fraud pattern check | Manual spot-check for matching poster/tester activity from the same device or IP |
| Gated data truly gated | Confirm listing details aren't fetchable via the anon key after any gating-logic changes |

**Heavier pass (less frequent):** once past the manual pilot and into real live volume, add an OWASP ZAP baseline scan (free) or a second pair of eyes (adviser, security-minded classmate). Not needed at pilot scale — worth planning for before scaling beyond a small trusted group.
