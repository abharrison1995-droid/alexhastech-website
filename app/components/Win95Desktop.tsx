"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { Project } from "../data/projects";

type WindowId = "projects-completed" | "projects-in-progress" | "get-to-know";
type WindowSpec = { id: WindowId; label: string; title: string; glyph: "navy" | "teal" | "gold" };

const WINDOWS: readonly WindowSpec[] = [
  { id: "projects-completed", label: "Projects completed", title: "Projects completed", glyph: "teal" },
  { id: "projects-in-progress", label: "Projects in progress", title: "Projects in progress", glyph: "navy" },
  { id: "get-to-know", label: "Get to know", title: "Get to know — alex_has_tech", glyph: "gold" },
] as const;

// Matches the win95-zoom-close duration; only used as an animationend fallback.
const CLOSE_MS = 200;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function ProjectTile({ project }: { project: Project }) {
  return (
    <li className={`project-tile project-tile--${project.accent} bevel-out`}>
      <span className="tile-caption">{project.title}</span>
      {project.hero
        ? <img className="tile-thumb" src={project.hero.src} alt="" loading="lazy" decoding="async" />
        : <span className="tile-thumb tile-thumb--empty" aria-hidden="true">No screenshot yet</span>}
      <div className="tile-meta">
        <span className="tile-status">{project.status}</span>
        <h3 className="tile-name"><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3>
        <p className="tile-summary">{project.summary}</p>
        <Link className="tile-link" href={`/projects/${project.slug}`}>Open notes <span aria-hidden="true">→</span></Link>
      </div>
    </li>
  );
}

function ProjectPane({ projects, emptyText }: { projects: readonly Project[]; emptyText: string }) {
  if (projects.length === 0) return <p className="tile-empty">{emptyText}</p>;
  return <ul className="tile-grid">{projects.map((project) => <ProjectTile key={project.slug} project={project} />)}</ul>;
}

function AboutPane({ projects }: { projects: readonly Project[] }) {
  const inProgress = projects.filter((project) => project.status !== "Released");
  const released = projects.filter((project) => project.status === "Released");
  return (
    <div className="about-pane">
      <h3>Alex Harrison</h3>
      <p>I build software and games. This desktop collects the things I have shipped and the things I am still building — open a window from the bar above to look around.</p>
      <dl className="about-list">
        <dt>Currently building</dt>
        <dd>{inProgress.map((project) => project.title).join(", ") || "Nothing in progress right now."}</dd>
        <dt>Shipped</dt>
        <dd>{released.map((project) => project.title).join(", ") || "Nothing released yet."}</dd>
        <dt>Project notes</dt>
        <dd>Every tile links through to a page with screenshots and current status.</dd>
      </dl>
    </div>
  );
}

