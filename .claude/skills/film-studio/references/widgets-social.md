# Social widgets 01-10

Ten creator and social micro-widgets in `components/widgets/social/`. Each one draws itself from the active style's
`design-system.json`, so a CommentDrop in `neo-brutalist-ui` has thick ink borders and offset shadows, and in
`dark-neon-dataviz` it is a soft dark card with a thin border. Ids: LiveCursor, CommentDrop, VoiceNote, PostWall,
ReelFeed, ReelCascade, VideoCard, CommentCTA, PromptBar, JiggleDelete.

All UI is generic: no platform logos, no brand colours, no real accounts. Every handle, count and line on a widget
comes from `script.json` (rule 6 of `personas/widget-integrator.md`). Numbers stay off a widget until their
`[VERIFY]` is cleared.

## 1. The token contract
`socialTokens(ds, paletteId, pairingId)` in `tokens.ts` turns any design system into one `SocialTokens` object.
A widget reads only that object: no hex, no font name, no fixed border or radius.

| Token | Read from | Fallback when the style lacks it |
|---|---|---|
| `c.bg`, `c.surface`, `c.ink`, `c.primary` | palette roles | `surface` falls back to `bg` |
| `c.highlight` | palette role `highlight` | `primary` |
| `c.alert` | palette role `alert` | `highlight`, then `primary` |
| `line`, `well` | mixes of `surface` and `ink` (22% and 7%) | non-text shading only: empty bars, dividers |
| `font.display / body / accent / mono` | the chosen pairing | first pairing |
| `size.h2 / body / label` | `type_scale`, capped at 64 / 44 / 34 | 64 / 44 / 34 |
| `radius` | `tokens.border.radius.card`, else `tokens.card`, `plate` or `tag` radius | 0 (no radius is guessed) |
| `pill` | `tokens.border.radius.pill` | `radius` |
| `border` | `tokens.border`, else the card, plate or tag border (role and alpha) | none |
| `shadow` | `tokens.offset_shadow` | none |
| `enter` | the first easing in `motion.easings` | |
| `move` | the first of focus, flip, drift, push, pan, sweep, settle | `enter` |
| `spring` | `motion.springs.pop`, else the first spring | 12 / 170 / 0.9 |
| `enterFrames`, `stagger` | `motion.enter_frames`, `motion.stagger_frames` | 10, 5 |

- Tokens in design px are scaled by `tokens.frame_scale` (neo-brutalist-ui uses 3).
- Text is `ink` on `bg` or `surface`. Text on a filled shape (button, tile, reel, avatar) uses `tk.on(fill)`, which
  picks whichever of `ink`, `bg` and `surface` contrasts most with the fill.
- Widget text sizes are capped (44 body, 34 label, 64 heading) because a widget is an object inside the frame, not the
  headline. hormozi-kinetic's 56 body becomes 44 inside a widget.

## 2. Shared props and determinism
Every widget takes `{tk, frame, box}` plus its content.
| Prop | Type | Meaning |
|---|---|---|
| `tk` | `SocialTokens` | from `socialTokens(ds, palette, pairing)` |
| `frame` | number | the widget's local frame, 0 at entry: `useCurrentFrame()` inside a `Sequence`, or `f - start` |
| `box` | `{x, y, w, h}` | percent of the 1080 x 1920 frame, the same unit as storyboard boxes |

- Widgets never call `useCurrentFrame`, `Math.random` or the clock. Each frame is a pure function of `frame`.
  Seeded values use Remotion `random(seed)`.
- Each file also exports a constant (`LIVE_CURSOR`, `COMMENT_DROP`, ...) with `frames` (length), `hero` (the frame
  that best shows it on a still) and `sfx` (its cue points).
- Keep the box inside the safe rectangle: `x` 6 or more, `x + w` 85 or less, `y` 8 or more, `y + h` 80 or less.

