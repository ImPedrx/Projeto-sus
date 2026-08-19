"use client";

import { formatPrice, formatDuration } from "@/lib/beats/format";
import { waveformFor } from "@/lib/beats/waveform";
import { useState } from "react";
import { usePreviewPlayer } from "@/components/preview-player";
import { BeatDialog } from "@/components/beat-dialog";
import TiltedCard from "@/components/TiltedCard/TiltedCard";
import type { StoreBeat } from "@/lib/beats/queries";
import { copyFor, type Locale } from "@/lib/i18n";

export function BeatCard({
  beat,
  locale,
}: {
  beat: StoreBeat;
  locale: Locale;
}) {
  const t = copyFor(locale);
  const [expanded, setExpanded] = useState(false);
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
      {/* Not a <button>: TiltedCard renders a <figure>, which cannot legally
          sit inside one. The title below is already a button, so the keyboard
          route to the dialog is unchanged. */}
      <div
        onClick={() => setExpanded(true)}
        className={`relative aspect-square w-full cursor-pointer bg-surface-raised ${
          // The tilt lifts and rotates the art, so it needs room inside the
          // frame; without the inset it swings past the card's own border.
          beat.coverUrl ? "p-3" : ""
        }`}
      >
        {beat.coverUrl ? (
          <TiltedCard
            imageSrc={beat.coverUrl}
            altText={beat.title}
            containerHeight="100%"
            containerWidth="100%"
            imageHeight="100%"
            imageWidth="100%"
            rotateAmplitude={14}
            scaleOnHover={1.06}
            showMobileWarning={false}
            showTooltip={false}
            displayOverlayContent={false}
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
          {beat.categories[0]?.name ?? t.cardNoCategory}
        </span>

        <span className="mono absolute right-3 bottom-3 border border-border bg-background/80 px-2 py-1 text-[10px] opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          {t.cardExpand}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="display cursor-pointer text-left text-lg hover:underline"
          >
            {beat.title}
          </button>
          <span className="mono shrink-0 text-sm">{formatPrice(beat.priceCents)}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => beat.previewUrl && toggle(beat.id, beat.previewUrl)}
            disabled={!beat.previewUrl}
            aria-label={playing ? t.cardPauseLabel(beat.title) : t.cardPlayLabel(beat.title)}
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
              {playing ? t.cardPlaying : t.cardPlay}
            </span>
          )}
        </div>

        <p className="mono mt-auto border-t border-border pt-3 text-[11px] text-muted">
          {meta.length ? meta.join(" · ") : t.cardNoMeta}
        </p>
      </div>

      <BeatDialog
        beat={beat}
        locale={locale}
        open={expanded}
        onClose={() => setExpanded(false)}
      />
    </article>
  );
}
