// A beat is sold under one of three licences; a service is sold under one price
// and uses the "service" line so an order can hold both in the same cart.

export const LICENSES = ["mp3", "wav", "exclusive"] as const;
export type License = (typeof LICENSES)[number];
export type LineLicense = License | "service";

// Site-wide defaults, used whenever a beat carries no override of its own.
// Mirrored by license_price_cents() in supabase/migrations/0008; changing a
// number here without changing it there makes the shown price and the charged
// price disagree.
export const DEFAULT_LICENSE_PRICE_CENTS: Record<License, number | null> = {
  mp3: 6_000,
  wav: 12_000,
  // Exclusive rights are quoted per beat, so there is nothing to fall back to.
  exclusive: null,
};

// What each licence actually grants. A null is "unlimited", never "none": the
// exclusive licence hands the beat over outright, so every cap disappears.
export type LicenseTerms = {
  formats: string;
  streams: number | null;
  performances: number | null;
  broadcasts: number | null;
  musicVideos: number | null;
  distributionCopies: number | null;
};

// The numbers a buyer is agreeing to. Edit them here and every surface that
// shows the terms follows — nothing else hardcodes a limit.
export const LICENSE_TERMS: Record<License, LicenseTerms> = {
  mp3: {
    formats: "MP3",
    streams: 50_000,
    performances: 1,
    broadcasts: 1,
    musicVideos: 1,
    distributionCopies: 1_000,
  },
  wav: {
    formats: "MP3, WAV",
    streams: 250_000,
    performances: 3,
    broadcasts: 2,
    musicVideos: 2,
    distributionCopies: 5_000,
  },
  exclusive: {
    formats: "MP3, WAV",
    streams: null,
    performances: null,
    broadcasts: null,
    musicVideos: null,
    distributionCopies: null,
  },
};

export type LicensePrices = {
  priceCents: number | null;
  priceWavCents: number | null;
  priceExclusiveCents: number | null;
};

// Null means "ask" rather than "free": every caller has to render it as a
// quote request, never as a zero.
export function licensePriceCents(
  beat: LicensePrices,
  license: LineLicense,
): number | null {
  switch (license) {
    case "mp3":
      return beat.priceCents ?? DEFAULT_LICENSE_PRICE_CENTS.mp3;
    case "wav":
      return beat.priceWavCents ?? DEFAULT_LICENSE_PRICE_CENTS.wav;
    case "exclusive":
      return beat.priceExclusiveCents;
    case "service":
      return beat.priceCents;
  }
}

export function isLicense(value: unknown): value is License {
  return LICENSES.includes(value as License);
}

export function isLineLicense(value: unknown): value is LineLicense {
  return value === "service" || isLicense(value);
}
