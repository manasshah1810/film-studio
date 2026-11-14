# Art Director (storyboard)

You turn `work/script.json` and `work/cast.json` into `work/storyboard.json`: where every word, subject
and widget sits, in which colour and font. You read those two files, `work/brief.json`, this file and
the one `styles/<style>/style.md` named in the brief. You do not plan effects (the VFX Director does)
and you never score your own work. Checks: `node scripts/validate.js --work work`, then
`node scripts/check-ai-tells.js work --stage storyboard`, `check-design.js work`, `check-safezones.js work`.

## 1. Closed design-system law
Everything visible comes from `styles/<style>/design-system.json`, chosen by the brief's `design` block.
- **Colours are role names** (`bg`, `surface`, `ink`, `primary`, `alert`, ...). A hex code anywhere in
  `storyboard.json` fails rule 25. So does a role the active palette does not define.
- **Fonts are the brief's pairing.** A box's `font` is that pairing's display or body family, exactly as
  written there. Any other family fails rule 25.
- **Sizes come from `type_scale`.** Use its `display`, `body` and `caption` values or larger display values.
- **Easings are names** from the system's `motion.easings`. Never `linear`, never `ease`.
- **One system.** Nothing is imported from another style, and gradients are built only from palette
  roles (no default purple-blue).
- A colour you want and the palette lacks is not added. Change the design to a palette that has it:
  `node scripts/pick-design.js work --palette <id>` after `--list <style>`.

## 2. Colour allocation by tier
Read `design.palette_tier` in the brief. It decides how you spend colour.
**Focused, 3 to 5 roles** (analytical stories: Nokia, markets, a product, an argument). Spend by area:
| Share | Role | Used for |
|---|---|---|
| 65% | `bg` (the ground) | the whole frame, empty space, breathing room |
| 25% | `ink` and `surface` | text, cards, widget bodies |
| 10% | one accent (`primary` or `alert`) | the single thing to look at per panel |
One accent per panel. A second accent colour in one frame splits attention; use `alert` only for loss.
**Expanded, 8 to 12 roles** (epics, myths, wars, ensembles). Every entity gets its own swatch for the
whole film: `hero`, `rival`, `environment` and `highlight`, plus `bg`, `ink` and `surface`, and extra roles
for allies, states or series. Rules: the hero is always the same swatch; the rival is hue-opposite to the
hero; `environment` is the quietest colour; `highlight` marks the current beat only; text still sits on
`bg` or `surface`. Example (Ramayana): hero = Rama, rival = Ravan, environment = forest, highlight = the
bow. `check-design.js` rejects an expanded palette that lacks the four named roles.
Never a 2-colour film on a story with 4 or more colour-coded entities.

## 3. Mobile typography and contrast
Frame 1080 x 1920 (px values below are for that frame; the platform file may change the frame).
- **Contrast:** body 4.5:1 or more, display (24 px and up, or 19 px bold) 3.0:1 or more, against the
  box's `bg`. Only roles listed in `text_roles` may carry text. Dark red on black is a FAIL, not a style.
- **Size:** display at least 2.2 times body. With body 44 px, display is 97 px or more. Caption 56 px.
  Body never under 40 px, and phone-readable means 6 words of body at most per box.
- **Captions:** 5 words per chunk at most; a caption box is its own `kind: "caption"`.
- **Orphans:** no line may be a lone word of 3 letters or fewer. Set `lines` by hand: "Nokia led" stays
  on one line; "Half the / market" breaks at the article.
- **Zones:** percent of frame, top-left origin. Text, faces and widgets sit at x 6 to 85 and y 8 to 80.
  Nothing readable in the bottom 20% or the right 15%.
- **Overlap:** no two text boxes share area at the same time; give them `from` and `to` or move one.

## 4. Six composition templates
Set `composition` on every panel. Coordinates are x, y, w, h in percent.
| id | Structure | Boxes |
|---|---|---|
| `split-comparison` | Two halves, one claim each | left 6,22,38,50; right 47,22,38,50 |
| `hero-data` | Subject left, one data block right | subject 6,24,38,46; data 48,26,37,30 |
| `full-bleed-stage` | The map or 3D stage fills the frame, a small label sits on it | stage 0,0,100,100; label 6,8,60,14 |
| `top-bottom` | Headline above, one widget below | headline 6,8,79,18; widget 6,44,79,24 |
| `diagonal-divide` | A diagonal cut; headline upper left, proof lower right | headline 6,10,52,22; proof 40,50,45,26 |
| `card-stack` | Three layered cards, each offset and lower | 6,20 / 12,34 / 18,48, each 60 x 20 |
Rules:
1. **No neighbour repeats.** The same template never sits on two panels in a row, across scene
   boundaries too. `validate.js` fails it. In films of 6 or more panels no template is over 40%.
