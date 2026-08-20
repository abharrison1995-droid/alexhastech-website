export type ProjectStatus = "Released" | "Active" | "In development";

export type ProjectImage = {
  src: string;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  status: ProjectStatus;
  summary: string;
  featured: boolean;
  accent: "teal" | "navy" | "gold";
  desktop?: { x: number; y: number; width: "large" | "medium" };
  detail: string;
  safety: readonly string[];
  hero?: ProjectImage;
  gallery?: readonly ProjectImage[];
};

export const projects: readonly Project[] = [
  {
    slug: "gbh-england",
    title: "GBH England",
    status: "In development",
    summary: "A mobile role-playing game set in England, currently in development.",
    featured: true,
    accent: "gold",
    desktop: { x: 270, y: 52, width: "large" },
    detail: "Additional public material will be added when it is available.",
    safety: [],
    hero: { src: "/projects/gbh-england/01.png", alt: "GBH England — title or menu screen" },
    gallery: [
      { src: "/projects/gbh-england/02.png", alt: "GBH England — gameplay screenshot" },
      { src: "/projects/gbh-england/03.png", alt: "GBH England — gameplay screenshot" },
      { src: "/projects/gbh-england/04.png", alt: "GBH England — gameplay screenshot" },
      { src: "/projects/gbh-england/05.png", alt: "GBH England — gameplay screenshot" },
    ],
  },
  {
    slug: "comptia-revision-suite",
    title: "CompTIA A+ revision suite",
    status: "Released",
    summary: "A revision application suite for CompTIA A+ study.",
    featured: false,
    accent: "teal",
    desktop: { x: 32, y: 350, width: "medium" },
    detail: "This project is listed as released.",
    safety: [],
    hero: { src: "/projects/comptia-revision-suite/01.png", alt: "CompTIA A+ revision suite — main screen" },
    gallery: [
      { src: "/projects/comptia-revision-suite/02.png", alt: "CompTIA A+ revision suite — question screen" },
      { src: "/projects/comptia-revision-suite/03.png", alt: "CompTIA A+ revision suite — results screen" },
    ],
  },
  {
    slug: "thinkpad-mod-loader",
    title: "Libreboot/Coreboot ThinkPad mod-loader utility",
    status: "Active",
    summary: "A utility for Libreboot/Coreboot ThinkPad modification workflows.",
    featured: false,
    accent: "navy",
    desktop: { x: 660, y: 350, width: "medium" },
    detail: "No download is provided from this portfolio.",
    safety: ["Supported ThinkPad models, prerequisites, testing status, backup and recovery procedures, and checksums have not yet been published here.", "Do not treat this page as compatibility or installation guidance."],
  },
] as const;

export function assertProjectRegistry(records: readonly Project[]) {
  const slugs = new Set<string>();
  let featured = 0;
  for (const project of records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug) || slugs.has(project.slug)) throw new Error(`Invalid project slug: ${project.slug}`);
    slugs.add(project.slug);
    if (!project.title.trim() || !project.summary.trim() || !project.detail.trim()) throw new Error(`Incomplete project detail: ${project.slug}`);
    if (!Array.isArray(project.safety) || project.safety.some((note) => !note.trim())) throw new Error(`Invalid safety notes: ${project.slug}`);
    if (project.hero && (!project.hero.src.trim() || !project.hero.alt.trim())) throw new Error(`Invalid hero image: ${project.slug}`);
    if (project.gallery && (project.gallery.length === 0 || project.gallery.some((image) => !image.src.trim() || !image.alt.trim()))) throw new Error(`Invalid gallery images: ${project.slug}`);
    if (project.featured) featured += 1;
    if (project.desktop && (
      !Number.isFinite(project.desktop.x) || !Number.isFinite(project.desktop.y) ||
      project.desktop.x < 0 || project.desktop.y < 0 ||
      !["large", "medium"].includes(project.desktop.width)
    )) throw new Error(`Invalid desktop layout: ${project.slug}`);
  }
  if (featured !== 1) throw new Error("Project registry must contain exactly one featured project");
}

assertProjectRegistry(projects);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}