"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type PlayerState = {
  playingId: number | null;
  toggle: (id: number, url: string) => void;
};

const PreviewPlayerContext = createContext<PlayerState | null>(null);

export function PreviewPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audio.addEventListener("ended", () => setPlayingId(null));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggle = useCallback(
    (id: number, url: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (playingId === id) {
        audio.pause();
        setPlayingId(null);
        return;
      }

      // One preview at a time: reusing a single element means starting a beat
      // stops whatever was playing without any bookkeeping per card.
      audio.pause();
      audio.src = url;
      void audio.play().then(
        () => setPlayingId(id),
        () => setPlayingId(null),
      );
    },
    [playingId],
  );

  const value = useMemo(() => ({ playingId, toggle }), [playingId, toggle]);

  return (
    <PreviewPlayerContext.Provider value={value}>
      {children}
    </PreviewPlayerContext.Provider>
  );
}

export function usePreviewPlayer() {
  const context = useContext(PreviewPlayerContext);
  if (!context) {
    throw new Error("usePreviewPlayer precisa estar dentro de PreviewPlayerProvider");
  }
  return context;
}
