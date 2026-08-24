"use client";

import { useEffect, useMemo, useState } from "react";
import { FALLBACK_BILLBOARD, isBillboardEdition, type BillboardEdition } from "../data/billboard";

function formatUpdatedAt(timestamp: string) {
  if (timestamp === FALLBACK_BILLBOARD.generatedAt) return "WAITING FOR DAILY DISPATCH";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(timestamp)).toUpperCase();
}

export function BillboardStrip() {
  const [edition, setEdition] = useState<BillboardEdition>(FALLBACK_BILLBOARD);

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

  return (
    <aside className="billboard" aria-label="Daily GitHub activity and technology headlines">
      <div className="billboard-header">
        <span><span className="billboard-powershell-icon" aria-hidden="true">&gt;_</span>Windows PowerShell — ALEXNET DAILY WIRE</span>
        <span>{formatUpdatedAt(edition.generatedAt)}</span>
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
