| version | 0.1 |
| status | pre-build — validation phase |
| name | (working title TBD — candidates: SubokAn, TestMo, UserPH) |
| description | A user testing platform for the Filipino tech community. Posters pay to have real testers evaluate their web app against a task list within a set time window; testers earn a per-task rate drawn from the poster's budget. |

# Project Spec — v0.1

This is the first versioned planning set for the platform. Each file below covers one domain, the same way a `DESIGN.md` covers one brand system — read whichever one is relevant to what you're working on, not all of them at once.

## Files in this set

1. **[OVERVIEW.md](./01-OVERVIEW.md)** — what this is, who it's for, why it's different, current status
2. **[MECHANICS.md](./02-MECHANICS.md)** — the core product logic: listings, slot math, escrow, review/rejection, timers
3. **[TECHSTACK.md](./03-TECHSTACK.md)** — what to build with, and what's genuinely new vs. reused
4. **[SECURITY.md](./04-SECURITY.md)** — non-negotiable protections + the recurring per-version audit checklist
5. **[DESIGN.md](./05-DESIGN.md)** — the visual system (adapted from Notion's design language), plus psychology-driven interaction rules
6. **[WORKFLOW.md](./06-WORKFLOW.md)** — the success.log / fail.log + git checkpoint discipline for building this
7. **[ROADMAP.md](./07-ROADMAP.md)** — the validation-before-build sequence, and what triggers moving from v0.1 to v0.2

## Versioning rule for this project

- **v0.1** = planning only. No code exists yet. This set of files *is* v0.1.
- **v0.2** = first working manual-pilot artifacts (forms, manual tracking) — see ROADMAP.md Step 2.
- **v1.0** = first real coded build, informed by what the manual pilot proves out.

Each time a file in this set changes meaningfully, bump its own version line at the top — don't bump every file just because one changed.
