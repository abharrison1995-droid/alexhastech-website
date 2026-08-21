import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, projects, type ProjectImage } from "../../data/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return projects.map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: `${project.title} | Project Portfolio`, description: project.summary } : { title: "Project not found | Project Portfolio" };
}

function Screenshot({ image, priority = false }: { image: ProjectImage; priority?: boolean }) {
  return (
    <figure className="screenshot">
      <img src={image.src} alt={image.alt} loading={priority ? "eager" : "lazy"} decoding="async" />
    </figure>
  );
}

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  return <main className="case-study">
    <p className="eyebrow">Project notes</p><p className="project-status">{project.status}</p>
    <h1>{project.title}</h1><p className="case-study-lede">{project.summary}</p>
    {project.repoUrl && <a className="repo-link" href={project.repoUrl} target="_blank" rel="noopener noreferrer">View source on GitHub <span aria-hidden="true">→</span></a>}
    {project.hero && <Screenshot image={project.hero} priority />}
    <section><h2>Overview</h2><p>{project.summary}</p></section>
    {project.gallery && project.gallery.length > 0 && <section className="gallery-section"><h2>Gallery</h2><div className="gallery">{project.gallery.map((image) => <Screenshot key={image.src} image={image} />)}</div></section>}
    {project.safety.length > 0 ? <section className="safety-note"><h2>Safety and support</h2>{project.safety.map((note) => <p key={note}>{note}</p>)}<p>{project.detail}</p></section> : <section><h2>Current status</h2><p>{project.detail}</p></section>}
    <Link className="back-link" href="/">← All projects</Link>
  </main>;
}