| version | 0.1 |
| name | workflow |
| description | Success/fail logging and git checkpoint discipline for building this project. |

# Workflow

## Principle

Every successful integration gets logged and committed immediately. Every failure gets logged without a commit. This keeps a running trail of verified-working checkpoints to fall back to.

## Log formats

**`success.log`** — one line per successful integration:
```
[2026-07-27 14:32] SUCCESS: PayMongo webhook verification — signature check passes on test payment — commit: a3f9c1e
```

**`fail.log`** — one line per failed attempt:
```
[2026-07-27 13:50] FAIL: PayMongo webhook verification — signature mismatch on retry — investigating idempotency key handling
```

## Scripts

```bash
#!/bin/bash
# scripts/log-success.sh
# Usage: ./scripts/log-success.sh "Feature name" "short description"
COMMIT_HASH=$(git rev-parse --short HEAD)
echo "[$(date '+%Y-%m-%d %H:%M')] SUCCESS: $1 — $2 — commit: $COMMIT_HASH" >> success.log
```

```bash
#!/bin/bash
# scripts/log-fail.sh
# Usage: ./scripts/log-fail.sh "Feature name" "what went wrong"
echo "[$(date '+%Y-%m-%d %H:%M')] FAIL: $1 — $2" >> fail.log
```

## The workflow this creates

1. Build/integrate a piece (e.g. escrow release logic)
2. Test it actually works
3. `git add . && git commit -m "feat: escrow release on poster approval"`
4. `./scripts/log-success.sh "Escrow release" "releases to tester on poster approval, tested with 3 mock submissions"` — grabs the commit hash just made, linking the log entry to a working checkpoint
5. If something breaks later, it goes to `fail.log` (no commit). `git log --oneline` finds the last SUCCESS commit hash, and `git reset --hard <hash>` returns to the last known-good state instantly

## Repo convention

Both log files live in the repo (not gitignored) so the history of what's actually been verified travels with the code — useful once teammates are involved, the same way Codex prompts were shared across the capstone team.

## Related

See `04-SECURITY.md` for the recurring per-version security audit — run it before any version that touches auth, payments, or file uploads gets its success.log entry and commit.
