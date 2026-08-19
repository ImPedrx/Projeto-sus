"use client";

import Image from "next/image";
import { formatPrice, formatDuration } from "@/lib/beats/format";
import { waveformFor } from "@/lib/beats/waveform";
import { usePreviewPlayer } from "@/components/preview-player";
import type { StoreBeat } from "@/lib/beats/queries";

export function BeatCard({ beat }: { beat: StoreBeat }) {
  const { playingId, toggle } = usePreviewPlayer();
  const playing = playingId === beat.id;
  const bars = waveformFor(beat.slug, 56);

  const meta = [
    beat.bpm ? `${beat.bpm} BPM` : null,
    beat.musicalKey,
    beat.durationSeconds ? formatDuration(beat.durationSeconds) : null,
  ].filter(Boolean);

  return (
    <article className="group flex flex-col border border-border bg-surface transition-colors hover:border-muted">
      <div className="relative aspect-square overflow-hidden bg-surface-raised">
        {beat.coverUrl ? (
          <Image
            src={beat.coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover grayscale transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          // No cover art is the common case early on. Rather than a placeholder
          // icon, the beat's own waveform becomes the cover — unique to the
          // track, stable across renders, and readable as intent.
          <div className="flex h-full w-full items-center gap-[3px] px-6">
            {bars.map((height, index) => (
              <span
                key={index}
                style={{ height: `${height * 78}%` }}
                className={`min-w-0 flex-1 transition-colors ${
                  playing ? "bg-foreground" : "bg-muted/45 group-hover:bg-muted/70"
                }`}
              />
            ))}
          </div>
        )}

        <span className="mono absolute top-3 left-3 bg-background/80 px-2 py-1 text-[10px] text-muted backdrop-blur">
          {beat.categories[0]?.name ?? "sem categoria"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="display text-lg">{beat.title}</h3>
          <span className="mono shrink-0 text-sm">{formatPrice(beat.priceCents)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => beat.previewUrl && toggle(beat.id, beat.previewUrl)}
            disabled={!beat.previewUrl}
            aria-label={playing ? `Pausar ${beat.title}` : `Ouvir ${beat.title}`}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            {playing ? (
              <svg viewBox="0 0 12 14" className="size-3 fill-current" aria-hidden>
                <rect x="0" y="0" width="4" height="14" />
                <rect x="8" y="0" width="4" height="14" />
              </svg>
            ) : (
              <svg viewBox="0 0 12 14" className="size-3 fill-current" aria-hidden>
                <path d="M0 0l12 7-12 7z" />
              </svg>
            )}
          </button>

          {beat.coverUrl ? (
            // With cover art the waveform has not appeared yet, so it earns its
            // place next to the button. Without one it would be the second copy
            // on the same card.
            <div className="flex h-8 flex-1 items-center gap-[2px]">
              {bars.map((height, index) => (
                <span
                  key={index}
                  style={{ height: `${height * 100}%` }}
                  className={`min-w-0 flex-1 rounded-[1px] transition-colors ${
                    playing ? "bg-foreground" : "bg-border group-hover:bg-muted"
                  }`}
                />
              ))}
            </div>
          ) : (
            <span className="mono flex-1 text-[11px] text-muted">
              {playing ? "tocando preview" : "ouvir preview"}
            </span>
          )}
        </div>

        <p className="mono mt-auto border-t border-border pt-3 text-[11px] text-muted">
          {meta.length ? meta.join(" · ") : "sem metadados"}
        </p>
      </div>
    </article>
  );
}