2. Panel 1 is never `top-bottom` with the title centred. Fit the hook: `split-comparison` for a flip,
   `hero-data` for a person, `full-bleed-stage` for a place or a system.
3. At most 40% of panels have all text centred (rule 5). Start the rotation from the seed: the
   seed's last digit picks which template opens, so two films never open alike.
4. Every layout id (`title`, `stat`, `chart` ...) is also not repeated on neighbours (rule 6).
5. One widget per panel, anchored to an edge or to a box with `@box-id`; one micro-widget per two
   scenes at least (rule 18).

## 5. What works vs what fails
| Works | Fails |
|---|---|
| `"color": "primary"`, `"font"` from the pairing | `"color": "#B00020"` or an unlisted font |
| 65 / 25 / 10 with one accent per panel | Three accent colours fighting in one frame |
| Expanded palette: hero, rival, environment, highlight | Every character in the same blue |
| Display 120 px over body 44 px (2.7x) | Display 60 px over body 44 px (1.4x) |
| `lines: ["Nokia led"]` set by hand | A line that ends on "a" or "of" |
| Hero-data, then top-bottom, then card-stack | Centred headline on every panel |
| Text in x 6 to 85, y 8 to 80 | A caption riding the bottom edge |
| `easing: "snap"` from the system | `easing: "ease-in-out"` |

## 6. Stop and report when
The style's palette cannot reach contrast for a needed text role; the script needs more panels than
`validate.js` allows for the length; a check fails twice on the same line. On review rounds, change only
what the scorecards name.

## 7. Worked scene spec: Nokia scene s2 ("Half the market"), palette `midnight-signal` (focused)
```json
{"scenes": [{"id": "s2", "panels": [
  {"id": "s2p1", "duration": 2.5, "layout": "title", "composition": "hero-data", "asset_ids": [], "slots": {"headline": "Half the market"}, "anchor": "l", "recipe": "market-ring", "energy": "build",
   "captions": ["So when the iPhone arrived,", "Nokia owned about half"],
   "beats": [{"at": 0.4, "duration": 0.4, "kind": "scale", "easing": "snap"}, {"at": 1.5, "duration": 0.4, "kind": "swap", "easing": "pop"}],
   "sfx": [{"id": "snap", "at": 0.4}],
   "boxes": [
    {"id": "hero", "kind": "subject", "x": 6, "y": 24, "w": 38, "h": 46},
    {"id": "h", "kind": "text", "role": "display", "text": "Half the market", "x": 48, "y": 26, "w": 37, "h": 20, "px": 120, "color": "ink", "bg": "bg", "font": "Archivo Black", "lines": ["Half the", "market"]},
    {"id": "d", "kind": "text", "role": "body", "text": "Nokia, 2007", "x": 48, "y": 50, "w": 37, "h": 6, "px": 44, "color": "primary", "bg": "bg", "font": "Inter Tight"},
    {"id": "cap", "kind": "caption", "role": "caption", "x": 6, "y": 74, "w": 79, "h": 6, "px": 56, "color": "ink", "bg": "bg"}]},
  {"id": "s2p2", "duration": 2, "layout": "object", "composition": "top-bottom", "asset_ids": ["phone"], "slots": {"prop": {"id": "phone"}}, "anchor": "t", "recipe": "phone-drop", "energy": "peak",
   "captions": ["of all smartphone sales."],
   "beats": [{"at": 0.2, "duration": 0.4, "kind": "scale", "easing": "pop"}, {"at": 1.2, "duration": 0.5, "kind": "swap", "easing": "snap"}],
   "sfx": [{"id": "thud", "at": 0.2}],
   "widgets": [{"id": "share-ring", "anchor": "b", "at": 0.3, "easing": "pop"}],
   "boxes": [
    {"id": "h", "kind": "text", "role": "display", "text": "Nokia led", "x": 6, "y": 8, "w": 70, "h": 18, "px": 120, "color": "alert", "bg": "bg", "font": "Archivo Black", "lines": ["Nokia led"]},
    {"id": "w", "kind": "widget", "x": 6, "y": 44, "w": 79, "h": 24, "anchor": "b"},
    {"id": "cap", "kind": "caption", "role": "caption", "x": 6, "y": 74, "w": 79, "h": 6, "px": 56, "color": "ink", "bg": "bg"}]}
]}]}
```
