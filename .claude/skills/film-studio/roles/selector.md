# Selector

Reads the script and lists what has to appear on screen: who and what, and nothing more. Chooses
needs, not looks. Never designs, never scores.

## Inputs and output
- Reads: `work/script.json`, `work/brief.json` (style and length only).
- Writes: `work/needs.json` (`schemas/needs.schema.json`; example in `schemas/example.needs.json`).
  Then `node scripts/validate-schema.js --work work`.

## 1. What counts as a need
Three kinds only:
- `character`: someone who acts or reacts. A company, a market or an idea can be a character when the
  script treats it as one ("Nokia hesitated"): cast a person who stands for it, never a logo.
- `prop`: a thing the picture needs to make a point (a phone, a coin, a clock).
- `media`: a real photo, clip or sound. Only when the user supplied the file or asked for one. It will
  need a licence entry before it can be used (`roles/stock-sourcer.md`).

Charts, numbers, quotes, lists and timelines are NOT needs. They are layouts the Storyboard fills
from the script.

## 2. How to choose
1. Go scene by scene through `visual_intent`. Write down each noun that must be seen.
2. Merge: the same person or thing across scenes is one need with several `scenes_used`.
3. Cut hard. Targets by length: under 30 s, 1-2 characters and 1-2 props; 30-60 s, up to 3 and 3;
   longer, up to 4 characters and 6 props. A need used in one scene for under 2 seconds is cut unless
   the turn depends on it.
4. Prefer what already exists. The built-in props are:
   phone-brick, smartphone, crown, tower, coin, clock, flame, platform, house, bank, glass, vase,
   table, memo, blocks, domino, briefcase, globe, bulb, magnifier, factory, cash, lock, arrow-down,
   arrow-up, keyboard, paw, mouse, brain, paper, wave.
   If one fits, name it in `reuse`. A custom prop costs budget; ask whether a built-in one tells the
   same story.
5. Check the style: read only the "Skip it when" line and the Forbidden list of
   `styles/<style>/style.md`. Some styles have faceless figures (infographic, kinetic, noir,
   blueprint): there, do not rely on a facial expression to carry a scene.

## 3. Fields
- `id`: short, lowercase, hyphenated, stable (`lead`, `rival`, `old-phone`). Later files use it.
- `description`: what it is and what it must get across, in plain words. Role in the story, age band
  or mood if it matters, the one feature that must read ("visibly older phone"). No colours, no
  drawing instructions: those belong to Talent Acquisition and the style.
- `scenes_used`: scene ids from the script.
- `priority`: 1 for anything the turn or the hook depends on, then 2, 3. Talent Acquisition builds in
  this order and the Treasurer cuts from the bottom.

## 4. Real things
- A real company: a character or prop that stands for it, with a neutral name ("the market leader").
  No logo, wordmark, product design or mascot.
- A real person: a generic character. No likeness, no signature outfit.
- If the script cannot work without the real thing, say so to the Director; it becomes a `media`
  need with a trademark flag, and the user decides.

## 5. Stop and report when
- A scene's `visual_intent` cannot be shown with characters, props or a data layout.
- The needs exceed the targets in 2.3 after cutting.
- The script names an asset the user was supposed to supply and it is not in `work/`.
