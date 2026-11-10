# Cat-meme findings for the portfolio

As of 2026-11-10. Scope: focused source review, not a report or slide deck.

## Shortlist

### Black Cat Clapping
- Strongest recent candidate: an AI-edited black cat with human hands applauding.
- Original creator post: Aleksandr Kim, @merkurianin, 25 September 2026. The public Instagram page directly confirms creator, date, and AI-content label.
- Primary: https://www.instagram.com/reel/DdtWc0qIbdH/
- Context, published 13 October 2026: https://trending.knowyourmeme.com/editorials/guides/what-is-the-black-cat-clapping-meme-the-origin-of-the-viral-ai-cat-memes-explained
- Proposed interaction: applause reaction when a visitor opens or selects a project. Do not autoplay sound.

### Drooling Cat / Crowd of Drooling Cats
- Documented as a 2026 reaction-image format, with circulation reported from February and the crowd variant spreading in June.
- The original image author is unknown. These are primarily still images, not inherently animated clips; UI motion must not be presented as an original animated meme.
- Source: https://knowyourmeme.com/memes/drooling-cat-crowd-of-drooling-cats
- Referenced early source: https://www.reddit.com/r/HelpMeFind/comments/1r9l4nt/low_res_image_of_cat_drooling/ (direct access blocked by Reddit network security; not independently inspected).
- Proposed interaction: draggable reaction sticker or card that leans toward the pointer.

### Corn Dog Cat
- Older origin (2022), with a reported resurgence in mid-2026. Do not label it as created in 2026.
- Source, published 3 August 2026: https://trending.knowyourmeme.com/editorials/guides/what-is-corn-dog-cat-the-absurd-cat-corndog-meme-character-explained
- Referenced animation: https://www.tiktok.com/@popsiclehotdog/video/7665845672830176542
- The underlying corn-dog photograph is attributed to stock photographer Richard Ernest Yap. Avoid treating this asset as royalty-free.

## Existing classics

OIIA and Maxwell are older formats, not new 2026 discoveries. OIIA already exists in this repository. Keep any classics clearly separate from the new shortlist.
- https://knowyourmeme.com/memes/oo-ee-a-e-a-cat-remixes
- https://knowyourmeme.com/memes/maxwell-the-cat-spinning-cat

## Asset-use limitations

Public availability and attribution do not establish a reuse license. No blanket commercial-reuse permission was verified for the shortlist. Prefer creator/platform-supported embeds when suitable, retain source/creator links, and never describe downloaded memes as owned or royalty-free. A stable downloadable animation has not yet been selected or visually verified. Avoid expiring Instagram CDN URLs as deployed asset URLs. Do not copy article text into the portfolio.

## Implementation constraints

No forced audio, flashing effects, or fake loading percentages. Provide keyboard-operable controls, a pause/reduced-motion path, static alternatives, and a mobile layout. Load meme media after critical portfolio content rather than making it a prerequisite for entering the site.

## Asset provenance (src/assets/cats/2026/)

Downloaded 2026-11-10 from Know Your Meme CDN pages named below, visually inspected, then resized or cropped and converted to WebP. No reuse licence was verified for any of them; they are shown as small, credited interactive stickers, not as owned or royalty-free media.
- `black-cat-clapping-frame.webp`: square crop of a still frame from the cover image of https://trending.knowyourmeme.com/editorials/guides/what-is-the-black-cat-clapping-meme-the-origin-of-the-viral-ai-cat-memes-explained (frame of the @merkurianin video, https://www.instagram.com/reel/DdtWc0qIbdH/). Not the original video; an opt-in Instagram iframe embed is offered in the UI.
- `drooling-cat.webp`: resized from a KYM gallery image on https://knowyourmeme.com/memes/drooling-cat-crowd-of-drooling-cats (image author unknown).
- `crowd-of-drooling-cats.webp`: resized from the KYM entry cover image on the same page (image author unknown).
- `oiia-still.webp`, `banana-cry-still.webp`: first frames of the repository's existing OIIA and banana GIFs (classics), used only as pause and reduced-motion stills. GIF credits: Tenor oiiaoiiaSpinningCAT and wmma.
- Corn Dog Cat was deliberately not downloaded because its photo is attributed to a stock photographer.