```tsx
import ds from '../../styles/neo-brutalist-ui/design-system.json';
import {socialTokens, CommentDrop, type DesignJson} from './widgets/social';
const tk = socialTokens(ds as unknown as DesignJson, 'butter-ink', 'bricolage-dmsans');
<Sequence from={42} durationInFrames={90}>
  <Local render={(f) => <CommentDrop tk={tk} frame={f} box={{x: 8, y: 24, w: 76, h: 50}} author="@studio.notes"
    caption="We cut the intro to 1 second." comments={[{user: 'lena_k', text: 'Wait, only 1 second??', likes: 1204}]} />} />
</Sequence>
```
`Local` is any wrapper that passes `useCurrentFrame()` to `render`; `Sheet.tsx` has one (`Live`).

## 3. The widgets
Frames are local. "Compatible styles" is where the widget's look is native; any built style renders it.

### 01 LiveCursor
A cursor glides along an arc to a button on a profile card, presses it, a ripple spreads and the button flips state.
| Prop | Type | Default |
|---|---|---|
| `name`, `handle` | string | |
| `label`, `labelAfter` | string | e.g. "Follow", "Following" |
| `clickAt` | frame | 40 |
- Trigger: a person or company acts. "She hit follow", "they signed up", "he pressed buy".
- Compatible: neo-brutalist-ui, hormozi-kinetic, dark-neon-dataviz, 2-5d-parallax-depth, scifi-hud.
- SFX: `click-soft` on `clickAt`. Length 90, hero 58.
```tsx
<LiveCursor tk={tk} frame={f} box={{x: 8, y: 30, w: 76, h: 40}} name="Mira Okafor" handle="@mira.makes" label="Follow" labelAfter="Following" />
```

### 02 CommentDrop
A post with its caption, then up to 3 comments drop in on the spring, each pushing the older ones down; each gets a like.
| Prop | Type | Default |
|---|---|---|
| `author`, `caption` | string | caption is clamped to 2 lines |
| `comments` | `{user, text, likes}[]` | max 3, text clamped to 2 lines |
| `gap` | frames between drops | 18 |
- Trigger: public reaction, backlash, "people were confused".
- Compatible: all ui-first styles, minimalist-doodle.
- SFX: `soft-chime` at `8 + i * gap`. Length 90, hero 72.

### 03 VoiceNote
A voice bubble pops in, play is tapped, the waveform fills in `primary` and the timer runs in real time.
| Prop | Type | Default |
|---|---|---|
| `seconds` | clip length | |
| `seed` | waveform seed | |
| `playAt`, `bars` | frame, count | 14, 34 |
- Trigger: something said in private, a leaked message, "she sent me a voice note".
- Compatible: neo-brutalist-ui, hormozi-kinetic, dark-neon-dataviz, 2-5d-parallax-depth.
- SFX: `click-soft` on `playAt`; the voice itself if the script has it. Length 90, hero 62.

### 04 PostWall
A profile header, then a 3 x 3 grid of posts pops in along the diagonal; one post lifts with a PINNED tag.
| Prop | Type | Default |
|---|---|---|
| `handle`, `stats` | string | |
| `posts` | string[] | up to 9 short labels |
| `hero`, `heroAt` | index, frame | 4, 56 |
- Trigger: consistency, a body of work, "she posted every day for a year", "this one post changed it".
- Compatible: neo-brutalist-ui, hormozi-kinetic, minimalist-doodle, dark-neon-dataviz.
- SFX: `tactile-pop` per diagonal wave and on `heroAt`. Length 90, hero 74.

### 05 ReelFeed
A phone bezel (the darker of `ink` and `bg`) with full-height reels that snap upward one swipe at a time, with a rail of
heart, comment and share counts and a progress line.
| Prop | Type | Default |
|---|---|---|
| `reels` | `{title, handle, likes, comments}[]` | 2 to 4 |
| `firstSwipe`, `every` | frames | 34, 30 |
- Trigger: the scroll, short attention, "you swipe past it in a second".
- Compatible: hormozi-kinetic, neo-brutalist-ui, dark-neon-dataviz, glowing-plexus.
- SFX: `fast-whoosh` 6 frames before each swipe. Length 90, hero 37 (mid swipe).

### 06 ReelCascade
Three columns of 9:16 reel thumbnails pour downward at different speeds, each with a view-count chip.
| Prop | Type | Default |
|---|---|---|
| `seed` | column offsets | |
| `views` | number[] | cycled over the cards |
| `speeds` | px per frame per column | 11, 16, 8 |
- Trigger: overload, endless content, "500 hours are uploaded every minute" (once verified).
- Compatible: dark-neon-dataviz, glowing-plexus, hormozi-kinetic, neo-brutalist-ui.
- SFX: `fast-whoosh` at 0, light `digital-tick` every 8 frames while it pours. Length 90, hero 60.

