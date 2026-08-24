"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { FALLBACK_BILLBOARD, isBillboardEdition, type BillboardEdition } from "../data/billboard";

type BillboardStripProps = {
  isOpen: boolean;
  onMinimize: () => void;
  onClose: () => void;
};

type DragState = {
  pointerId: number;
  startY: number;
  startTop: number;
  minTop: number;
  maxTop: number;
};

function formatUpdatedAt(timestamp: string) {
  if (timestamp === FALLBACK_BILLBOARD.generatedAt) return "WAITING FOR DAILY DISPATCH";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(timestamp)).toUpperCase();
}

export function BillboardStrip({ isOpen, onMinimize, onClose }: BillboardStripProps) {
  const [edition, setEdition] = useState<BillboardEdition>(FALLBACK_BILLBOARD);
  const [top, setTop] = useState<number | null>(null);
  const billboardRef = useRef<HTMLElement>(null);
  const dragState = useRef<DragState | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/billboard.json", { headers: { accept: "application/json" }, signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Billboard request failed: ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (isBillboardEdition(payload)) setEdition(payload);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // The checked-in fallback keeps the desktop useful during a feed outage.
        }
      });
    return () => controller.abort();
  }, []);

  const entries = useMemo(() => [
    {
      key: "github",
      label: `PS C:\\ALEXNET> github --since ${edition.github.windowHours}h :: ${edition.github.summary}`,
      url: "https://github.com/abharrison1995-droid",
    },
    ...edition.stories.map((story, index) => ({
      key: story.url,
      label: `PS C:\\ALEXNET> tech[${index + 1}/5] :: ${story.headline} [${story.source}]`,
      url: story.url,
    })),
  ], [edition]);

  const track = (hidden: boolean) => (
    <span className="billboard-track-set" aria-hidden={hidden || undefined}>
      {entries.map((entry) => (
        <a key={entry.key} href={entry.url} target="_blank" rel="noopener noreferrer" tabIndex={hidden ? -1 : undefined}>
          {entry.label}
        </a>
      ))}
    </span>
  );

  function beginDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".billboard-window-controls")) return;
    const billboard = billboardRef.current;
    const desktop = billboard?.parentElement;
    if (!billboard || !desktop) return;

    const billboardRect = billboard.getBoundingClientRect();
    const desktopRect = desktop.getBoundingClientRect();
    const halfHeight = billboardRect.height / 2;
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTop: billboardRect.top - desktopRect.top + halfHeight,
      minTop: halfHeight,
      maxTop: Math.max(halfHeight, desktopRect.height - halfHeight),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextTop = drag.startTop + event.clientY - drag.startY;
    setTop(Math.min(Math.max(nextTop, drag.minTop), drag.maxTop));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null;
  }

  return (
    <aside
      id="daily-billboard"
      ref={billboardRef}
      className="billboard"
      style={top === null ? undefined : { "--billboard-top": `${top}px` } as CSSProperties}
      hidden={!isOpen}
      aria-label="Daily GitHub activity and technology headlines"
    >
      <div
        className="billboard-header"
        title="Drag vertically to reposition"
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="billboard-title"><span className="billboard-powershell-icon" aria-hidden="true">&gt;_</span>ALTECH PowerShell</span>
        <span className="billboard-header-actions">
          <span className="billboard-updated-at">{formatUpdatedAt(edition.generatedAt)}</span>
          <span className="billboard-window-controls">
            <button className="billboard-window-button bevel-out" type="button" aria-label="Minimise ALTECH PowerShell bulletin" onClick={onMinimize}>_</button>
            <button className="billboard-window-button bevel-out" type="button" aria-label="Close ALTECH PowerShell bulletin" onClick={onClose}>✕</button>
          </span>
        </span>
      </div>
      <div className="billboard-viewport">
        <div className="billboard-track">
          {track(false)}
          {track(true)}
        </div>
      </div>
    </aside>
  );
}
