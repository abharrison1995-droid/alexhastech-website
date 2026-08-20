"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "../data/projects";
import { isLegal, resolveMove, snapMove, type Point, type Rect, type Size } from "../lib/desktop-geometry";
import { isStoredLayout, type Layout } from "../lib/desktop-layout";

const STORAGE_KEY = "portfolio-desktop-layout-v2";
const STEP = 72;
type Drag = { slug: string; pointerId: number; start: Point; origin: Point; bounds: Size; rects: Record<string, Rect>; moved: boolean; pending?: Point; frame?: number };
function readLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw) as unknown;
  } catch { clearLayout(); return null; }
}
function writeLayout(layout: Layout) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch { /* optional */ } }
function clearLayout() { try { localStorage.removeItem(STORAGE_KEY); } catch { /* optional */ } }

export function DesktopStage({ projects }: { projects: readonly Project[] }) {
  const desktopProjects = useMemo(() => projects.filter((project) => project.desktop), [projects]);
  const slugs = useMemo(() => desktopProjects.map((project) => project.slug), [desktopProjects]);
  const defaults = useMemo<Layout>(() => Object.fromEntries(desktopProjects.map((project) => [project.slug, { x: project.desktop!.x, y: project.desktop!.y }])), [desktopProjects]);
  const stageRef = useRef<HTMLElement>(null);
  const positionsRef = useRef<Layout>(defaults);
  const drag = useRef<Drag | null>(null);
  const resizeFrame = useRef<number | null>(null);
  const [positions, setPositions] = useState<Layout>(defaults);
  const [enabled, setEnabled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const commit = (next: Layout) => { positionsRef.current = next; setPositions(next); };
  const measure = (layout: Layout) => {
    // Transforms are positioned relative to this absolute container, not the
    // padded stage element. Geometry must use the same coordinate system.
    const box = stageRef.current?.querySelector<HTMLElement>(".desktop-windows")?.getBoundingClientRect(); const rects: Record<string, Rect> = {};
    for (const project of desktopProjects) {
      const element = stageRef.current?.querySelector<HTMLElement>(`[data-project="${project.slug}"]`);
      if (element && layout[project.slug]) rects[project.slug] = { ...layout[project.slug], width: element.offsetWidth, height: element.offsetHeight };
    }
    return { bounds: { width: box?.width ?? 0, height: box?.height ?? 0 }, rects };
  };
  const layoutIsLegal = (layout: Layout) => {
    if (!isStoredLayout(layout, slugs)) return false;
    const { bounds, rects } = measure(layout);
    return slugs.every((slug) => !!rects[slug] && isLegal(rects[slug], bounds, Object.entries(rects).filter(([other]) => other !== slug).map(([, rect]) => rect)));
  };
  const cancelDrag = () => {
    const state = drag.current; if (!state) return;
    if (state.frame) cancelAnimationFrame(state.frame);
    commit({ ...positionsRef.current, [state.slug]: state.origin });
    stageRef.current?.querySelector<HTMLElement>(`[data-project="${state.slug}"]`)?.removeAttribute("data-dragging");
    drag.current = null;
  };

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1100px) and (pointer: fine)");
    const update = () => { cancelDrag(); setOpenMenu(null); setEnabled(query.matches); };
    update(); query.addEventListener("change", update); window.addEventListener("resize", update);
    return () => { query.removeEventListener("change", update); window.removeEventListener("resize", update); cancelDrag(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopProjects]);

  useEffect(() => {
    if (!enabled || !stageRef.current) return;
    const validate = () => {
      if (!layoutIsLegal(defaults)) { clearLayout(); commit(defaults); setEnabled(false); return; }
      const saved = readLayout();
      if (isStoredLayout(saved, slugs) && layoutIsLegal(saved)) commit(saved);
      else { if (saved !== null) clearLayout(); commit(defaults); }
    };
    const schedule = () => { if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current); resizeFrame.current = requestAnimationFrame(() => { resizeFrame.current = null; validate(); }); };
    const observer = new ResizeObserver(() => { cancelDrag(); schedule(); }); observer.observe(stageRef.current); schedule();
    return () => { observer.disconnect(); if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  useEffect(() => {
    if (!openMenu) return;
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      stageRef.current?.querySelector<HTMLButtonElement>(`[data-move-trigger="${openMenu}"]`)?.focus();
      setOpenMenu(null);
    };
    document.addEventListener("keydown", dismissOnEscape);
    return () => document.removeEventListener("keydown", dismissOnEscape);
  }, [openMenu]);

  function reset() { clearLayout(); cancelDrag(); commit(defaults); setOpenMenu(null); setAnnouncement("Desktop layout reset."); }
  function onPointerDown(event: React.PointerEvent<HTMLDivElement>, slug: string) {
    if (!enabled || !event.isPrimary || event.button !== 0 || drag.current) return;
    const { bounds, rects } = measure(positionsRef.current); if (!rects[slug]) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { slug, pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: positionsRef.current[slug], bounds, rects, moved: false };
  }
  function flushMove() {
    const state = drag.current; if (!state?.pending) return;
    const point = state.pending; state.pending = undefined; state.frame = undefined;
    const current = { ...state.rects[state.slug], ...state.origin };
    const others = Object.entries(state.rects).filter(([slug]) => slug !== state.slug).map(([, rect]) => rect);
    commit({ ...positionsRef.current, [state.slug]: resolveMove(current, point, state.bounds, others) });
  }
  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current; if (!enabled || !state || !event.isPrimary || event.pointerId !== state.pointerId) return;
    const dx = event.clientX - state.start.x, dy = event.clientY - state.start.y;
    if (!state.moved && Math.hypot(dx, dy) < 6) return;
    state.moved = true; event.currentTarget.closest<HTMLElement>("[data-project]")?.setAttribute("data-dragging", "true");
    state.pending = { x: state.origin.x + dx, y: state.origin.y + dy }; if (!state.frame) state.frame = requestAnimationFrame(flushMove);
  }
  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current; if (!state || event.pointerId !== state.pointerId) return;
    if (state.frame) { cancelAnimationFrame(state.frame); flushMove(); }
    const current = { ...state.rects[state.slug], ...positionsRef.current[state.slug] };
    const others = Object.entries(state.rects).filter(([slug]) => slug !== state.slug).map(([, rect]) => rect);
    const next = { ...positionsRef.current, [state.slug]: snapMove(current, state.bounds, others) };
    stageRef.current?.querySelector<HTMLElement>(`[data-project="${state.slug}"]`)?.removeAttribute("data-dragging"); drag.current = null;
    if (state.moved) { commit(next); writeLayout(next); setAnnouncement("Window position saved."); }
  }
  function onPointerCancel(event: React.PointerEvent<HTMLDivElement>) { if (drag.current?.pointerId === event.pointerId) cancelDrag(); }
  function dismissWhenFocusLeaves(event: React.FocusEvent<HTMLButtonElement>) {
    const menu = event.currentTarget.closest<HTMLElement>(".window-move");
    requestAnimationFrame(() => { if (menu && !menu.contains(document.activeElement)) setOpenMenu(null); });
  }
  function moveBy(slug: string, name: string, delta: Point) {
    const { bounds, rects } = measure(positionsRef.current); const current = rects[slug]; if (!current) return;
    const others = Object.entries(rects).filter(([other]) => other !== slug).map(([, rect]) => rect);
    const resolved = resolveMove(current, { x: current.x + delta.x, y: current.y + delta.y }, bounds, others);
    const point = snapMove({ ...current, ...resolved }, bounds, others);
    if (!isLegal({ ...current, ...point }, bounds, others)) return;
    commit({ ...positionsRef.current, [slug]: point }); writeLayout({ ...positionsRef.current, [slug]: point });
    const project = desktopProjects.find((record) => record.slug === slug);
    setAnnouncement(`${project?.title ?? "Window"}: ${name.toLowerCase()} ${point.x === current.x && point.y === current.y ? "is unavailable" : "moved"}.`);
  }

  return <section className="project-stage" id="project-stage" ref={stageRef} aria-labelledby="stage-title">
    <div className="stage-heading"><div><p className="eyebrow">Project stage</p><h2 id="stage-title">Featured work</h2></div><p className="stage-affordance">{enabled ? "Drag title bars or use Move controls" : "Cards arrange automatically"}</p></div>
    <div className="desktop-windows" data-enhanced={enabled || undefined}>{desktopProjects.map((project) => <article key={project.slug} className={`project-window project-window--${project.accent} project-window--${project.desktop!.width}`} data-project={project.slug} style={enabled ? { transform: `translate3d(${positions[project.slug].x}px, ${positions[project.slug].y}px, 0)` } : undefined}>
      <div className="window-titlebar" role="group" aria-label={`${project.title} window title bar`} title={enabled ? "Drag with a mouse or trackpad" : undefined} onPointerDown={(event) => onPointerDown(event, project.slug)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onLostPointerCapture={onPointerCancel}><span>{project.featured ? "Featured project" : "Project"}</span></div>
      <div className="window-content">{project.hero && <img className="window-thumb" src={project.hero.src} alt="" loading="lazy" decoding="async" aria-hidden="true" />}<p className="project-status">{project.status}</p><h3><Link href={`/projects/${project.slug}`}>{project.title}</Link></h3><p>{project.summary}</p><Link className="project-link" href={`/projects/${project.slug}`}>Read project notes <span aria-hidden="true">→</span></Link>{enabled && <div className="window-move"><button className="move-trigger" data-move-trigger={project.slug} type="button" aria-expanded={openMenu === project.slug} aria-controls={`move-${project.slug}`} onBlur={dismissWhenFocusLeaves} onClick={() => setOpenMenu(openMenu === project.slug ? null : project.slug)}>Move</button>{openMenu === project.slug && <div id={`move-${project.slug}`} className="move-actions" aria-label={`Move ${project.title}`}><button type="button" onBlur={dismissWhenFocusLeaves} onClick={() => moveBy(project.slug, "Up", { x: 0, y: -STEP })}>Up</button><button type="button" onBlur={dismissWhenFocusLeaves} onClick={() => moveBy(project.slug, "Left", { x: -STEP, y: 0 })}>Left</button><button type="button" onBlur={dismissWhenFocusLeaves} onClick={() => moveBy(project.slug, "Right", { x: STEP, y: 0 })}>Right</button><button type="button" onBlur={dismissWhenFocusLeaves} onClick={() => moveBy(project.slug, "Down", { x: 0, y: STEP })}>Down</button></div>}</div>}</div>
    </article>)}</div>
    {enabled && <button className="reset-layout" type="button" onClick={reset}>Reset layout</button>}<p className="sr-only" aria-live="polite">{announcement}</p>
  </section>;
}