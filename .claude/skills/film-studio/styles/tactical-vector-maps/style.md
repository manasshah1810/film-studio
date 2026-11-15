---
id: tactical-vector-maps
status: verified
requires: none
subject_mode: ui-first
---
# tactical-vector-maps

A dark vector map seen through a war-room camera. Landmasses sit in layers, supply routes are dashed
splines that trace themselves across the sea, beacons ping like radar, and a dial counts the days.
The map is the subject. It is the look of a documentary that explains how a strait, a port or a
treaty changed where things could go. Mode C, data first: there are no people in this style.
Read `design-system.json` for every number; this file says how to use them. `recipes.md` has the
code, `failures.md` the traps.

## 1. When to use
- Geopolitics, trade wars, sanctions, blockades, chokepoints, shipping and supply chains.
- Historical conquest, empire growth, migration, exploration and trade-route stories.
- Any story where "from here to there" and "what blocked it" are the point.
- The tone is calm, exact and tense. The viewer should feel the route being cut.
- The user asks for "map", "route", "supply chain", "trade war", "conquest", "geopolitics".

## 2. When to avoid
- Stories about a person, a face or a feeling (use a photo or illustration style).
- Data that is a number over time with no place (use `dark-neon-dataviz`).
- Real borders you cannot source. A made-up border looks like a claim. Draw fictional geography
  and say so on screen (the specimen prints "FICTIONAL MAP"), or cite the source.
- A map that pans the whole film. Past 45 s, hold on a pinned close-up at each re-hook (every 12 to 15 s); length itself is no limit.

## 3. Mode C rules: UI and data first
- The subject is the map, the route, the beacons, the dial and the plates.
- Strictly zero people: no soldiers, no faces, no flags, no silhouettes, no avatars.
- Places are named by a plate that holds a number and a word. The pin number on the map matches the
  number on the plate, so the viewer never has to follow a leader line across the frame.
- Every film has one map. Cards and dials support it.
- Facts come from the script. An unsourced figure is marked `[VERIFY]` or labelled "illustrative data".

## 4. Landmass elevation layering
Every colour has one job. A higher tier is lighter and sits above a lower one.
| Tier | Name | Colour | Use |
|---|---|---|---|
| 0 | sea | `bg` | the ocean and the whole frame |
| 1 | shelf | `bg` to `surface` 35 percent | a soft band around every coast |
| 2 | lowland | `surface` | the outer band of a landmass, 14 px deep |
| 3 | highland | `surface` plus `ink` 10 percent | the middle band, 34 px deep |
| 4 | ridge | `surface` plus `ink` 20 percent | the core of a landmass |
| 5 | overlay | `primary`, `highlight`, `alert`, `ink` | routes, beacons, pins, stamps |
- Each landmass has a drop shadow (14 px down, `bg` darkened) so it lifts off the sea.
- Expanded palettes tint a landmass with a faction colour at 22 percent and outline it in that colour.
- Band depths scale with zoom, so land keeps its shape when the camera moves.
- Land and sea differ by about 1.2:1, so the bands and the coast line carry the shape. Never put text on land.

## 5. Palettes
10 palettes, two tiers. Pick by topic, then check that the route and the target colours read apart.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | night-atlas, iron-curtain, desert-front, silk-road, polar-grid | one route, one message |
| Expanded | 10 | trade-war, conquest-ledger, supply-chain, alliance-grid, sea-lanes | several blocs or tiers |
- Roles: `bg`, `surface`, `ink`, `primary` (the live route), `highlight` (a beacon). Expanded adds
  `faction_a`, `faction_b`, `faction_c`, `alert` (a cut or a loss) and `muted` (ruler labels).
- At most 2 accent colours on one map: `primary` for what moves, `alert` for what breaks.
- Every role is 4.5:1 or better on both `bg` and `surface` (lowest 5.1). Colour is a role name, never a hex.

## 6. Typography
Sizes are pixels on the 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Size | Notes |
|---|---|---|
| Display | 108 | the title, two lines at most |
| Stat number | 84 | a counter on a card, tabular, fixed width columns |
| Stamp | 56 | the serif word, upper case, rotated -8 degrees |
| Body | 44 | the value line on a plate |
| Label | 34 | mono; coordinates, plate names, tags; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: oswald-inter-playfair, barlow-baskerville, archivo-fraunces,
  league-oldstandard, bigshoulders-sourceserif, saira-cormorant. Each has a serif accent for the stamp.
- Coordinates and plate names are mono upper case. Titles are sentence case.
- Text lives in x 8 to 85 percent and y 8 to 80 percent. Ruler labels sit on opaque strips.

## 7. Route spline pacing
A route is a cubic Bezier sampled into 160 points. It is the only thing that moves fast.
- Trace: 36 to 45 frames, the `trace` bezier. The camera follows the head, so the head stays centred.
- Dwell: 24 to 28 frames on a beacon before the next thing starts. A cut route stops, then speaks.
- March: dashes (30 on, 18 off) slide 1.4 px a frame along the route for as long as it is live.
- A cut route dims to 30 percent, and the part it never reached stays as a ghost (alert, dotted).
- Radar ping: three rings 13 frames apart, 40 frame loop, 80 px at most, one colour per beacon.
- One route draws at a time. The next one starts after the camera has arrived at its start.

## 8. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| PictureDive | a place needs a picture | a pin grows into a rounded picture card from its own position, then shrinks back; no faces |
| LensRing | one detail needs a closer look | a circular ring (4 px, `ink`) magnifies the map under it 2x and follows the camera |
| OrbitRing | a hub with parts around it | 4 to 8 small nodes on a ring around a beacon, turning 0.4 degrees a frame |
| DayDial | time passes while the route moves | 24 ticks, a primary arc, a rolling day counter, longer coloured event ticks |
| SerifStamp | one event deserves a verdict | a serif word on an opaque plate, rotated -8 degrees, thuds in from 1.7 scale |
One widget family per card. Widget text comes only from the script. DayDial and SerifStamp are built in the
specimen; PictureDive, LensRing and OrbitRing are specified here and not yet built.

## 9. Top motions
| Motion | Where | Spec |
|---|---|---|
| Map coordinate pan and zoom | the camera | a centre in map coordinates and a zoom; every point is projected each frame |
| SVG path tracing | routes | a mask whose stroke draws on with the real dash length, dashes marching under it |
| Elastic pull-back zoom | after the last route lands | a spring (damping 8, stiffness 70) takes the zoom from 1.5 to 0.85 and overshoots to about 0.75 |
| Pin and beacon pop | places | `pop` spring damping 11, stiffness 190, then radar rings |
Limits per 35 s: 3 beacons per map view, 2 routes live at once, 1 stamp per event, 1 dial.

## 10. Anti-patterns
- A person of any kind: soldier, flag bearer, silhouette, avatar, hand on a map.
- A real border or a real country drawn from memory.
- Text over land, over the grid or over a route. Put it on a plate or a ruler strip.
- A camera that cuts instead of panning, or a zoom with default ease or linear.
- More than 2 accent colours on one map, or a faction colour used as a text colour.
- A route that ends without a beacon, or a beacon without a number.
- Invented numbers shown as real.

## 11. Proof
- Specimen: `components/styles/tactical-vector-maps/Preview.tsx`, rendered in `night-atlas` and
  `trade-war`; stills in `previews/tactical-vector-maps/`.
- Gate: `node scripts/check-design.js --systems tactical-vector-maps`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
