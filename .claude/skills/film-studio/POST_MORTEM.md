# POST_MORTEM: the preview-sheet build (prompt 01)

Date: 2026-11-14. Status: **template build HALTED. Architecture below is LOCKED.**

Goal of the skill: a lightweight model (Haiku 5.5 Low, Sonnet 5.5 Low) reliably produces an 8/10+
short-form video. The preview build did not get there. This file records why, and the rules every
later prompt must obey. If a later instruction conflicts with a law here, the law wins until the user
changes this file.

## 0. Halt record
- No preview or render process was running at the time of the halt (checked the process list).
- `scripts/preview.js` and the `Sheet` composition are **frozen**: do not run them, do not render more
  sheets, do not add palettes or kits to the 12 old styles.
- Nothing was deleted. The old kits, design systems and `previews/` stay on disk as evidence until the
  replacement for each one passes its validator.
- Audited: 20 preview sheets across 12 styles. On disk today: 24 sheets (2 per style) in `previews/`.

## 1. The six failure modes

### F1. One wireframe, twelve skins
Every sheet is the same 10 panels with the same copy: "Why small habits win", "42%", "Placeholder
quote", "Time or money", "The recipe".
- Root cause: `library/preview.json` is a single shared specimen, and `scripts/preview.js` feeds it to
  every kit. The engine has 9 closed layouts (`title, stat, figure, versus, chart, object, quote,
  timeline, list`), so a kit can only recolour and re-font a fixed grid.
- Effect: a style could not show a composition, a subject or a motion idea of its own. Reviewers were
  comparing fonts and background textures, not styles.

### F2. Lifeless stick figures
Every character is the same circle head, slab torso and line limbs.
- Root cause: one rig in `components/engine/figure.ts` (11 rotation-only poses, `head` / `body: 'line'`
  / `limbStyle` template) shared by all 12 kits. A kit changes stroke and fill, never anatomy.
- Effect: no face, no hands, no weight, no depth layers. This single asset reads as "AI demo" in under
  a second and caps every figure panel at about 4/10.

### F3. Print themes, not video styles
Six of the twelve (riso, noir, cutout, blueprint, watercolor, sketchbook) are static print looks.
- Root cause: styles were chosen as art-history categories and defined by paper, ink and texture.
  Nothing in a style definition described movement, pacing or a native platform format.
- Effect: they look acceptable as a poster and dead as a Reel or Short. None matches what creators
  actually publish in 9:16.

### F4. Starved palettes, unreadable labels
Every palette in every `design-system.json` has exactly 6 distinct colours; in use, 4 to 6. Small
labels fail contrast, for example the dark-red kickers on black in `previews/noir/classic-sheet.png`.
- Root cause: one fixed 6-slot palette shape for all styles; contrast was checked only for the pairs
  listed in `contrast_pairs`, not for every text-on-background pair that actually renders.
- Effect: flat, monotone frames with no room for state colours (success, warning, data series), and
  text a phone viewer cannot read.

### F5. No diegetic UI, no motion resets
No panel contains an interface element that belongs to the world of the video (a notification, a
search bar, a progress ring, a chat bubble). Panels hold still for their whole 3 seconds.
- Root cause: no widget library exists; the layout list has no UI layouts; panel duration is the only
  pacing control and nothing requires a visual change inside or between panels.
- Effect: frames read as slides. Retention depends on a new visual event every few seconds and there
  were none.

### F6. Blog-title hooks
Scripts open with a passive headline or question ("Why small habits win").
- Root cause: `roles/writer.md` and `rubrics/script.md` score structure and facts but never require a
  curiosity gap in the first seconds; the examples in `schemas/` model the weak opening.
- Effect: nothing to stop the scroll. The viewer is told the topic instead of being given a reason to
  stay.

### The common cause
The build optimised for **coverage** (12 styles, 10 palettes each, 86 effects) through **one shared
engine path**. Shared paths are cheap to build and guarantee sameness. Every law below removes a
shared default or replaces a judgment call with data and a script.

## 2. The seven laws (non-negotiable)

**Law 1. Zero shared preview wireframes.**
Each style owns its own preview: its own scenes, copy, subject and composition, written for that
style. No file may feed the same panels or the same copy to two styles. `library/preview.json` is
retired. A validator fails the build if two styles' previews share a headline or a panel sequence.

**Law 2. Zero stick figures.**
A subject is one of two things:
- **Layered subject:** a vector or 3D character or object built from separate layers (at least
  head/face, torso, limbs or parts, shadow) with depth, expression and secondary motion; or
- **UI-first mode:** no character at all; the screen, the widgets and the type carry the story.
Circle-and-line figures are banned in every style. A style declares which mode it uses.

