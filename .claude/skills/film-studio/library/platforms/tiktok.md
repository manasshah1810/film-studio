# Platform: tiktok

Short vertical feed video, sound and voice led. Numbers are from third-party
guides, not TikTok's spec [CHECK]; verify in a live preview on a device.

## Aspect ratio and safe zones
- 9:16, 1080x1920. Nothing relies on pixels outside the frame.
- Safe area about 960x1386 centered [CHECK]. Keep text and faces out of the
  top 120-200 px and bottom 250-370 px [CHECK] (caption, sound bar).
- Right side is wide: keep 150-165 px clear of icons [CHECK]; left 60 px [CHECK].

## Length range and sweet spot
- 15-60 s sweet spot; longer allowed, limits vary by source [CHECK]. The brief
  sets the length; go long only if retention holds.

## Hook window
- Within 1 s [CHECK]: a face, movement, bold line or question.
- No logo sting, greeting or fade-in; frame 1 must work as a cover.

## Pacing rules
- A new shot or visual change every 1-3 s [CHECK]. One idea per shot.
- Native rough style: handheld, imperfect framing, jump cuts. No polish.

## Caption rules
- Burned-in text throughout; most views start muted or half-watched.
- Native rough text: plain system-style font, big, high contrast, 2 lines max,
  3-6 words at a time, inside the safe area, never over the face.

## Retention techniques
- Open loop: promise the payoff early, deliver it late.
- Pattern interrupt every 3-5 s [CHECK]: new angle, zoom, text change.
- Loop-friendly ending: last frame flows into the first; no "goodbye" outro.

## Audio notes
- Voice or sound leads; the video works with voice alone. Voice above music.
- Cuts land on beats or words; no silence over 1 s.

## Do and do not
- Do: hook first, voice-led story, rough native text, one focal point.
- Do not: text in overlay zones, branding opens, polished ad look, obviously
  reused trends or memes, copied templates, long static shots.

## Checks for the Storyboard role
- Panel 1 is the hook and works as a cover frame, within 1 s.
- Every panel keeps key content inside the safe area; the right side stays clear.
- Every caption sits in the safe area, above the bottom zone, rough native style.
- Panel durations average 1-3 s; none over 5 without a reason.
- No panel copies a recognizable trend; the last panel links to the first.
- The engine places every slot inside the safe area set in `library/platforms.json`; confirm it on the proof sheet.
