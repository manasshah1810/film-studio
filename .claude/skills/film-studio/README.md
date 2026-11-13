# film-studio

A Claude Code skill that turns a topic into a short, art-directed video. Everything on screen is
drawn in code with Remotion: no image or video generation service, no stock art by default, no paid
API needed. A crew of roles writes, casts, storyboards and plans effects; two independent reviewers
score every stage; nothing ships under 9.0 without being flagged.

## What you get
- 12 styles, each with 10 palettes, 10 font pairings, its own motion rules, five signature moves, a
  forbidden list, panel recipes, known failure modes and a 10-point rubric:
  whiteboard, cartoon, infographic, kinetic, comic, sketchbook, pixel, cutout, watercolor, noir,
  blueprint, riso.
- One render composition driven by one JSON file. No per-film code is written.
- 86 effects, each a real component, with per-style rules about which ones a style forbids.
- Platform presets for study video, Instagram, YouTube (16:9 and Shorts), TikTok and LinkedIn.
- Voice: captions only, a free local voice, or your own ElevenLabs or OpenAI key from the environment.
- A budget ledger, a licence ledger, resume after failure, and a static check for the skill itself.

## Requirements
- Node 18 or newer (built on 22). `ffmpeg` and `ffprobe` on PATH for render checks and voice timing.
- First run: `cd .claude/skills/film-studio/components && npm install` (Remotion 4, React 19).
  The first still downloads a headless browser; later ones take about 40 seconds.

## Use it
Ask Claude Code for a video: "make a 45 second Instagram video about why Nokia fell".
The Director asks four questions (platform, length, style, voiceover) and then runs on its own,
stopping only for: budget approval, anything with an unclear licence or a trademark, unsourced facts
before render, and your yes on the proof sheet and the 3-second draft.

Working files go in `work/` in your project. A run that stops can be resumed: the skill reads
`work/state.json` and continues from the first unfinished stage.

## Commands (run from the skill folder)
| Command | What it does |
|---|---|
| `node scripts/pick-design.js --suggest "<topic>"` | top 3 styles for a topic |
| `node scripts/preview.js <style> [--palette id] [--pairing id]` | proof sheet of a style, nine layouts |
| `node scripts/pick-design.js work` | lock palette, pairing and seed into the brief |
| `node scripts/ledger.js estimate work` | budget dry run; `init`, `spend`, `status` |
| `node scripts/validate.js --work work` | schema and cross-file checks for every stage file |
| `node scripts/cast-sheet.js work` | one sheet of every character and prop |
| `node scripts/build-film.js work` | join the stage files into `work/film.json` |
| `node scripts/stills.js --film work/film.json --sheet` | contact sheet of every panel |
| `node scripts/voice.js check` | which voices can run here; `make work` to generate |
| `node scripts/render.js work --draft` or `--final` | one 3-second draft, or the final MP4 |
| `node scripts/check-render.js work --final` | size, frame rate, length, audio, blank-frame check |
| `node scripts/credits.js check work` | licence ledger; `add`, `fonts`, `text`, `licences` |
| `node scripts/state.js next work` | where to resume |
| `node scripts/check-static.js` | check the skill itself after editing it |

## Layout
```
SKILL.md                 the Director: questions, stages, gate, rules
roles/                   one file per crew role
rubrics/                 what reviewers score; the 28 AI tells; the review protocol
styles/<id>/             style.md, design-system.json, recipes.md, failures.md, rubric.md
library/platforms/       per-platform rules; platforms.json is the machine-readable preset
library/vfx/             the effect library, style rules, merge recipes
library/costs.json       budget units          library/licences.json   licence allow-list
schema/                  JSON schemas and one worked example run
scripts/                 every command above
components/              Remotion project: engine/, styles/<id>/kit.tsx, effects/
../../agents/            producer, director-review, ai-checker (the independent reviewers)
```

## Safety rules the skill enforces
- **No invented facts.** Unsourced claims are marked `[VERIFY: ...]`, kept off screen and listed
  before render. The validator rejects a number that has no fact entry.
- **No unlicensed assets.** Sourced files need an entry in `work/credits.json` with a licence from
  `library/licences.json`. Unclear licence means reject. Logos, real people and existing characters
  are flagged for your approval.
- **No keys in files.** Voice keys are read from an environment variable or `.env` (keep `.env` in
  `.gitignore`). They are never printed or written. If you paste a key into chat, rotate it.
- **Stop on failure.** A failed script or render is reported once. Nothing loops.

## Add a style
1. `styles/<id>/design-system.json`: 10 palettes with the six roles, 10 pairings, type scale, motion
   with 3-5 named easings, textures, figure template, five signature moves with numbers, forbidden list.
2. `components/styles/<id>/kit.tsx` implementing the `Kit` contract in `components/engine/types.ts`;
   register it in `components/styles/index.ts`.
3. `style.md` (with `requires: none` or `web`), `recipes.md`, `failures.md`, `rubric.md` (10 unique
   parameters). Add the style's banned effect tags to `library/vfx/style-rules.json`.
4. `node scripts/gen-fonts.js`, `node scripts/check-design.js --systems`, `node scripts/preview.js <id>`
   on two palettes, have a reviewer score the sheets with the rubric, then set `status: verified`.
5. `node scripts/check-static.js`.

## Limits worth knowing
- Figures and props are simple vector shapes. This is motion design, not character animation.
- Platform safe-area numbers come from third-party guides and are marked [CHECK].
- Fonts load from Google Fonts at render time, so the first render of a pairing needs a network.
- Hyperframes is not used. Remotion is the only renderer.
