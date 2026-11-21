# Hannah Sheen's portfolio

A React + TypeScript portfolio in the "Sticker pop" style: a hot pink base with grape, sky and
lime accents, ink outlines and hard shadows on everything, draggable stickers around a 3D
lanyard ID badge, a small mascot called Buddy, a floating dock and command palette instead of a
header, and shared element transitions.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the frontend in `dist/`.
`npm run preview` serves that production build locally.

The live 3D badge shows in production builds (`npm run build && npm run preview`). Under
`npm run dev`, React StrictMode's double mount makes react-three-fiber drop the WebGL context,
so the hero falls back to the static badge poster; the same fallback covers real context loss
and a failed 3D download.

## Design system

- `src/index.css` holds the tokens (`--pink`, `--grape`, `--sky`, `--lime`, `--ink`, `--cream`,
  `--paper`, the `--line` outlines, the hard `--pop-1/2/3` shadows, radii, fonts) and the shared
  classes every section uses: `.wrap`, `.section`, the surfaces (`.surface-pink`,
  `.surface-cream`, `.surface-grape`, `.surface-sky`, `.surface-ink`), `.kicker`,
  `.section-title` (an `<em>` inside becomes a tilted lime sticker block, like `.hl`), `.hand`
  (handwritten notes), `.btn` with `.btn-lime/.btn-pink/.btn-sky/.btn-paper`, `.press` (lift on
  hover, press flat on click) and `.chip`.
- Fonts: Bricolage Grotesque (display, variable width and weight), Caveat (handwritten notes),
  Inter (body), loaded from Google Fonts in `index.html`.
- Contrast rules: ink text on pink, sky, lime, cream and white; cream text on grape and ink.
  Pink never carries text.
- Shared pieces: `Sticker` (a die-cut sticker that slaps in and bobs; on mouse and trackpad it can
  be dragged around inside a container, or with `snapBack` it springs home when let go) and
  `Buddy` (the HS mascot: eyes follow the cursor, it blinks,
  hops when clicked and has wave, point, sign, cheer and peek poses).
- Motion: shared element transitions use Motion `layoutId` with `MORPH` from
  `src/lib/motion.ts`, which also has the `POP` and `SETTLE` springs and the `slapIn` and
  `riseIn` entrances. The two sides of each pair carry different `layoutDependency` values,
  otherwise Motion skips the morph. `App` wraps everything in `MotionConfig`, and
  `src/lib/useReducedMotion.ts` gives components the live reduced-motion preference.

## Layout

`src/App.tsx` is a thin shell: the intro loader and its badge handoff, deep links (old
`#projects` and `#skills` links are redirected), scroll-spy for the dock, and dialog state. The
page is made of section components, in order:

| Section | Component | What it does |
|---|---|---|
| Hero (`#home`) | `Hero`, `StickerField`, `HeroBadge` + `Lanyard`, `Buddy` | Name that gains weight near the cursor, Cum Laude chip, draggable stickers, Buddy waving beside the 3D badge |
| Navigation | `Navigation`, `CommandPalette` | Floating dock with scroll-spy; Ctrl/Cmd+K "Hey Hannah, where to?" palette |
| About (`#about`) | `AboutSection` | Holographic Cum Laude ID card with a rosette sticker, Buddy holding a sign, bio, currently doing, a sheet of draggable skill stickers |
| Work (`#work`) | `WorkSection`, `ProjectCaseFile` | Bento grid; tiles morph into case files with prev/next and extra screens |
| Marquee | `MarqueeBand` | Tilted lime ribbon that speeds up as you scroll |
| Experience (`#experience`) | `ExperienceSection`, `ExperienceSheet`, `ExperienceMedia` | Stacking job cards; "Open file" morphs into a sheet with that role's photos |
| Certificates (`#certificates`) | `CertificatesSection`, `CertificateLightbox` | Drag or arrow rail of 7 certificates; cards morph into the full view |
| Contact (`#contact`) | `ContactSection` | Form posting to `/api/contact`, magnetic links, copy email, confetti and a cheering Buddy on send |

Third-party credits for the adapted React Bits components are in `THIRD_PARTY.md`.

## Content

- Text and lists live in `src/data/portfolio.ts` (experience, projects, skills, certificates,
  and the education line used for the Cum Laude mentions); links in `src/data/contact.ts`.
- Extra project screenshots for the case files are listed in `src/data/projectGalleries.ts`.
- Certificate images live in `src/assets/certifications/`. Add a WebP or JPG (up to about
  1800px wide keeps opening fast) and an entry in `certificates` (newest first).

### Adding experience photos

Each role has its own folder under `src/assets/experience/`, named after the role's `id` in
`src/data/portfolio.ts` (for example `src/assets/experience/camtastic-backend-intern/`). Drop
photos into that folder and they appear in that role's "Open file" sheet automatically:

- Files are shown in file-name order, so prefix them (`01-team.jpg`, `02-workshop.jpg`) to
  choose the cover.
- JPG, PNG, WebP and AVIF work, with upper- or lower-case extensions. Convert iPhone HEIC
  photos to JPG first.
- Landscape around 4:3 or 16:10, up to about 1600px wide, keeps the page fast.
- A role with no photos shows an initials tile to visitors. While running `npm run dev`, the
  tile also shows the folder path to drop photos into; the hint never ships in production.

## Manual UI checks

Scroll from top to bottom with the wheel, touch, and keyboard; the dock should follow. Try the
dock, Ctrl/Cmd+K (type "cert", press Enter), direct links like `/#contact` on a fresh tab (no
badge handoff, lands on Contact) and the old `/#projects`. Open and close a project case file,
an experience file, and a certificate, including closing mid-transition; focus must return to
what opened it and page scrolling must come back.

Check widths 320, 390, 768, 1024, 1440, and 1920px and toggle reduced motion before and after
loading: stickers stop bobbing and only fade in, Buddy holds still, the dock stops magnifying,
the marquee and tilt stop, and morphs become instant. Check for horizontal overflow and clipped
text.

Frontend checks do not send email or verify delivery through the contact API.
