import { waveformFor } from "@/lib/beats/waveform";

export function Waveform({
  seed,
  bars = 48,
  className = "",
  active = false,
}: {
  seed: string;
  bars?: number;
  className?: string;
  active?: boolean;
}) {
  const heights = waveformFor(seed, bars);

  return (
    <div
      aria-hidden
      className={`flex h-full w-full items-center gap-[2px] ${className}`}
    >
      {heights.map((height, index) => (
        <span
          key={index}
          style={{ height: `${height * 100}%` }}
          className={`min-w-0 flex-1 rounded-[1px] transition-colors ${
            active ? "bg-foreground" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}
