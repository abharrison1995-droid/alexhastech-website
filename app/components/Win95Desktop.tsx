"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { Project, ProjectImage } from "../data/projects";
import { BillboardStrip } from "./BillboardStrip";
import { ClippyPane } from "./ClippyPane";

type StaticWindowId = "projects-completed" | "projects-in-progress" | "chatgpt-grandad" | "get-to-know";
type ProjectWindowId = `project-${string}`;
type WindowId = StaticWindowId | ProjectWindowId;
type WindowSpec = { id: StaticWindowId; label: string; title: string; glyph: "navy" | "teal" | "gold" | "magenta" };
type WindowRender = {
  id: WindowId;
  title: string;
  body: ReactNode;
  status: string;
  cascade: number;
  className?: string;
  pane?: boolean;
};

const WINDOWS: readonly WindowSpec[] = [
  { id: "projects-completed", label: "Projects completed", title: "Projects completed", glyph: "teal" },
  { id: "projects-in-progress", label: "Projects in progress", title: "Projects in progress", glyph: "navy" },
  { id: "chatgpt-grandad", label: "Summon ChatGPT's Grandad", title: "ChatGPT's Grandad — Clippy", glyph: "magenta" },
  { id: "get-to-know", label: "Get to know", title: "Get to know — alex_has_tech", glyph: "gold" },
] as const;

const CLOSE_MS = 200;

