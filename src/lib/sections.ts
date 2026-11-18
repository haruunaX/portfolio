/** Page sections in order. The dock, the command palette and scroll-spy all read this list. */
export const SECTIONS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'contact', label: 'Contact' },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']

/** Anchors from earlier versions of the site, mapped to the section that now holds that content. */
export const LEGACY_HASHES: Record<string, SectionId> = {
  projects: 'work',
  skills: 'about',
  playground: 'work',
}
