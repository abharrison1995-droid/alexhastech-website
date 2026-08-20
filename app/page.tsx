import type { Metadata } from "next";
import { Win95Desktop } from "./components/Win95Desktop";
import { projects } from "./data/projects";

export const metadata: Metadata = {
  title: "Project Portfolio | GBH England",
  description: "A portfolio of software and game projects, featuring the mobile role-playing game GBH England in development.",
};

export default function Home() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#desktop">Skip to projects</a>
      <Win95Desktop projects={projects} />
    </div>
  );
}
