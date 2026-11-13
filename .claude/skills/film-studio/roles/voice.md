# Voice

Makes the narration audio, or confirms that the film is captions-only. Runs after the script has
passed and before the Renderer. Handles the only secret this skill can touch, so read section 2 first.

## Inputs and output
- Reads: `work/brief.json` (`voiceover`, `voice`), `work/script.json`.
- Writes: `work/audio/<scene>.wav|mp3` and `work/audio/manifest.json`, through `scripts/voice.js` only.

## 1. The three paths
| Brief | What happens | Cost |
|---|---|---|
| `voiceover: false` | No audio. Captions come from the storyboard's panel captions. | none |
| `voice.provider: system` | The operating system's voice: Windows speech, macOS `say`, Linux `espeak-ng`. | free, local |
| `voice.provider: piper` | Piper, a local neural voice. Needs `piper` on PATH and `PIPER_MODEL` set to a `.onnx` voice file the user downloaded. | free, local |
| `voice.provider: elevenlabs` or `openai` | The user's own paid account. | theirs |
`node scripts/voice.js check` prints which of these can run on this machine. Offer only READY ones.
The local voices are plain. Say so; captions-only is often the better free choice.

## 2. Keys: the whole rule
- The key lives in an environment variable or in `.env` in the project root. `.env` must be listed in
  `.gitignore`; check before anything else and add it if it is missing.
- `brief.voice.env_key` holds the NAME of the variable (default `ELEVENLABS_API_KEY` or
  `OPENAI_API_KEY`). The key itself is never written to any file in `work/` or in this skill.
- Never print, echo or log the key, and never put it on a command line. `voice.js` reads it inside
  the process and sends it only to the provider's own API host.
- If the user pastes a key into chat: do not repeat it. Say "That key is now in this conversation.
  Please rotate it, then set it as an environment variable." Then continue once the variable is set.
- If the variable is missing, `voice.js` exits with a message naming the variable. Pass that on; do
  not ask for the key itself.

## 3. Make the audio
1. `node scripts/voice.js make work --dry` lists the scenes and character counts. Nothing is sent.
2. For a paid provider, tell the user the total character count and get a yes: it is their money.
3. `node scripts/voice.js make work`. One clip per scene, named by scene id, plus the manifest with
   each clip's start time and measured length.
4. Any `[VERIFY: ...]` marker is stripped from the spoken text. Tell the Director which scenes had one.

## 4. Fit
`voice.js` fails if a clip runs longer than its scene. Fix it at the source:
- Under 10% over: ask the Writer to trim that scene's narration.
- More: ask the Director whether to lengthen the scene (the Storyboard then re-times its panels).
Never speed the audio up and never let it run over the cut.

## 5. Licence and credits
- System and Piper voices: no credit entry is needed for the engine. A Piper voice model has its own
  licence; ask the user which model it is and record it:
  `node scripts/credits.js add work --id voice-piper --kind voice --url <model page> --author <name> --license <id>`.
- Paid providers: the user's plan decides commercial use [CHECK the provider's current terms]. Record
  `--id voice-elevenlabs` or `--id voice-openai` with the terms page as the URL and `Own-work` only
  if the user confirms their plan allows the intended use. Otherwise stop.
- Never clone or imitate a real person's voice.

## 6. Record spend
Paid: `node scripts/ledger.js spend work render voice_per_1000_chars <thousands> --note "voice"`.
Local voices cost no units.

## 7. Stop and report when
- The provider returns an error (`voice.js` prints the HTTP status only). One attempt; no loop.
- `ffprobe` is not on PATH (clip lengths cannot be measured).
- The request shapes in `scripts/voice.js` no longer match the provider's API [CHECK]: do not guess
  a fix; offer a local voice or captions-only instead.
