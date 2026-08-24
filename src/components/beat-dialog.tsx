"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { formatPrice, formatDuration, formatPostedDate } from "@/lib/beats/format";
import { licensePriceCents, LICENSES, type LineLicense } from "@/lib/beats/licenses";
import { waveformFor } from "@/lib/beats/waveform";
import { usePreviewPlayer } from "@/components/preview-player";
import { useCart } from "@/components/cart/cart-provider";
import { copyFor, type Locale } from "@/lib/i18n";
import type { StoreBeat } from "@/lib/beats/queries";

export function BeatDialog({
  beat,
  locale,
  open,
  onClose,
}: {
  beat: StoreBeat;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const t = copyFor(locale);
  const ref = useRef<HTMLDialogElement>(null);
  const { playingId, toggle } = usePreviewPlayer();
  const { add, has } = useCart();
  const playing = playingId === beat.id;
  const bars = waveformFor(beat.slug, 72);
  const service = beat.kind === "service";

  // The native dialog brings focus trapping, Esc and the top layer with it, so
  // none of that has to be rebuilt here.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  function addLicense(license: LineLicense) {
    onClose();
    add({
      beatId: beat.id,
      license,
      title: beat.title,
      slug: beat.slug,
      priceCents: licensePriceCents(beat, license),
      coverUrl: beat.coverUrl,
    });
  }

  const specs: Array<[string, string]> = [
    ...(service
      ? []
      : ([
          [t.specBpm, beat.bpm ? String(beat.bpm) : t.specUnknown],
          [t.specKey, beat.musicalKey ?? t.specUnknown],
          [
            t.specDuration,
            beat.durationSeconds ? formatDuration(beat.durationSeconds) : t.specUnknown,
          ],
          [t.specFormats, beat.hasWav ? "MP3 · WAV" : "MP3"],
        ] as Array<[string, string]>)),
    [
      t.specCategories,
      beat.categories.length
        ? beat.categories.map((category) => category.name).join(", ")
        : t.cardNoCategory,
    ],
    [t.specPosted, formatPostedDate(beat.createdAt, locale) || t.specUnknown],
  ];

  const licenseNotes: Record<(typeof LICENSES)[number], string> = {
    mp3: t.licenseMp3Note,
    wav: t.licenseWavNote,
    exclusive: t.licenseExclusiveNote,
  };
  const licenseLabels: Record<(typeof LICENSES)[number], string> = {
    mp3: t.licenseMp3,
    wav: t.licenseWav,
    exclusive: t.licenseExclusive,
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        // A click that lands on the dialog element itself is a click on the
        // backdrop; anything inside hits a child first.
        if (event.target === ref.current) onClose();
      }}
      className="relative m-auto max-h-[90svh] w-[min(64rem,92vw)] overflow-y-auto border border-border bg-surface p-0 text-foreground backdrop:bg-background/80 backdrop:backdrop-blur-sm"
    >
      {/* First in the DOM, not just first on screen: showModal() focuses the
          earliest focusable child and scrolls it into view, so a close button
          declared last would open the dialog already scrolled to the bottom. */}
      <button
        type="button"
        autoFocus
        onClick={onClose}
        className="mono absolute top-4 left-4 z-10 border border-border bg-background/80 px-2 py-1 text-[11px] text-muted backdrop-blur transition-colors hover:text-foreground"
      >
        {t.dialogClose}
      </button>

      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative aspect-square bg-surface-raised">
          {beat.coverUrl ? (
            <Image
              src={beat.coverUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 92vw, 32rem"
              className="object-cover grayscale"
            />
          ) : (
            <div className="flex h-full w-full items-center gap-[3px] px-8">
              {bars.map((height, index) => (
                <span
                  key={index}
                  style={{ height: `${height * 78}%` }}
                  className={`min-w-0 flex-1 ${playing ? "bg-foreground" : "bg-muted/45"}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="display text-2xl">{beat.title}</h2>
            <span className="mono shrink-0 text-sm text-muted">
              {formatPostedDate(beat.createdAt, locale)}
            </span>
          </div>

          {beat.description && (
            <p className="text-sm leading-relaxed text-muted">{beat.description}</p>
          )}

          <dl className="border-t border-border">
            {specs.map(([label, value]) => (
              <div
                key={label}
                className="mono flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-[11px]"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          {!service && (
            <button
              type="button"
              onClick={() => beat.previewUrl && toggle(beat.id, beat.previewUrl)}
              disabled={!beat.previewUrl}
              className="mono w-fit border border-border px-4 py-3 text-xs transition-colors hover:border-foreground disabled:opacity-40"
            >
              {playing ? t.cardPlaying : t.cardPlay}
            </button>
          )}

          {service ? (
            <button
              type="button"
              disabled={has(beat.id, "service")}
              onClick={() => addLicense("service")}
              className="mono mt-auto bg-foreground px-4 py-3 text-xs text-background transition-opacity hover:opacity-80 disabled:opacity-40"
            >
              {has(beat.id, "service")
                ? t.inCart
                : `${t.addToCart} · ${
                    beat.priceCents === null ? t.licenseInquire : formatPrice(beat.priceCents)
                  }`}
            </button>
          ) : (
            <div className="mt-auto">
              <p className="mono mb-3 text-[11px] text-muted">{t.licenseTitle}</p>
              {/* One button per licence rather than a single price: the licence
                  is what is actually bought, and its price follows from it. */}
              <div className="grid gap-2 sm:grid-cols-3">
                {LICENSES.map((license) => {
                  const price = licensePriceCents(beat, license);
                  const inCart = has(beat.id, license);
                  return (
                    <button
                      key={license}
                      type="button"
                      disabled={inCart}
                      onClick={() => addLicense(license)}
                      title={licenseNotes[license]}
                      className="mono flex flex-col items-start gap-1 border border-border px-4 py-3 text-left text-xs transition-colors hover:border-foreground disabled:opacity-40"
                    >
                      <span>{licenseLabels[license]}</span>
                      <span className="text-muted">
                        {inCart
                          ? t.inCart
                          : price === null
                            ? t.licenseInquire
                            : formatPrice(price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
