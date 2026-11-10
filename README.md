# Hannah Sheen's portfolio

A React + TypeScript portfolio with a playful scrapbook style, built as a navigable set of 3D
scenes (not one long scroll), an interactive cat-meme playground, a readiness-driven intro
loader, project previews, career files, certificates, and a contact form.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the frontend in `dist/`.
`npm run preview` serves that production build locally.

## Scenes and navigation

- `src/App.tsx` owns scene content and routes between scenes (`home`, `about`, `experience`,
  `projects`, `playground`, `skills`, `certificates`, `contact`) via `#hash` state, a header pill
  nav, a right-edge scene-index dock, and floating prev/next scene buttons. Only the active
  scene is mounted at a time.
- `src/components/SceneStage.tsx` + `SceneStage.css` render the active scene with a 3D
  depth/zoom transition (`motion/react` `AnimatePresence mode="wait"`), move focus to the new
  scene's heading, keep inactive scenes `inert`, and drive the scroll-progress bar and parallax
  variable from the scene's own internal scroll container.
- `src/components/LoadingScreen.tsx` + `.css` is the initial intro: real progress from image
  decode + font readiness (not a fake timer), a 4.4s hard cap, an always-available "Skip intro"
  button, and an instant/static path under reduced motion. It renders once per session
  (`sessionStorage`), outside the scene it is covering.
- `src/components/MemeArcade.tsx` + `.css` is the `playground` scene: a draggable/keyboard-
  turnable 3D cat card, boop/spin/reset controls, a reaction deck, and a credits footer. It mixes
  2026 candidate memes (Black Cat Clapping, Drooling Cat, Crowd of Drooling Cats — shown as
  credited "interactive stickers," not the original videos) with the site's existing classic GIFs.
  Research and source links: `research/cat-memes-2026.md`.
- `src/index.css` owns the palette, the fixed-height app shell (`html`/`body` no longer scroll;
  each scene scrolls internally), responsive layouts, staggered hero entrances, scroll reveals,
  and hover interactions.

## Manual UI checks

Check desktop and mobile navigation (header pills, scene dock, scene pager, mobile menu), the
intro loader's progress/skip/reduced-motion paths, all five projects in both directions, rapid
project switching followed by opening/closing case notes, experience expansion/collapse, and
certificate dialogs. Confirm the resume link and required contact fields remain available.

In the Cat Lab scene, check Boop/Spin/Prev/Next/Reset, keyboard turning (arrow keys on the
focused stage), the Instagram embed opt-in (must not auto-load), and that Pause truly stops all
running animations, including when an animated GIF is the active reaction.

Check widths from 320px through desktop and toggle reduced motion both before and after loading
the page. No page-wide horizontal scrolling or hidden selected-project preview should remain.

Frontend checks do not send email or verify delivery through the contact API.
