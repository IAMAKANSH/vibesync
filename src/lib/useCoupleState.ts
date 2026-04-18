"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type MoodEntryLite = {
  userId: string;
  date: string;
  score: number;
  note?: string;
  lat?: number;
  lng?: number;
  city?: string;
  updatedAt: number;
};

export type CoupleStatePayload = {
  ver: number;
  me: { id: string; name: string; code: string; today: MoodEntryLite | null };
  partner: {
    id: string;
    name: string;
    image?: string;
    today: MoodEntryLite | null;
    online: boolean;
    lastSeen: number | null;
  } | null;
  couple: { id: string; aiConfigured: boolean } | null;
  live: {
    question?: string;
    questionAt?: number;
    reactionMe?: string;
    reactionPartner?: string;
    compliment?: string;
    complimentAt?: number;
    complimentFrom?: string;
  } | null;
};

export function useCoupleState(initial?: CoupleStatePayload) {
  const [state, setState] = useState<CoupleStatePayload | null>(initial ?? null);
  const verRef = useRef<number>(initial?.ver ?? 0);
  const visibleRef = useRef<boolean>(true);
  const timerRef = useRef<number | null>(null);

  const fetchNow = useCallback(async () => {
    try {
      const v = verRef.current;
      const resp = await fetch(`/api/state?v=${v}`, { cache: "no-store" });
      if (resp.status === 204) return;
      if (!resp.ok) return;
      const data = (await resp.json()) as CoupleStatePayload;
      verRef.current = data.ver;
      setState(data);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchNow();
    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
      if (visibleRef.current) fetchNow();
    };
    document.addEventListener("visibilitychange", onVis);

    const tick = () => {
      if (visibleRef.current) fetchNow();
      timerRef.current = window.setTimeout(
        tick,
        visibleRef.current ? 4000 : 30000
      );
    };
    timerRef.current = window.setTimeout(tick, 4000);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [fetchNow]);

  return { state, refresh: fetchNow };
}
