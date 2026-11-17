# Hannah Sheen's portfolio

A React + TypeScript portfolio in a "Cebu Golden Hour" style: a warm sand-and-mango base with
cool lagoon accents, sunlit depth, a 3D lanyard ID badge, and shared element transitions.
Natural page scrolling, a readiness-driven intro loader, project case files, career files with
photos, certificates, and a contact form.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the frontend in `dist/`.
`npm run preview` serves that production build locally.

The live 3D badge shows in production builds (`npm run build && npm run preview`). Under
`npm run dev`, React StrictMode's double mount makes react-three-fiber drop the WebGL context,
so the hero falls back to the static badge poster; the same fallback covers real context loss.

## Design system

- `src/index.css` holds the role tokens in `:root`: `--page` (Sand), `--card` (Shell), `--text`
  (Driftwood), `--base` (Mango), `--feature` (Dusk), `--accent` (Lagoon), `--accent-soft`
  (Seafoam), `--accent-deep` (Deep sea), the elevation shadows `--elev-1/2/3`, radii, and fonts
  (Fraunces headings, DM Sans body). Re-theming starts and ends in that block.
- Light comes from the top right, so every shadow falls down and to the left. Mango is a
  surface and glow colour only; it is never used as text on light backgrounds.
- Shared element transitions use Motion `layoutId` with the `MORPH` spring from
  `src/lib/motion.ts`: the nav highlight, the loader card flying into the hero badge, project
  cards opening their case file, certificate cards opening the lightbox, the experience
  marker, and experience photo swaps. `App` wraps everything in `MotionConfig`, so reduced
  motion makes every morph instant.

## Content

- Text and lists live in `src/data/portfolio.ts` (experience, projects, skills, certificates,
  and the education line used for the Cum Laude mentions).
- Extra project screenshots for the case files are listed in `src/data/projectGalleries.ts`.
- Certificate images live in `src/assets/certifications/`; add an entry to `certificates` in
  `src/data/portfolio.ts` (newest first).

### Adding experience photos

Each role has its own folder under `src/assets/experience/`, named after the role's `id` in
`src/data/portfolio.ts` (for example `src/assets/experience/camtastic-backend-intern/`). Drop
photos into that folder and they appear in that role's photo area automatically:

- Files are shown in file-name order, so prefix them (`01-team.jpg`, `02-workshop.jpg`) to
  choose the cover.
- JPG, PNG, WebP and AVIF work, with upper- or lower-case extensions. Convert iPhone HEIC
  photos to JPG first.
- Landscape around 4:3 or 16:10, up to about 1600px wide, keeps the page fast. Portrait photos
  also work; they are shown whole over a soft blurred backdrop.
- A role with no photos shows an initials tile to visitors. While running `npm run dev`, that
  tile also shows the folder path to drop photos into; the hint never ships in production.

## Layout and navigation

- `src/App.tsx` renders seven sections in document order: `home`, `about`, `experience`,
  `projects`, `skills`, `certificates`, and `contact`. Wheel, touch, and keyboard scrolling use
  the browser's document scroll, without scene switching or scroll snapping.
- Header links are native hash anchors. The active link and progress bar follow the page
  scroll; navigating does not unmount sections or clear form drafts.
- The mobile menu is used through 980px and can scroll within short landscape viewports.
- `src/components/LoadingScreen.tsx` is the intro: real progress from image decode and font
  readiness, a 4.4s hard cap, an always-available "Skip intro" button, and a static path
  under reduced motion. It runs once per session (`sessionStorage`). When a visit starts on
  the hero, its badge card flies into the hero badge as the loader leaves.
- `src/components/HeroBadge.tsx` shows the badge poster immediately and lazy-loads the 3D
  lanyard (`src/components/Lanyard.tsx`, three.js + rapier) after the intro, only with WebGL,
  without reduced motion, and while the hero is near the viewport.

## Manual UI checks

Scroll from home through contact using the wheel, touch, and keyboard without clicking
navigation. Check header anchors, browser back/forward, direct hash entry (`/#contact` must
skip the badge handoff and land on Contact), and the mobile menu in portrait and landscape.

Test the loader's progress, skip, session memory, and reduced-motion paths; drag the 3D badge
with mouse and touch; open and close project case files and certificates, including closing
mid-transition; expand experience files and swap their photos. Closing a dialog must restore
page scrolling and return focus to what opened it.

Check widths 320, 390, 768, 1024, 1440, and 1920px and toggle reduced motion before and after
loading. Check for horizontal overflow, clipped text, overlapping content, and oversized gaps.
All sections must remain mounted, with no nested vertical section scrollers.

Frontend checks do not send email or verify delivery through the contact API.