### 07 VideoCard
A long-form video card slides up: thumbnail with a title, duration badge, play button. Play is pressed, the scrub bar
runs and the view count rolls up.
| Prop | Type | Default |
|---|---|---|
| `title`, `channel`, `age`, `duration` | string | title clamped to 2 lines |
| `thumb` | short thumbnail text | keep it to 12 characters |
| `views` | number | |
| `playAt` | frame | 28 |
- Trigger: a source, a famous video, "his video got 2 million views".
- Compatible: all ui-first styles, 2-5d-parallax-depth.
- SFX: `click-soft` on `playAt`, `digital-tick` while the count rolls. Length 90, hero 70.

### 08 CommentCTA
An ask line with a bouncing arrow, then a keyword types into a comment box, is sent and lands as a posted comment.
| Prop | Type | Default |
|---|---|---|
| `ask` | string | one line |
| `keyword` | string | typed one character per `perChar` frames |
| `user` | string | |
| `typeAt`, `perChar` | frames | 14, 3 |
- Trigger: the call to action at the end; never in the first 3 seconds.
- Compatible: hormozi-kinetic, neo-brutalist-ui, minimalist-doodle, dark-neon-dataviz.
- SFX: `digital-tick` per character, `click-soft` on send, `soft-chime` when the comment lands. Length 90, hero 72.

### 09 PromptBar
A prompt types into an assistant bar beside a turning spark, is sent, three dots think, then the answer streams in word
by word.
| Prop | Type | Default |
|---|---|---|
| `prompt` | string | up to 2 lines |
| `answer` | string | 2 to 3 lines |
| `typeAt`, `cps` | frame, characters per frame | 8, 1.4 |
- Trigger: "I asked an AI", a question people ask, a how-to.
- Compatible: dark-neon-dataviz, scifi-hud, holographic-wireframe, glowing-plexus, neo-brutalist-ui.
- SFX: `digital-tick` on every 2nd character, `click-soft` on send, `notification-ping` when the answer starts.
  Length 100, hero 92.

### 10 JiggleDelete
A home grid of initial icons enters edit mode: icons jiggle with seeded phases, minus badges pop, the target's badge
turns `alert` under a tap ring, the app shrinks away and the rest reflow on the spring.
| Prop | Type | Default |
|---|---|---|
| `apps` | string[] | 8 to 12 short names |
| `target` | index | |
| `editAt`, `deleteAt`, `cols` | frames, columns | 12, 40, 4 |
- Trigger: quitting, deleting, a detox, "I deleted the app".
- Compatible: neo-brutalist-ui, hormozi-kinetic, dark-neon-dataviz, voxel-art.
- SFX: `tactile-pop` on `editAt`, `click-soft` on `deleteAt`, `tactile-pop` as it vanishes. Length 90, hero 43.

## 4. Styles to avoid
- archival-grunge: radius 0 and border 0 make flat paper blocks; use only for a printed-screenshot look.
- low-poly-isometric and voxel-art: widgets are flat DOM over a 3D world; place them on a plate, never in the scene.
- [CHECK] Only `neo-brutalist-ui` (butter-ink) and `dark-neon-dataviz` (obsidian-cyan) have been rendered. The other
  10 styles resolve tokens through the same code but have not been looked at.

## 5. Contact sheet and checks
- `SocialSheet` (5 x 2 cells, each widget frozen on its hero frame) and `SocialReel` (all 10 back to back, 910 frames)
  are registered in `components/Root.tsx`. Props: `{style, palette, pairing}`; `SocialSheet` also takes `at`.
- `Sheet.tsx` exports `SOCIAL_BOXES`, the box of each widget on the sheet. A storyboard mirror of these boxes, with
  every text and fill pair the widgets draw, passes `check-design.js` and `check-safezones.js` in both rendered palettes.
- Stills: `previews/social-widgets/` at the repo root (pass 1 and final sheets).
