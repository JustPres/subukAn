| version | 0.1 |
| name | techstack |
| description | What to build with — reused stack vs. genuinely new pieces this project requires. |

# Tech Stack

## Reused (already known from Allan Superstore / the trades marketplace spec)

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- Vercel (hosting/deployment)

## New for this project

| Need | Tool | Why |
|---|---|---|
| Real escrow (funds held at posting, not just tracked as a number) | PayMongo or Xendit | PH-specific processors supporting GCash with actual fund-holding/payout, unlike the "upload payment proof" pattern used on Allan Superstore |
| Scheduled auto-release / auto-stop timers | Supabase pg_cron, Vercel Cron Jobs, or Inngest/trigger.dev if timing logic grows complex | Supabase alone doesn't fire actions on a future timer by itself |
| Screen recordings (≤100MB) + images | Supabase Storage | Sufficient at MVP scale; revisit (Cloudflare R2, Mux) only if video becomes a bandwidth bottleneck |
| Screen recording capture (tester side) | Browser's native MediaRecorder API | Built into the browser, no extra service |
| Email notifications | Resend | Pairs cleanly with Next.js, simple API |
| In-app notifications | Supabase Realtime | Push updates to a notifications table without a separate service |
| Auth (Google + GitHub) | Supabase Auth built-in OAuth providers | No extra library — GitHub login lowers friction given the dev-heavy audience |
| Anti-copy on questions | Plain frontend JS (disable text selection/right-click/copy events) | Deters casual copying only — does not prevent screenshots, don't over-invest here |

## Honest flag

PayMongo/Xendit integration and the cron/scheduling layer are genuinely new skills beyond what Allan Superstore required. These are exactly the two things worth testing conceptually via the manual pilot (tracked by hand) before committing real build time to learning the APIs — see `ROADMAP.md`.
