"use client";

import TiltedCard from "@/components/TiltedCard/TiltedCard";
import { useEffect, useRef, useState } from "react";
import {
  formatPrice,
  formatDuration,
  formatPostedDate,
  formatCount,
} from "@/lib/beats/format";
import {
  licensePriceCents,
  LICENSES,
  LICENSE_TERMS,
  type License,
  type LineLicense,
} from "@/lib/beats/licenses";
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
  // Picking a licence only shows what it grants; nothing reaches the cart until
  // the buyer presses the button under those terms.
  const [selected, setSelected] = useState<License>("mp3");

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

  const licenseNames: Record<License, string> = {
    mp3: t.licenseMp3Name,
    wav: t.licenseWavName,
    exclusive: t.licenseExclusiveName,
  };

  const selectedPrice = licensePriceCents(beat, selected);
  const selectedTerms = LICENSE_TERMS[selected];
  const selectedInCart = has(beat.id, selected);

  // A null cap means unlimited, which only the exclusive licence has.
  const cap = (value: number | null) =>
    value === null ? t.termUnlimited : formatCount(value, locale);

  const termLines: string[] = [
    t.termFiles,
    t.termFormats(selectedTerms.formats),
    t.termStreams(cap(selectedTerms.streams)),
    t.termPerformances(cap(selectedTerms.performances)),
    t.termBroadcasts(cap(selectedTerms.broadcasts)),
    t.termMusicVideos(cap(selectedTerms.musicVideos)),
    t.termDistribution(cap(selectedTerms.distributionCopies)),
  ];

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

      <div className="grid items-start gap-0 md:grid-cols-2">
        {/* The terms made the right column tall enough to scroll, so the art
            sticks to the top of the viewport and stays centred in its half
            rather than scrolling away on the first flick of the wheel. */}
        <div className="flex justify-center bg-surface-raised p-6 md:sticky md:top-0 md:h-[min(90svh,44rem)] md:items-center md:p-8">
          {beat.coverUrl ? (
            // The same tilt the cards on the home page have: the art follows
            // the cursor, so it reads as the same object opened up.
            <div className="aspect-square w-full max-w-sm">
              <TiltedCard
                imageSrc={beat.coverUrl}
                altText={beat.title}
                containerHeight="100%"
                containerWidth="100%"
                imageHeight="100%"
                imageWidth="100%"
                rotateAmplitude={12}
                scaleOnHover={1.04}
                showMobileWarning={false}
                showTooltip={false}
                displayOverlayContent={false}
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full max-w-sm items-center gap-[3px]">
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
              {/* Choosing a licence is a selection, not a purchase: the terms
                  below change with it, and only the button underneath buys. */}
              <div className="grid gap-2 sm:grid-cols-3">
                {LICENSES.map((license) => {
                  const price = licensePriceCents(beat, license);
                  const active = license === selected;
                  return (
                    <button
                      key={license}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelected(license)}
                      className={`mono flex flex-col items-start gap-1 border px-4 py-3 text-left text-xs transition-colors ${
                        active
                          ? "border-foreground bg-surface-raised"
                          : "border-border text-muted hover:border-muted"
                      }`}
                    >
                      <span>{licenseNames[license]}</span>
                      <span className={active ? "text-sm" : "text-sm text-muted"}>
                        {price === null ? t.licenseMakeOffer : formatPrice(price)}
                      </span>
                      <span className="text-[10px] text-muted">
                        {LICENSE_TERMS[license].formats}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-border pt-5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="display text-base">{t.termsTitle}</h3>
                  <span className="mono text-[11px] text-muted">
                    {t.termsFor(
                      licenseNames[selected],
                      selectedPrice === null
                        ? t.licenseInquire
                        : formatPrice(selectedPrice),
                    )}
                  </span>
                </div>

                <ul className="mono mt-4 grid gap-y-2 text-[11px] text-muted sm:grid-cols-2 sm:gap-x-6">
                  {termLines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden className="text-foreground">
                        ·
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                {selected === "exclusive" && (
                  <p className="mt-4 text-xs leading-relaxed text-muted">
                    {t.termExclusiveNote}
                  </p>
                )}

                <button
                  type="button"
                  disabled={selectedInCart}
                  onClick={() => addLicense(selected)}
                  className="mono mt-5 w-full bg-foreground px-4 py-3 text-xs text-background transition-opacity hover:opacity-80 disabled:opacity-40"
                >
                  {selectedInCart
                    ? t.inCart
                    : `${t.addToCart} · ${
                        selectedPrice === null
                          ? t.licenseInquire
                          : formatPrice(selectedPrice)
                      }`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
