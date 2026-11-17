const modules = import.meta.glob<string>(
  '../assets/experience/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}',
  { eager: true, import: 'default' },
)

const byFolder: Record<string, { name: string; url: string }[]> = {}

for (const [path, url] of Object.entries(modules)) {
  const parts = path.split('/')
  const name = parts[parts.length - 1]
  const folder = parts[parts.length - 2]
  ;(byFolder[folder] ??= []).push({ name, url })
}

/**
 * Photos dropped into `src/assets/experience/<experience id>/`, ordered by
 * file name (so `01-...` comes before `02-...`). Keyed by the folder name.
 */
export const experiencePhotos: Record<string, string[]> = Object.fromEntries(
  Object.entries(byFolder).map(([folder, files]) => [
    folder,
    files
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((file) => file.url),
  ]),
)
