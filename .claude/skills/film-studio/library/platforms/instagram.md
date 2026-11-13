# Platform: instagram (Reels)

Short vertical feed video. Numbers are from third-party guides, not Meta's
spec [CHECK]; verify on a real device.

## Aspect ratio and safe zones
- 9:16, 1080x1920. Nothing relies on pixels outside the frame.
- Safe area: centered 996x1400 [CHECK]. Keep text and faces out of the top
  210-250 px and bottom 310-350 px [CHECK] (username, caption, audio bar).
- Right edge: keep 120 px clear of icons [CHECK]. Ads: bottom about 370 px [CHECK].

## Length range and sweet spot
- 15-90 s [CHECK]; sweet spot 15-30 s [CHECK]. App max is 3 min [CHECK].

## Hook window
- Within 2 seconds [CHECK]: a movement, a face, a bold line or a question.
- No logo sting, greeting or fade-in; frame 1 must work as a cover.

## Pacing rules
- Fast cut rhythm: a new shot or visual change every 1-3 seconds [CHECK].
- One idea per shot.

## Caption rules
- Captions always on, burned in; most views start muted.
- Max 2 lines, about 30 characters per line [CHECK], 3-6 words at a time,
  centered inside the safe area, above the bottom overlay zone.
- High contrast; never cover the face or focal point.

## Retention techniques
- Open loop: promise a payoff early, deliver it late. Pattern interrupt
  every 3-5 s [CHECK]: new angle, zoom or text change.
- Loop-friendly ending: last frame flows into the first, or ends on a line
  that makes sense when the Reel restarts. No hard "goodbye" outro.

## Audio notes
- Sound-on, but the Reel must work fully muted: captions carry the story.
- Cuts land on beats; voice clearly above music; no silence over 1 second.

## Do and do not
- Do: hook first, captions throughout, one focal point per shot.
- Do not: text in overlay zones, branding opens, long static shots, audio-only.

## Checks for the Storyboard role
- Panel 1 is the hook and works as a cover frame, within 2 seconds.
- Every panel keeps key content inside the 996x1400 safe area.
- Every caption sits in the safe area, above the bottom overlay zone.
- Panel durations average 1-3 seconds; none over 5 without a reason.
- The last panel connects back to the first (loop-friendly).
- The engine places every slot inside the safe area set in `library/platforms.json`; confirm it on the proof sheet.
