import ciudad from '../assets/projects/ciudad.png'
import archivist from '../assets/projects/tas.jpeg'
import quizOdyssey from '../assets/projects/quiz_odessey.png'
import lifewoodWebsite from '../assets/projects/lifewood-website.png'
import pfcSystem from '../assets/projects/PFCSystem.png'
import aiEmpowerment from '../assets/certifications/AI Empowerment for Communities.png'
import aseanAi from '../assets/certifications/ASEAN AI MAPUA Workshop.png'
import pythonCourse from '../assets/certifications/Crash Course on Python.jpeg'
import uxDesign from '../assets/certifications/Foundations of UX Design.jpeg'
import githubVersionControl from '../assets/certifications/Github_Version_Control.png'
import nasaCertificate from '../assets/certifications/NASA Certificate.jpg'
import networkingBasics from '../assets/certifications/Networking_Basics.png'

export type Project = {
  number: string
  title: string
  client: string
  description: string
  image: string
  stack: string[]
  link: string
}

export type Certificate = {
  title: string
  issuer: string
  image: string
}

export type Experience = {
  /** Folder name under src/assets/experience/ that holds this role's photos. */
  id: string
  period: string
  role: string
  company: string
  description: string
  tags: string[]
  current?: boolean
  image?: string
  imageAlt?: string
  imageCaption?: string
  article?: string
}

export const education = {
  degree: 'Bachelor of Science in Information Technology',
  honors: 'Cum Laude',
  school: 'Cebu Technological University',
  year: '2026',
} as const

const schoolPressImage = 'https://www.ctu.edu.ph/wp-content/uploads/2026/01/1-2-1024x768.jpg'

export const experiences: Experience[] = [
  {
    id: 'lifewood-it-executive-assistant',
    period: '2026 - Present',
    role: 'IT Executive Assistant',
    company: 'Lifewood Data Technology',
    description:
      'Supporting day-to-day IT operations while keeping people, priorities, and technical work organized and moving forward.',
    tags: ['IT Operations', 'Executive Support', 'Coordination'],
    current: true,
  },
  {
    id: 'lifewood-full-stack-intern',
    period: 'Mar 2026 - Jun 2026',
    role: 'Full Stack Developer Intern',
    company: 'Lifewood Data Technology PH',
    description:
      'Worked across enterprise workflows, prompt engineering, efficient coding, and modern AI-assisted tools.',
    tags: ['Full Stack', 'AI Tools', 'Prompt Engineering'],
    image: lifewoodWebsite,
    imageAlt: 'Lifewood website project interface',
    imageCaption: 'Lifewood digital project archive',
  },
  {
    id: 'camtastic-backend-intern',
    period: 'Jan 2026 - Mar 2026',
    role: 'Back End Developer Intern',
    company: 'Camtastic Philippines Corp.',
    description: 'Worked on backend logic using Pascal and SQL-based systems.',
    tags: ['Pascal', 'SQL', 'Backend Logic'],
  },
  {
    id: 'san-roque-training-instructor',
    period: 'Aug 2025 - Oct 2025',
    role: 'Technical Training Instructor',
    company: 'Barangay San Roque (Ciudad)',
    description:
      'Delivered hands-on digital literacy and system training with the CTU Main CCICT extension team.',
    tags: ['Technical Instruction', 'Digital Skills', 'Community'],
    image: schoolPressImage,
    imageAlt: 'CTU Main CCICT digital skills training at Barangay San Roque',
    imageCaption: 'Featured by the official CTU school press',
    article:
      'https://www.ctu.edu.ph/ctu-main-ccict-equips-barangay-san-roque-personnel-with-essential-digital-skills/',
  },
  {
    id: 'ctu-project-management-lead',
    period: 'Feb 2025 - Oct 2025',
    role: 'Project Management Lead',
    company: 'Cebu Technological University',
    description:
      'Led the development of BARIOS, an administrative platform designed to reduce manual barangay workflows.',
    tags: ['Project Management', 'BARIOS', 'Systems Delivery'],
    image: ciudad,
    imageAlt: 'BARIOS administrative system interface',
    imageCaption: 'BARIOS system field file',
  },
  {
    id: 'gdg-ctumc-logistics-officer',
    period: 'Oct 2024 - Jan 2025',
    role: 'Logistics Officer',
    company: 'Google Developer Groups on Campus - CTUMC',
    description:
      'Coordinated equipment, venue preparation, and event logistics for developer bootcamps and student tech workshops.',
    tags: ['Event Logistics', 'Inventory', 'Teamwork'],
  },
]

