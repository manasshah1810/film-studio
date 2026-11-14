# holographic-wireframe failures

What goes wrong in this style, what it looks like, and the fix. Read before building a hologram.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | Plain `LineBasicMaterial` for edges | Hair-thin 1 px lines whatever `linewidth` says | `LineSegments2` with `LineMaterial`, `resolution` set to 1080 x 1920 |
| 2 | Edges with no halo | Sharp but flat, no glow | A second pass of the same edges at 9 px, opacity 0.16 |
| 3 | Normal blending | Lines and faces cover each other, the stack looks muddy | `AdditiveBlending` on every hologram material |
| 4 | Depth writes on | Inner parts vanish behind the shell; no X-ray | `depthWrite: false` on faces and edges |
| 5 | Transparent canvas with additive light | Faces show as dark patches over the page | Put `bg` inside the scene: `<color attach="background">` |
| 6 | Tone mapping or colour conversion on | The wire comes out pale or dull | `flat`, `linear`, and colours from the hex bytes with `col()` |
| 7 | Even face opacity | The object looks like tinted plastic | Fresnel: `0.05 + 0.32 * (1 - abs(n . v)) ^ 2` |
| 8 | `EdgesGeometry` on a gear | A beaded, blocky ring, a stub at every tooth | Outline wire: the profile and holes at bottom and top only |
| 9 | Gears stacked on top of each other | One block of teeth, no gears to see | Lay the train side by side in one plane, meshed by pitch radius |
| 10 | Cylinder with few segments | A line down every side facet | 28 segments; steps under the 15 degree threshold |
| 11 | A shape exactly on another | Additive light doubles and blows out white | Never stack coincident surfaces (bands on a can) |
| 12 | Scan by moving a DOM bar | The band ignores depth and crosses the sky | Clip in world y: `[reveal, lo, hi]` planes on a scan copy of the edges |
| 13 | Scan planes in object space | The band tilts and turns with the object | `THREE.Plane` clipping is world space; keep it there |
| 14 | A full square for the scan plane | It reads as a yellow floor tile | 4 corner marks only, opacity 0.8 |
| 15 | Scan face boost too high | Parts in the band turn white | Band boost 0.3, trail 0.12 |
| 16 | Shared materials across sheet frames | All 3 sheet frames show the same scan | Build materials and planes per instance in `useMemo` |
| 17 | Fast spin | Dizzy; the eye cannot read a part | Yaw 0.45 degrees a frame |
| 18 | Ending edge-on | The exploded layers stack into one bar | Pick the yaw start so the last frame is a three quarter view |
| 19 | Too much tilt or too small a gap | Exploded layers overlap | Gap 0.5, tilt to 16 degrees |
| 20 | Tags over the object | Plates hide the parts they name | Exploded object shrinks to 0.58 and moves right; tags in a left column |
| 21 | Leader before its tag | A line from nowhere | Tag scales in first; the leader draws 4 frames later |
| 22 | Leader to a fixed point | The ring drifts off the part as it turns | Project the anchor every frame with the same transforms |
| 23 | Glitch on the tags | Unreadable labels for 4 frames | Filter the canvas and the title only |
| 24 | Glitch with palette colours | It looks like a drop shadow, not a lens split | SVG `feColorMatrix` channel split, red left, blue right |
| 25 | Long or frequent glitch | Noise; the viewer stops trusting the frame | 4 frames, 2 per 10 s |
| 26 | Same filter id on every instance | Sheet frames glitch with the wrong offset | A unique filter id per frame |
| 27 | Light `bg` | The glow disappears; it looks like a line drawing | Every palette `bg` is near black |
| 28 | Grid to the horizon | A busy floor behind the title | Fade the grid to 0 by radius 7 |
| 29 | Live number that changes length | The tag jumps as it ticks | Fixed-length strings, `tabular-nums` |
| 30 | Palette hex in a component | `check-design.js` palette lock fails | Role names from `design-system.json` |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems holographic-wireframe`, then `check-design.js` and `check-safezones.js` on the film.
2. Render the reveal sweep, the exploded turn and the last frame. Is every edge a crisp core with a soft halo?
3. Are the gears gears? Is anything blown out white? Does each leader end on its part?
4. Render one glitch frame. Is it an RGB split, and are the tags still readable?
