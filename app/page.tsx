import type { Metadata } from "next";
import { DesktopStage } from "./components/DesktopStage";
import { projects } from "./data/projects";

export const metadata: Metadata = {
  title: "Project Portfolio | GBH England",
  description: "A portfolio of software and game projects, featuring the mobile role-playing game GBH England in development.",
};

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#project-stage">Skip to featured project</a>
      <header className="site-header">
        <a className="site-mark" href="#top" aria-label="Portfolio home">Portfolio</a>
        <nav aria-label="Primary navigation"><a href="#project-stage">Projects</a></nav>
      </header>
      <main id="top">
        <section className="intro" aria-labelledby="intro-title">
          <p className="eyebrow">Software + games</p>
          <h1 id="intro-title">Selected projects, built with care.</h1>
          <p>A focused portfolio of useful software and the mobile role-playing game GBH England.</p>
        </section>
        <DesktopStage projects={projects} />
      </main>
      <footer className="status-strip" aria-label="Portfolio status">
        <span>Portfolio status</span><span>1 featured project</span><span>GBH England: in development</span>
      </footer>
    </div>
  );
}
