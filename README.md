# Hannah Sheen's portfolio

A React + TypeScript portfolio with a playful scrapbook style, natural page scrolling,
an interactive cat-meme playground, a readiness-driven intro loader, project previews,
career files, certificates, and a contact form.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the frontend in `dist/`.
`npm run preview` serves that production build locally.

## Layout and navigation

- `src/App.tsx` renders all eight sections in document order: `home`, `about`, `experience`,
  `projects`, `playground`, `skills`, `certificates`, and `contact`. Wheel, touch, and keyboard
  scrolling use the browser's document scroll, without scene switching or scroll snapping.
- Header links are native hash anchors and remain optional shortcuts. The active link and
  progress bar follow the page scroll; navigating does not unmount sections or clear form drafts.
  Scroll reveals use the viewport, without moving keyboard focus.
- The mobile menu is used through 980px and can scroll within short landscape viewports.
  Sections have content-driven heights, fluid padding, and responsive grids. The contact
  footer spans the full grid width; certificate cards stack in one column on phones.
- `src/components/LoadingScreen.tsx` + `.css` is the initial intro: real progress from image
  decode + font readiness (not a fake timer), a 4.4s hard cap, an always-available "Skip intro"
  button, and an instant/static path under reduced motion. It renders once per session
  (`sessionStorage`), above the page it is covering.
- `src/components/MemeArcade.tsx` + `.css` is the `playground` section: a draggable/keyboard-
  turnable 3D cat card, boop/spin/reset controls, a reaction deck, and a credits footer. It mixes
  2026 candidate memes (Black Cat Clapping, Drooling Cat, Crowd of Drooling Cats, shown as
  credited "interactive stickers," not the original videos) with the site's existing classic GIFs.
  Research and source links: `research/cat-memes-2026.md`.
- `src/index.css` owns responsive sizing, typography, staggered hero entrances, scroll reveals,
  and hover interactions. Only the loader and open dialogs temporarily lock document scrolling.
  Reduced motion disables decorative animations and smooth anchor scrolling and swaps GIFs
  for still images, including when the preference changes while the page is open.

## Manual UI checks

Scroll from home through contact using the wheel, touch, and keyboard without clicking navigation.
Check header anchors, browser back/forward, direct hash entry, and the mobile menu in portrait
and landscape. Test the loader's progress/skip/reduced-motion paths, project browsing and case
notes, experience expansion/collapse, and certificate dialogs. Closing a dialog must restore
page scrolling. Confirm the resume link works and contact drafts survive anchor navigation.

In the Cat Lab section, check Boop/Spin/Prev/Next/Reset, keyboard turning (arrow keys on the
focused stage), the Instagram embed opt-in (must not auto-load), and that Pause truly stops all
running animations, including when an animated GIF is the active reaction.

Check widths 320, 390, 768, 820, 1024, 1440, and 1920px and toggle reduced motion before and
after loading. Check for horizontal overflow, clipped text, overlapping content, and oversized
gaps. All eight sections must remain mounted, with no nested vertical section scrollers.

Frontend checks do not send email or verify delivery through the contact API.