export function Win95Desktop({ projects }: { projects: readonly Project[] }) {
  const completed = projects.filter((project) => project.status === "Released");
  const inProgress = projects.filter((project) => project.status !== "Released");

  const [open, setOpen] = useState<readonly WindowId[]>([]);
  const [maximized, setMaximized] = useState<readonly WindowId[]>([]);
  const [clock, setClock] = useState<string | null>(null);
  const windowRefs = useRef<Partial<Record<WindowId, HTMLElement | null>>>({});
  const buttonRefs = useRef<Partial<Record<WindowId, HTMLButtonElement | null>>>({});
  const desktopRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pendingOpen = useRef<WindowId | null>(null);
  const closing = useRef(new Set<WindowId>());

  // Point the zoom keyframes at the taskbar button that launched the window, so
  // it appears to burst out of the bar the way a Win95 window does.
  const aimZoom = useCallback((id: WindowId) => {
    const element = windowRefs.current[id];
    const button = buttonRefs.current[id];
    if (!element || !button || prefersReducedMotion()) return false;
    const target = element.getBoundingClientRect();
    const source = button.getBoundingClientRect();
    if (target.width === 0 || target.height === 0) return false;
    element.style.setProperty("--zx", `${source.left + source.width / 2 - (target.left + target.width / 2)}px`);
    element.style.setProperty("--zy", `${source.top + source.height / 2 - (target.top + target.height / 2)}px`);
    element.style.setProperty("--sx", `${Math.max(source.width / target.width, 0.02)}`);
    element.style.setProperty("--sy", `${Math.max(source.height / target.height, 0.02)}`);
    return true;
  }, []);

  // The window is already in the DOM by the time this runs but has not painted,
  // so measuring here starts the animation without a flash at full size.
  useLayoutEffect(() => {
    const id = pendingOpen.current;
    if (!id) return;
    pendingOpen.current = null;
    const element = windowRefs.current[id];
    if (element && aimZoom(id)) element.dataset.anim = "opening";
    element?.focus({ preventScroll: true });
  });

  // Windows rest below the wordmark, whose height moves with the viewport and
  // again once Linebeam swaps in, so the offset is measured rather than guessed.
  useEffect(() => {
    const title = titleRef.current;
    const desktop = desktopRef.current;
    if (!title || !desktop) return;
    const measure = () => {
      const bottom = title.getBoundingClientRect().bottom + window.scrollY;
      desktop.style.setProperty("--window-top", `${Math.round(Math.max(bottom + 28, 80))}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(title);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  const closeWindow = useCallback((id: WindowId, returnFocus = true) => {
    const element = windowRefs.current[id];
    if (closing.current.has(id)) return;
    const finish = () => {
      closing.current.delete(id);
      if (element) delete element.dataset.anim;
      setOpen((current) => current.filter((entry) => entry !== id));
      setMaximized((current) => current.filter((entry) => entry !== id));
      if (returnFocus) buttonRefs.current[id]?.focus();
    };
    if (!element || !aimZoom(id)) { finish(); return; }
    closing.current.add(id);
    element.dataset.anim = "closing";
    const timeout = setTimeout(finish, CLOSE_MS + 120);
    element.addEventListener("animationend", () => { clearTimeout(timeout); finish(); }, { once: true });
  }, [aimZoom]);

  function toggleWindow(id: WindowId) {
    if (closing.current.has(id)) return;
    if (open.includes(id)) { closeWindow(id); return; }
    delete windowRefs.current[id]?.dataset.anim;
    setOpen((current) => [...current.filter((entry) => entry !== id), id]);
    pendingOpen.current = id;
  }

  function raiseWindow(id: WindowId) {
    setOpen((current) => (current.at(-1) === id ? current : [...current.filter((entry) => entry !== id), id]));
  }

  useEffect(() => {
    if (open.length === 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const top = open.at(-1);
      if (!top) return;
      event.preventDefault();
      closeWindow(top);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, closeWindow]);

  const active = open.at(-1) ?? null;

  return (
    <>
      <div className="taskbar" role="toolbar" aria-label="Open programs">
        {WINDOWS.map((spec) => (
          <button
            key={spec.id}
            ref={(node) => { buttonRefs.current[spec.id] = node; }}
            className="taskbar-button bevel-out"
            type="button"
            aria-pressed={open.includes(spec.id)}
            aria-controls={`window-${spec.id}`}
            onClick={() => toggleWindow(spec.id)}
          >
            <span className={`taskbar-glyph taskbar-glyph--${spec.glyph}`} aria-hidden="true" />
            <span>{spec.label}</span>
          </button>
        ))}
        <span className="taskbar-tray bevel-in" aria-hidden="true">{clock ?? ""}</span>
      </div>

      <main className="desktop" id="desktop" ref={desktopRef}>
        <h1 className="desktop-title" ref={titleRef}>alex_has_tech</h1>

        {WINDOWS.map((spec, index) => {
          const isOpen = open.includes(spec.id);
          const isMaximized = maximized.includes(spec.id);
          return (
            <section
              key={spec.id}
              id={`window-${spec.id}`}
              ref={(node) => { windowRefs.current[spec.id] = node; }}
              className="win95-window bevel-out"
              style={{ "--cascade": index, zIndex: 10 + Math.max(open.indexOf(spec.id), 0) } as CSSProperties}
              hidden={!isOpen}
              tabIndex={-1}
              aria-label={spec.title}
              data-active={active === spec.id}
              data-maximized={isMaximized}
              onPointerDown={() => raiseWindow(spec.id)}
            >
              <div className="window-titlebar">
                <span className="window-title">{spec.title}</span>
                <span className="window-buttons">
                  <button className="bevel-out" type="button" aria-label={`Minimise ${spec.title}`} onClick={() => closeWindow(spec.id)}>_</button>
                  <button
                    className="bevel-out"
                    type="button"
                    aria-pressed={isMaximized}
                    aria-label={`${isMaximized ? "Restore" : "Maximise"} ${spec.title}`}
                    onClick={() => setMaximized((current) => (current.includes(spec.id) ? current.filter((entry) => entry !== spec.id) : [...current, spec.id]))}
                  >
                    <span aria-hidden="true">{isMaximized ? "❐" : "□"}</span>
                  </button>
                  <button className="bevel-out" type="button" aria-label={`Close ${spec.title}`} onClick={() => closeWindow(spec.id)}>✕</button>
                </span>
              </div>

              <div className={`window-body bevel-in${spec.id === "get-to-know" ? "" : " window-body--pane"}`}>
                {spec.id === "projects-completed" && <ProjectPane projects={completed} emptyText="No completed projects to show yet." />}
                {spec.id === "projects-in-progress" && <ProjectPane projects={inProgress} emptyText="Nothing in progress right now." />}
                {spec.id === "get-to-know" && <AboutPane projects={projects} />}
              </div>

              <div className="window-status">
                <span className="bevel-in">
                  {spec.id === "get-to-know"
                    ? "alex_has_tech"
                    : `${spec.id === "projects-completed" ? completed.length : inProgress.length} object(s)`}
                </span>
                <span className="bevel-in">{spec.id === "get-to-know" ? "About" : "Portfolio"}</span>
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
