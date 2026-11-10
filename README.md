# Hannah Sheen's portfolio

A React + TypeScript portfolio with a playful scrapbook style, project previews, career files, certificates, and a contact form.

## Development

```sh
npm install
npm run dev
```

`npm run build` checks TypeScript and produces the frontend in `dist/`.
`npm run preview` serves that production build locally.

## Visuals and animation

- `src/App.tsx` owns the active single-page experience and its content.
- `src/index.css` owns the palette, responsive layouts, staggered hero entrances, scroll reveals, and hover interactions.
- The existing `motion` dependency animates experience-panel height and project changes. Project navigation stays mounted to preserve keyboard focus; preview transitions finish their exit before showing the latest selection.
- Reduced motion follows the operating-system preference, including changes made while the page is open. It disables decorative motion and pointer tilt, makes panel transitions instant, and replaces animated cats with still images.
- Closed experience panels are inert and hidden from assistive technology. Small-screen project selectors scroll horizontally without moving the surrounding page.

## Manual UI checks

Check desktop and mobile navigation, all five projects in both directions, rapid project switching followed by opening/closing case notes, experience expansion/collapse, and certificate dialogs. Confirm the resume link and required contact fields remain available.

Check widths from 320px through desktop and toggle reduced motion both before and after loading the page. No page-wide horizontal scrolling or hidden selected-project preview should remain.

Frontend checks do not send email or verify delivery through the contact API.