export const projects: Project[] = [
  {
    number: '01',
    title: 'CIUDAD (BARIOS)',
    client: 'Brgy. San Roque',
    description:
      'A full-stack administrative platform for records, requests, and automated document workflows.',
    image: ciudad,
    stack: ['React Native', 'TypeScript', 'Django', 'PostgreSQL'],
    link: 'https://github.com/hannah-sheen/CIUDAD-APP-BARIOS',
  },
  {
    number: '02',
    title: "The Archivist's Silence",
    client: 'Lifewood Data Technology PH',
    description:
      'A 2D isometric tactical puzzle game set inside quiet, abandoned structural ruins.',
    image: archivist,
    stack: ['Godot', 'GDScript', 'Gemini AI'],
    link: 'https://github.com/hannah-sheen/tas',
  },
  {
    number: '03',
    title: 'Quiz Odyssey',
    client: 'Cebu Technological University',
    description:
      'A generative learning tool that turns source material into structured practice quizzes.',
    image: quizOdyssey,
    stack: ['JavaScript', 'Gemini AI', 'HTML', 'CSS'],
    link: 'https://github.com/hannah-sheen/PROJECT_QUIZODYSSEY',
  },
  {
    number: '04',
    title: 'Lifewood Website',
    client: 'Lifewood Data Technology PH',
    description:
      'A polished, responsive company website designed for clarity, speed, and localization.',
    image: lifewoodWebsite,
    stack: ['React', 'Tailwind CSS', 'Supabase'],
    link: 'https://github.com/hannah-sheen/lifewood-Website',
  },
  {
    number: '05',
    title: 'PFC System',
    client: 'People Fitness Center',
    description:
      'A fitness management system for memberships, attendance, performance, and schedules.',
    image: pfcSystem,
    stack: ['Python', 'SQL', 'Desktop UI'],
    link: 'https://github.com/hannah-sheen/PFCSystem',
  },
]

export const skillGroups = [
  {
    title: 'I speak these',
    items: ['Python', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'HTML', 'CSS'],
  },
  {
    title: 'I build with these',
    items: ['React', 'React Native', 'Django', 'Node.js', 'Flask', 'Tailwind CSS'],
  },
  {
    title: 'I store things here',
    items: ['PostgreSQL', 'MySQL', 'Supabase', 'MongoDB', 'SSMS'],
  },
  {
    title: 'Daily toolbox',
    items: ['Git', 'GitHub', 'VS Code', 'Figma', 'AI-assisted workflows'],
  },
]

export const skillKeywords = Array.from(new Set(skillGroups.flatMap((group) => group.items)))

export const certificates: Certificate[] = [
  {
    title: 'AI Empowerment for Communities',
    issuer: 'VJAL Institute',
    image: aiEmpowerment,
  },
  {
    title: 'ASEAN AI Workshop',
    issuer: 'MAPÚA University',
    image: aseanAi,
  },
  {
    title: 'Foundations of UX Design',
    issuer: 'Google',
    image: uxDesign,
  },
  {
    title: 'GitHub Version Control',
    issuer: 'GitHub',
    image: githubVersionControl,
  },
  {
    title: 'NASA Space Apps Challenge',
    issuer: 'NASA Space Apps',
    image: nasaCertificate,
  },
  {
    title: 'Crash Course on Python',
    issuer: 'Google',
    image: pythonCourse,
  },
  {
    title: 'Networking Basics',
    issuer: 'Cisco Networking Academy',
    image: networkingBasics,
  },
]
