# FINAL_REPORT: OneCoin film-studio run

**Status: INCOMPLETE. No video was rendered.** Pass 1 failed (stop-and-report rule, CLAUDE.md section 10), so there is no `pass1.mp4`, no `final.mp4`, no QA audit and no Pass 2 polish.

## Setup
Instagram Reels, 48 s target (script runs 45.0 s), `dark-neon-dataviz` / `obsidian-cyan` (focused) / `grotesk-inter-jb`, captions only, seed `onecoin-scam-20261114-1`. Budget dry run 46 of 100 units, treated as approved from the "full autonomous" note.

## Stage results (work files in `.claude/skills/film-studio/work/`)
| Stage | Result |
|---|---|
| script | flagged after round 3: Producer 8.8, Director-review 8.7 (gate 9.0). Automated checks pass. All facts carry a source URL; none is open as [VERIFY]. |
| casting | passed. Props only (coin, cash), ui-first style. |
| storyboard | flagged after round 3: Producer 8.1, Director-review 8.0. 15 panels, automated checks pass. No proof sheet (stills only when asked). |
| widgets | flagged: no widget rubric exists, taste review skipped. Three widgets, script words only. |
| motion | passed (script checks). Largest reset gap 96 frames. |
| vfx | flagged: round 1 only (8.3 / 8.1); fixes applied, not re-reviewed. Two effects. |
| sound | cue sheet passes `build-film.js`, but no audio files exist, so all 35 cues are silent and there is no music bed. |
| checks | `run-all-checks.js work` PASS (schemas, design, safe zones, 25 AI tells). |
| pass1 | FAILED: `render.js` could not download Remotion's Chrome Headless Shell (`getaddrinfo ENOTFOUND remotion.media`). |

Weak parameters are logged in `work/flags.md`.

## Caveats
- s1p1 chart shows a Bitcoin line with invented values, labelled "Illustrative data" on screen.
- `work/brief.json` angle still contains an unused `[VERIFY: no public blockchain existed]`; the script does not make that claim.
- Facts rest on search-result summaries (The Block, Blockworks), not on primary DOJ documents. Check before publishing.
- Budget spent: see `work/budget.json` (casting 2 units recorded).

## Next step
Allow the renderer to reach `remotion.media`, or point it at the preinstalled Chromium (`/opt/pw-browsers/chromium`), then run `node scripts/render.js work --pass 1` once. I did not retry or change the renderer, per the failure rule.
