// Every beat gets its own waveform, derived from its slug rather than from the
// audio: decoding the file would cost a request per card and the shape only has
// to be recognisable and stable, not accurate. Same slug, same silhouette.
export function waveformFor(seed: string, bars: number): number[] {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state ^= seed.charCodeAt(i);
    state = Math.imul(state, 16777619);
  }

  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    const unit = ((state >>> 0) % 1000) / 1000;
    // A beat's energy rises and falls; shaping the noise with a slow swell
    // reads as music instead of static.
    const swell = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI * 3);
    out.push(Number(Math.max(0.15, Math.min(1, unit * swell + 0.2)).toFixed(3)));
  }
  return out;
}
