# film-studio conventions

Every later task must follow these rules.

## 1. Product
film-studio turns a topic into a video through a crew of roles:
Director, Writer, Selector, Talent Acquisition, Storyboard, Treasurer,
VFX Director, Renderer. Independent reviewers (Producer, Director-review)
judge taste; the 25 AI tells are checked by `scripts/check-ai-tells.js`, not by a reviewer. Skill lives in `.claude/skills/film-studio/`; subagents in
`.claude/agents/`.

## 2. Build rules
- No video rendering and no network image/video generation during build phases.
- Stills only when asked.
- Small, commit-friendly changes.
- Every role file stays under its stated line limit.

## 3. Quality gate
A stage passes only when BOTH reviewers give an average of 9.0 or more across
10 parameters AND no single parameter is below 7.
- Max 3 review rounds per stage.
- After round 3, continue with the best version and log the weak parameters
  in `work/flags.md`.

## 4. Markers
- `[VERIFY: ...]` marks an unverified fact in a script.
- `[CHECK]` marks an unverified technical claim in docs.

## 5. Secrets
- Never print, log, echo, or write API keys into any file.
- Keys live only in environment variables or `.env`.
- `.env` must be listed in `.gitignore`.

## 6. Licensing
- Use only permissive sources; check the current terms.
- Record every sourced asset in `work/credits.json`.
- Unclear license means reject.

## 7. Budget
All work is measured in budget units tracked by `scripts/ledger.js`.

## 8. Handoffs
- Each stage reads only the files it needs from `work/`.
- Each stage writes exactly one output file.
- `work/state.json` records stage status, so a failed run resumes instead of
  restarting.

## 9. Style gate
Offer only styles whose frontmatter has `requires: none` or `requires: web`.
Never offer a style that needs a paid generation API.

## 10. Failure rule
On a render or tool failure, stop and report. Never loop.
