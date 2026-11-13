# Stock Sourcer

Optional role. Runs only when `work/needs.json` has a `media` need: a real photo, clip, sound or
music track. Everything else in a film is drawn in code and needs no sourcing. This role finds a
file with a clear permissive licence, records it, or says no.

## Inputs and output
- Reads: the `media` items in `work/needs.json`, `library/licences.json`.
- Writes: files under `work/media/`, and entries in `work/credits.json` through `scripts/credits.js`
  only.

## 1. Order of preference
1. A file the user supplies and says they own or have licensed. Record it with licence `Own-work`.
2. Public-domain or CC0 material from an institution that states the status on the item page.
3. CC BY material, with the attribution text recorded.
4. A free stock site whose own licence is on the allow-list.
5. Nothing: tell the Director the need cannot be met, and suggest the code-drawn alternative
   (a prop or a character). This is a normal outcome, not a failure.

## 2. The licence check, for every file
1. Open the page of that exact item, not the site's home page. Find the licence statement on it.
2. Match it to an id in `library/licences.json` (`node scripts/credits.js licences` prints the list).
   - Not on the list, or two statements disagree, or there is no statement: reject. Unclear means no.
   - Always rejected: non-commercial (NC), no-derivatives (ND), share-alike (SA) unless the user
     accepts its terms in writing, "editorial use only", anything behind a paid account, anything
     scraped from search results, social media or a video.
3. Note the author or rights holder as the page names them.
4. Record it before the file is used anywhere:
   `node scripts/credits.js add work --id <need id> --kind image|video|audio|music --url <item page> --author "<name>" --license <id> [--attribution "<title> by <author>, <licence>"] [--trademark]`
   The script refuses a licence that is not allowed and requires attribution text where the licence
   does. It stamps today's date as `date_checked`.
5. Record the spend: `node scripts/ledger.js spend work cast stock_download 1 --note "<id>"`.

Licence terms change. The date in `credits.json` is the day you read the page; say so in the note if
anything on the page was ambiguous [CHECK].

## 3. Trademarks and people
Add `--trademark` when the file shows any of these, even with a clean copyright licence:
- a logo, wordmark, product design, packaging or app screen of a real company;
- a recognisable real person;
- a character, sprite or artwork from an existing film, game, comic or brand.
A flagged file is not rejected by the script, but the Renderer will not use it until the user has
approved that specific item. Tell the user plainly what is in it and why it is flagged.
A copyright licence never grants trademark or personality rights.

## 4. Music and sound
- Same rules. A track from a "free music" video or playlist with no licence page is rejected.
- Never use a commercial song, a cover of one, or a sound-alike.
- If nothing clean is found, the film has no music. Silence under a voice or captions is fine.

## 5. What this role never does
- Never uses an image, video, voice or music generation service: this skill does not depend on paid
  generation APIs, and generated media has unclear terms.
- Never edits a file to remove a watermark, signature or credit.
- Never downloads "just to try". A file enters `work/media/` only after its credits entry exists.
- Never enters a licence it did not read on the item's own page.

## 6. Stop and report when
- No clean source exists for a need (suggest the code-drawn alternative).
- A file the user supplied shows a third party's logo, person or artwork: ask them.
- `credits.js` exits non-zero. Pass on its message; do not work around it.
