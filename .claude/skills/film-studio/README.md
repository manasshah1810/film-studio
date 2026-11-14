# film-studio

A Claude Code skill that turns a topic into a short, art-directed video. Everything on screen is
drawn in code with Remotion: no image or video generation service, no stock art by default, no paid
API needed. A persona crew writes, casts, lays out, animates and scores the film; every rule that can
be counted is checked by a script, so a small model at low effort gets the same gate as a large one.

## Install (one line)
```
git clone --depth 1 https://github.com/manasshah1810/film-studio.git && cd film-studio/.claude/skills/film-studio/components && npm install
```
Then open Claude Code in `film-studio/`. To use the skill in another project, copy
`.claude/skills/film-studio/` into that project's `.claude/skills/` and run `npm install` in its
`components/`. Needs Node 18 or newer (built on 22), and `ffmpeg` / `ffprobe` on PATH for render checks.
The first render downloads a headless browser.

## Use it
Say only the topic: "make a video on why Nokia fell". The Director asks four questions, one at a
time (platform, length, style with three picks and a reason each, voiceover); say "auto" to skip them.
Then the crew runs on its own and stops only for: budget approval, an unclear licence or a trademark,
and unsourced facts before render. It always renders Pass 1, runs every check, has the QA Inspector
critique it, applies the fixes and renders the Pass 2 polish before showing you the video.
Working files go in `work/`. An interrupted run resumes from the last completed persona stage
(`work/state.json`).

## How a model is routed (one file per persona)
| Stage | Persona | Opens only | Writes |
|---|---|---|---|
| 1 | Director | `personas/director.md` | `work/brief.json` |
| 2 | Treasurer | `roles/treasurer.md` | `work/budget.json` |
| 3 | Scriptwriter | `personas/scriptwriter.md` | `work/script.json` |
| 4 | Selector, Casting and Rig Designer | `roles/selector.md`, `personas/casting-rig-designer.md` | `work/needs.json`, `work/cast.json` |
| 5 | Art Director | `personas/art-director.md` + one `styles/<id>/style.md` | `work/storyboard.json` |
| 6 | Widget Integrator | `personas/widget-integrator.md` | `work/widgets.json` |
| 7 | Motion Choreographer | `personas/motion-choreographer.md` | `work/motion.json` |
| 8 | VFX Director | `roles/vfx-director.md` | `work/vfx-plan.json` |
| 9 | Sound Designer | `personas/sound-designer.md` | `work/audio-cues.json` |
| 10 | scripts | nothing | `work/render-manifest.json` |
| 11 | Renderer, Pass 1 | `roles/renderer.md` | `work/out/pass1.mp4` |
| 12 | QA Inspector | `personas/qa-inspector.md` | `work/reviews/qa-audit.json` |
| 13 | Renderer, Pass 2 | `roles/renderer.md` | `work/out/final.mp4` |
Full card with inputs and gates: `references/director-cheatsheet.md`. `node scripts/state-manager.js
next work` prints the row to run now.

## The pipeline contract
- `schemas/brief`, `script`, `storyboard` and `render-manifest` `.schema.json` enforce the palette tier
  (focused 3-5 colours, expanded 8-12), caption chunks of 5 words or fewer, a visual event every 3.5 s
  or less, anchored widget boxes inside the 9:16 safe rectangle, and SFX cues tied to a keyframe.
- `scripts/build-film.js` joins the persona files into `work/render-manifest.json`: all frames, no hex,
  no font names, no topic text in code.
- `components/src/compositions/FilmComposition.tsx` renders only that manifest: it loads the chosen
  style's `design-system.json` by id, draws layered narrators and actors (or a UI-first frame), mounts
  any of the 50 widgets (`library/widgets.json`, `components/widgets/registry.ts`), runs the four motion
  modules in `components/motions/`, plays SFX on their frames and ducks music under the voice.
  `showSafeZones` draws the bottom 20% and right 15% dead zones (on for Pass 1).

## Commands (run from the skill folder)
| Command | What it does |
|---|---|
| `node scripts/run-all-checks.js work` | the whole gate: schemas, design lock and WCAG AA, safe zones, 25 AI tells; JSON fix lines on failure; `--selftest` |
| `node scripts/state-manager.js next work` | the stage to run now (resume); `set`, `show` |
| `node scripts/pick-design.js --suggest "<topic>"` | top 3 styles for a topic; `work` locks tier, palette, pairing, seed |
| `node scripts/validate-schema.js --work work` | schema and cross-file checks; `render-manifest <file>` for one manifest |
| `node scripts/build-film.js work` | write `work/render-manifest.json` |
| `node scripts/stills.js --manifest work/render-manifest.json --all` | one still per panel; `--safe-zones` |
| `node scripts/render.js work --pass 1` or `--pass 2` | review render (half size, safe zones) or the polish render |
| `node scripts/check-render.js work --pass 2` | size, frame rate, length, audio, blank-frame check |
| `node scripts/ledger.js estimate work` | budget dry run; `init`, `spend`, `status` |
| `node scripts/voice.js check` | which voices can run here; `make work` to generate |
| `node scripts/credits.js check work` | licence ledger; `add`, `fonts`, `text`, `licences` |
| `node scripts/check-static.js` | check the skill itself after editing it |

## Layout
```
SKILL.md                 the Director's map: trigger rule, stages, gates, rules
personas/                the 8 persona manuals          roles/   treasurer, selector, vfx, renderer, voice
references/              director-cheatsheet.md, style-cheatsheet.md, ai-tells.md, widget and motion manuals
styles/<id>/             style.md (the style manual), design-system.json
schemas/                 JSON schemas and one worked example run
library/                 widgets.json, platforms.json, vfx/, costs.json, licences.json
scripts/                 every command above; fixtures/pipeline-pass is a full worked work folder
components/              Remotion project: src/compositions/FilmComposition.tsx, Root.tsx, widgets/,
                         motions/, effects/, styles/<id>/Preview.tsx
../../agents/            producer, director-review (the independent reviewers)
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

## Limits worth knowing
- Characters are layered vector shapes with idle motion (breathing, head bob, arm sway, a nod while
  speaking). This is motion design, not character animation.
- Widgets are laid out on the 1080 x 1920 frame; other ratios are reframed, not redesigned.
- SFX and music files are not bundled: put them in `work/audio/sfx/` and `work/audio/music/`; a cue
  without a file stays silent and is listed as a warning.
- Platform safe-area numbers come from third-party guides and are marked [CHECK].
- Fonts load from Google Fonts at render time, so the first render of a pairing needs a network.