function projectWindowId(project: Project): ProjectWindowId {
  return `project-${project.slug}`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shouldOpenInDesktop(event: ReactMouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function ProjectTile({ project, onOpen }: { project: Project; onOpen: (project: Project, launcher: HTMLElement) => void }) {
  const openProject = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (!shouldOpenInDesktop(event)) return;
    event.preventDefault();
    onOpen(project, event.currentTarget);
  };

  return (
    <li className={`project-tile project-tile--${project.accent} bevel-out`}>
      <span className="tile-caption">{project.title}</span>
      <Link className="tile-thumb-link" href={`/projects/${project.slug}`} onClick={openProject} aria-label={`Open ${project.title} project window`}>
        {project.hero
          ? <img className="tile-thumb" src={project.hero.src} alt="" loading="lazy" decoding="async" />
          : <span className="tile-thumb tile-thumb--empty" aria-hidden="true">No screenshot yet</span>}
      </Link>
      <div className="tile-meta">
        <span className="tile-status">{project.status}</span>
        <h3 className="tile-name"><Link href={`/projects/${project.slug}`} onClick={openProject}>{project.title}</Link></h3>
        <p className="tile-summary">{project.summary}</p>
        <Link className="tile-link" href={`/projects/${project.slug}`} onClick={openProject}>Open project <span aria-hidden="true">→</span></Link>
      </div>
    </li>
  );
}

function ProjectPane({ projects, emptyText, onOpen }: { projects: readonly Project[]; emptyText: string; onOpen: (project: Project, launcher: HTMLElement) => void }) {
  if (projects.length === 0) return <p className="tile-empty">{emptyText}</p>;
  return <ul className="tile-grid">{projects.map((project) => <ProjectTile key={project.slug} project={project} onOpen={onOpen} />)}</ul>;
}

function ProjectDetailPane({ project }: { project: Project }) {
  const images: readonly ProjectImage[] = project.hero ? [project.hero, ...(project.gallery ?? [])] : (project.gallery ?? []);
  const [selectedSrc, setSelectedSrc] = useState(images[0]?.src ?? null);
  const selected = images.find((image) => image.src === selectedSrc) ?? images[0];

  return (
    <article className="project-detail-pane">
      <div className="project-detail-media">
        {selected
          ? <img className="project-detail-hero" src={selected.src} alt={selected.alt} decoding="async" />
          : <div className="project-detail-empty">No screenshots available.</div>}
        {images.length > 1 && (
          <div className="project-detail-thumbnails" aria-label={`${project.title} screenshots`}>
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                className="project-detail-thumbnail bevel-out"
                aria-label={`Show screenshot ${index + 1} of ${images.length}`}
                aria-pressed={selected?.src === image.src}
                onClick={() => setSelectedSrc(image.src)}
              >
                <img src={image.src} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="project-detail-copy">
        <div className="project-detail-heading">
          <span className="project-detail-status">{project.status}</span>
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
        </div>

        <dl className="project-detail-facts">
          <dt>Role</dt>
          <dd>{project.role}</dd>
          <dt>Technology</dt>
          <dd><ul className="technology-list">{project.technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul></dd>
        </dl>

        <section className="project-detail-section">
          <h3>Technical notes</h3>
          <ul>{project.technicalHighlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
          <p>{project.detail}</p>
        </section>

        {project.safety.length > 0 && (
          <section className="project-detail-section project-detail-warning">
            <h3>Safety and support</h3>
            {project.safety.map((note) => <p key={note}>{note}</p>)}
          </section>
        )}

        <div className="project-detail-actions">
          {project.repoUrl && <a className="bevel-out" href={project.repoUrl} target="_blank" rel="noopener noreferrer">View GitHub source</a>}
          <Link className="bevel-out" href={`/projects/${project.slug}`}>Open full project page</Link>
        </div>
      </div>
    </article>
  );
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
        <dt>Project windows</dt>
        <dd>Select any project tile to open screenshots and technical details without leaving the desktop.</dd>
        <dt>Contact</dt>
        <dd><a href="mailto:abharrison1995@gmail.com">abharrison1995@gmail.com</a></dd>
      </dl>
    </div>
  );
}

function GithubGlyph() {
  return (
    <svg className="taskbar-github-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function TaskbarClock() {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const timer = setInterval(tick, 30000);
    return () => clearInterval(timer);
  }, []);

  return <span className="taskbar-tray bevel-in" aria-hidden="true">{clock ?? ""}</span>;
}

export function Win95Desktop({ projects }: { projects: readonly Project[] }) {
  const completed = projects.filter((project) => project.status === "Released");
  const inProgress = projects.filter((project) => project.status !== "Released");
  const [open, setOpen] = useState<readonly WindowId[]>([]);
  const [maximized, setMaximized] = useState<readonly WindowId[]>([]);
  const windowRefs = useRef<Partial<Record<WindowId, HTMLElement | null>>>({});
  const launchRefs = useRef<Partial<Record<WindowId, HTMLElement | null>>>({});
  const desktopRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pendingOpen = useRef<WindowId | null>(null);
  const closing = useRef(new Set<WindowId>());
  const dragOffsets = useRef<Partial<Record<WindowId, { x: number; y: number }>>>({});
  const dragState = useRef<{ id: WindowId; pointerId: number; startX: number; startY: number; startRect: DOMRect; baseX: number; baseY: number } | null>(null);

  const aimZoom = useCallback((id: WindowId) => {
    const element = windowRefs.current[id];
    const launcher = launchRefs.current[id];
    if (!element || !launcher || prefersReducedMotion()) return false;
    const target = element.getBoundingClientRect();
    const source = launcher.getBoundingClientRect();
    if (target.width === 0 || target.height === 0) return false;
    element.style.setProperty("--zx", `${source.left + source.width / 2 - (target.left + target.width / 2)}px`);
    element.style.setProperty("--zy", `${source.top + source.height / 2 - (target.top + target.height / 2)}px`);
    element.style.setProperty("--sx", `${Math.max(source.width / target.width, 0.02)}`);
    element.style.setProperty("--sy", `${Math.max(source.height / target.height, 0.02)}`);
    return true;
  }, []);

  useLayoutEffect(() => {
    const id = pendingOpen.current;
    if (!id) return;
    pendingOpen.current = null;
    const element = windowRefs.current[id];
    if (element && aimZoom(id)) element.dataset.anim = "opening";
    element?.focus({ preventScroll: true });
  });

  useEffect(() => {
    const title = titleRef.current;
    const desktop = desktopRef.current;
    if (!title || !desktop) return;
    const measure = () => {
      const bottom = title.getBoundingClientRect().bottom;
      desktop.style.setProperty("--window-top", `${Math.round(Math.max(bottom + 28, 80))}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(title);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const closeWindow = useCallback((id: WindowId, returnFocus = true) => {
    const element = windowRefs.current[id];
    if (closing.current.has(id)) return;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      closing.current.delete(id);
      setOpen((current) => current.filter((entry) => entry !== id));
      setMaximized((current) => current.filter((entry) => entry !== id));
      if (returnFocus) launchRefs.current[id]?.focus();
    };
    if (!element || !aimZoom(id)) { finish(); return; }
    closing.current.add(id);
    element.dataset.anim = "closing";
    const timeout = setTimeout(finish, CLOSE_MS + 120);
    element.addEventListener("animationend", () => { clearTimeout(timeout); finish(); }, { once: true });
  }, [aimZoom]);

  function openWindow(id: WindowId, launcher?: HTMLElement) {
    if (closing.current.has(id)) return;
    if (launcher) launchRefs.current[id] = launcher;
    if (open.includes(id)) {
      setOpen((current) => [...current.filter((entry) => entry !== id), id]);
      windowRefs.current[id]?.focus({ preventScroll: true });
      return;
    }
    delete windowRefs.current[id]?.dataset.anim;
    setOpen((current) => [...current.filter((entry) => entry !== id), id]);
    pendingOpen.current = id;
  }

  function toggleWindow(id: StaticWindowId) {
    if (open.includes(id)) closeWindow(id);
    else openWindow(id);
  }

  function openProject(project: Project, launcher: HTMLElement) {
    openWindow(projectWindowId(project), launcher);
  }

  function raiseWindow(id: WindowId) {
    setOpen((current) => (!current.includes(id) || current.at(-1) === id ? current : [...current.filter((entry) => entry !== id), id]));
  }

  function resetDrag(id: WindowId) {
    dragOffsets.current[id] = { x: 0, y: 0 };
    const element = windowRefs.current[id];
    element?.style.setProperty("--drag-x", "0px");
    element?.style.setProperty("--drag-y", "0px");
  }

  const beginDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>, id: WindowId) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".window-buttons") || maximized.includes(id)) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const element = windowRefs.current[id];
    if (!element) return;
    raiseWindow(id);
    const offset = dragOffsets.current[id] ?? { x: 0, y: 0 };
    dragState.current = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startRect: element.getBoundingClientRect(), baseX: offset.x, baseY: offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [maximized]);

  function onDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const element = windowRefs.current[drag.id];
    if (!element) return;
    const taskbarHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--taskbar-height")) || 0;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const maxLeft = Math.max(0, window.innerWidth - drag.startRect.width);
    const maxTop = Math.max(taskbarHeight, window.innerHeight - drag.startRect.height);
    const clampedLeft = Math.min(Math.max(drag.startRect.left + dx, 0), maxLeft);
    const clampedTop = Math.min(Math.max(drag.startRect.top + dy, taskbarHeight), maxTop);
    const x = drag.baseX + (clampedLeft - drag.startRect.left);
    const y = drag.baseY + (clampedTop - drag.startRect.top);
    dragOffsets.current[drag.id] = { x, y };
    element.style.setProperty("--drag-x", `${x}px`);
    element.style.setProperty("--drag-y", `${y}px`);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
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

  const renderWindow = ({ id, title, body, status, cascade, className = "", pane = false }: WindowRender) => {
    const isOpen = open.includes(id);
    const isMaximized = maximized.includes(id);
    return (
      <section
        key={id}
        id={`window-${id}`}
        ref={(node) => { windowRefs.current[id] = node; }}
        className={`win95-window bevel-out${className}`}
        style={{ "--cascade": cascade, zIndex: 10 + Math.max(open.indexOf(id), 0) } as CSSProperties}
        hidden={!isOpen}
        tabIndex={-1}
        aria-label={title}
        data-active={active === id}
        data-maximized={isMaximized}
        onPointerDown={() => raiseWindow(id)}
      >
        <div className="window-titlebar" onPointerDown={(event) => beginDrag(event, id)} onPointerMove={onDragMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
          <span className="window-title">{title}</span>
          <span className="window-buttons">
            <button className="bevel-out" type="button" aria-label={`Minimise ${title}`} onClick={() => closeWindow(id)}>_</button>
            <button
              className="bevel-out"
              type="button"
              aria-pressed={isMaximized}
              aria-label={`${isMaximized ? "Restore" : "Maximise"} ${title}`}
              onClick={() => {
                if (!isMaximized) resetDrag(id);
                setMaximized((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
              }}
            >
              <span aria-hidden="true">{isMaximized ? "❐" : "□"}</span>
            </button>
            <button className="bevel-out" type="button" aria-label={`Close ${title}`} onClick={() => closeWindow(id)}>✕</button>
          </span>
        </div>
        <div className={`window-body bevel-in${pane ? " window-body--pane" : ""}`}>{body}</div>
        <div className="window-status"><span className="bevel-in">{status}</span><span className="bevel-in">AL-TECH</span></div>
      </section>
    );
  };

  return (
    <>
      <div className="taskbar" role="toolbar" aria-label="Open programs">
        {WINDOWS.map((spec) => (
          <button
            key={spec.id}
            ref={(node) => { launchRefs.current[spec.id] = node; }}
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
        <a className="taskbar-button taskbar-github bevel-out" href="https://github.com/abharrison1995-droid" target="_blank" rel="noopener noreferrer">
          <GithubGlyph /><span>My GitHub</span>
        </a>
        <TaskbarClock />
      </div>

      <main className="desktop" id="desktop" ref={desktopRef}>
        <h1 className="desktop-title" ref={titleRef}>alex_has_tech</h1>
        <BillboardStrip />

        {renderWindow({ id: "projects-completed", title: "Projects completed", body: <ProjectPane projects={completed} emptyText="No completed projects to show yet." onOpen={openProject} />, status: `${completed.length} object(s)`, cascade: 0, pane: true })}
        {renderWindow({ id: "projects-in-progress", title: "Projects in progress", body: <ProjectPane projects={inProgress} emptyText="Nothing in progress right now." onOpen={openProject} />, status: `${inProgress.length} object(s)`, cascade: 1, pane: true })}
        {renderWindow({ id: "chatgpt-grandad", title: "ChatGPT's Grandad — Clippy", body: <ClippyPane />, status: "Clippy 1.0 — Office Assistant", cascade: 2, className: " win95-window--clippy" })}
        {renderWindow({ id: "get-to-know", title: "Get to know — alex_has_tech", body: <AboutPane projects={projects} />, status: "alex_has_tech", cascade: 3, className: " win95-window--about" })}

        {projects.filter((project) => open.includes(projectWindowId(project))).map((project, index) => renderWindow({
          id: projectWindowId(project),
          title: `${project.title} — Project details`,
          body: <ProjectDetailPane project={project} />,
          status: `${project.technologies.length} technologies · ${project.status}`,
          cascade: index % 3,
          className: " win95-window--project",
          pane: true,
        }))}
      </main>
    </>
  );
}
