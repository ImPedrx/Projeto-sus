"use client";

import Image from "next/image";
import { useState } from "react";
import { formatPrice, formatDuration, formatPostedDate } from "@/lib/beats/format";
import { licensePriceCents } from "@/lib/beats/licenses";
import { waveformFor } from "@/lib/beats/waveform";
import { usePreviewPlayer } from "@/components/preview-player";
import { BeatDialog } from "@/components/beat-dialog";
import type { StoreBeat } from "@/lib/beats/queries";
import { copyFor, type Locale } from "@/lib/i18n";

// The list counterpart of BeatCard: same beat, same dialog, laid out as a row
// so titles, tempo and price line up down the page.
export function BeatRow({ beat, locale }: { beat: StoreBeat; locale: Locale }) {
  const t = copyFor(locale);
  const [expanded, setExpanded] = useState(false);
  const { playingId, toggle } = usePreviewPlayer();
  const playing = playingId === beat.id;
  const bars = waveformFor(beat.slug, 40);
  const service = beat.kind === "service";

  const meta = [
    beat.bpm ? `${beat.bpm} BPM` : null,
    beat.musicalKey,
    beat.durationSeconds ? formatDuration(beat.durationSeconds) : null,
    t.postedOn(formatPostedDate(beat.createdAt, locale)),
  ].filter(Boolean);

  // A beat is quoted from its cheapest licence; a service has one price.
  const cheapest = licensePriceCents(beat, service ? "service" : "mp3");

  return (
    <div className="group flex items-center gap-4 py-4 transition-colors hover:bg-surface sm:gap-5">
      <div className="relative size-16 shrink-0 overflow-hidden border border-border bg-surface-raised">
        {beat.coverUrl ? (
          <Image
            src={beat.coverUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover grayscale"
          />
        ) : (
          <div className="flex h-full w-full items-center gap-[2px] px-2">
            {bars.slice(0, 14).map((height, index) => (
              <span
                key={index}
                style={{ height: `${height * 70}%` }}
                className={`min-w-0 flex-1 ${playing ? "bg-foreground" : "bg-muted/45"}`}
              />
            ))}
          </div>
        )}
      </div>

      {!service && (
        <button
          type="button"
          onClick={() => beat.previewUrl && toggle(beat.id, beat.previewUrl)}
          disabled={!beat.previewUrl}
          aria-label={playing ? t.cardPauseLabel(beat.title) : t.cardPlayLabel(beat.title)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground hover:text-background disabled:opacity-40"
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
      )}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="display block max-w-full truncate text-left text-base hover:underline sm:text-lg"
        >
          {beat.title}
        </button>
        <p className="mono mt-1 truncate text-[11px] text-muted">
          {beat.categories[0]?.name ?? t.cardNoCategory}
          {meta.length > 0 && ` · ${meta.join(" · ")}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <span className="mono hidden text-xs text-muted sm:block">
          {cheapest === null
            ? t.licenseInquire
            : service
              ? formatPrice(cheapest)
              : t.priceFrom(formatPrice(cheapest))}
        </span>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mono border border-border px-3 py-2 text-[11px] transition-colors hover:border-foreground"
        >
          {t.cardExpand}
        </button>
      </div>

      <BeatDialog
        beat={beat}
        locale={locale}
        open={expanded}
        onClose={() => setExpanded(false)}
      />
    </div>
  );
}