**Law 3. Twelve creator-native Reels/Shorts styles.**
All 12 styles are formats that creators publish in 9:16 today, each defined by its motion and pacing
first and its look second. The six print themes are removed from the offer. A style that cannot
describe what moves every 3 to 4 seconds is not a style.

**Law 4. Two-tier palettes with WCAG AA.**
- **Focused:** 3 to 5 colours. For type-led and UI-first styles.
- **Expanded:** 8 to 12 colours. For illustrated and data-heavy styles; includes state and series
  colours.
Every palette declares its tier. Every text-on-background pair that can render must pass WCAG AA
(4.5:1 for body text, 3:1 for large text 24 px+ or 19 px+ bold). Checked by script on all pairs, not
on a hand-picked list.

**Law 5. Fifty diegetic micro-widgets.**
A library of 50 small in-world UI elements (notifications, search bars, toggles, progress rings,
counters, chat bubbles, map pins, price tags and so on), each a component with an id, props, an
entrance and an exit. Storyboards place widgets by id. Every film uses them; a film with none fails
validation unless its style documents an exemption.

**Law 6. Pacing: 3 to 4 second visual resets, Zero Dead Velocity, frame-synced SFX.**
- **Reset:** a clear visual change (cut, camera move, layout change, widget entrance, scale shift) at
  least every 3 to 4 seconds.
- **Zero Dead Velocity:** no frame range where nothing on screen is moving. A hold is still a slow
  push, drift or loop.
- **Frame-synced SFX:** every reset and every emphasis has a sound cue pinned to a frame number in the
  plan, not to a rough time.
All three are computed from the plan JSON by a validator.

**Law 7. Paradox or assumption-flip hook in 0 to 3 seconds.**
The first 3 seconds state a paradox, or flip something the viewer believes, and open a gap the video
must close. Banned as openers: a title, a "Why X..." or "How to..." question, a greeting, a topic
announcement. The hook is on screen as text and motion, not only in the voiceover.

## 3. The 3-Layer Progressive Disclosure contract

The skill must be cheap to run on a small model. Tokens are spent in three layers and no layer may
leak into another.

| Layer | What | Budget | Loaded when |
|---|---|---|---|
| 1. Router | `SKILL.md` | **under 110 lines** | Always. Holds the pipeline, the laws by name, and a table that says which one file to open next. No craft detail. |
| 2. Manuals | One deep manual per persona and per style | **100 to 160 lines each** | **Strictly one file per active persona or style.** The manual for the stage in progress, plus the one style in the brief when that stage needs it. |
| 3. Validators | Deterministic Node scripts in `scripts/` | **0 tokens of reasoning** | Run, never read. Output is PASS or a short list of FAIL lines with the fix. |

Rules:
1. **One manual at a time.** Finishing a stage means its manual is no longer needed; do not carry it
   forward, do not pre-load the next one. Never open two style manuals in one run.
2. **Manuals are self-contained.** A manual may not say "see also" another manual. What a persona
   needs is in its file or in data a script reads.
3. **Data is not prose.** Palettes, widget ids, effect ids, timing limits and banned words live in
   JSON that scripts read. The model picks by id; it never reads the full library.
4. **QA is scripted.** Anything that can be counted or compared (contrast, palette tier, reset
   interval, dead velocity, SFX frames, hook pattern, shared preview copy, stick-figure primitives,
   line budgets) is a validator check. Model review is kept for taste only.
5. **Validators talk in fixes.** A FAIL line names the file, the value found, the limit, and what to
   change, so a small model can repair it without loading a manual.
6. **Budgets are enforced by script.** A file over its line budget fails the static check.

## 4. What this means for the existing files
**Update, prompt 02 (2026-11-14):** on the user's instruction the 12 legacy style folders, their 12
kits, `library/preview.json`, `scripts/preview.js` and the 28-tell rubric were deleted before their
replacements exist. The list below is the state at prompt 01 and is kept as history. The line limits
in the static check now match the contract.

- Superseded, pending rebuild: `library/preview.json`, `scripts/preview.js`,
  `components/engine/figure.ts`, all 12 `styles/*` folders and `components/styles/*` kits, the 6-slot
  palette shape, the hook rules in `roles/writer.md` and `rubrics/script.md`.
- Out of line with the contract today: `scripts/check-static.js` caps `SKILL.md` and `style.md` at 100
  lines and role files at 80; the 9 role files and 12 style files are 57 to 73 lines. These limits
  move to the new budgets when the manuals are rebuilt.
- Kept: the JSON-driven `Film` composition, schemas, ledger, credits, state and render scripts, the
  effects library. They are changed only where a law requires it.
- Nothing is deleted until its replacement passes its validator.
