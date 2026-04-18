"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoodSlider } from "./MoodSlider";
import { MapPin, Check } from "lucide-react";
import type { MoodEntryLite } from "@/lib/useCoupleState";

const TAG_POOL = [
  "tired",
  "excited",
  "stressed",
  "calm",
  "nostalgic",
  "silly",
  "romantic",
  "focused",
];

export function MoodCard({
  today,
  onSaved,
}: {
  today: MoodEntryLite | null;
  onSaved: () => void;
}) {
  const [score, setScore] = useState<number>(today?.score ?? 7);
  const [note, setNote] = useState<string>(today?.note ?? "");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [geo, setGeo] = useState<{ lat: number; lng: number; city?: string } | null>(
    today?.lat && today?.lng
      ? { lat: today.lat, lng: today.lng, city: today.city }
      : null
  );
  const [geoStatus, setGeoStatus] = useState<"idle" | "asking" | "ok" | "denied">(
    today?.lat ? "ok" : "idle"
  );

  useEffect(() => {
    if (today) {
      setScore(today.score);
      setNote(today.note ?? "");
    }
  }, [today]);

  async function askLocation() {
    if (!("geolocation" in navigator)) return;
    setGeoStatus("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city: string | undefined;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
            { headers: { Accept: "application/json" } }
          );
          const d = await r.json();
          city =
            d?.address?.city ||
            d?.address?.town ||
            d?.address?.village ||
            d?.address?.state;
        } catch { /* noop */ }
        setGeo({ lat: latitude, lng: longitude, city });
        setGeoStatus("ok");
      },
      () => setGeoStatus("denied"),
      { timeout: 10000, maximumAge: 300000 }
    );
  }

  async function save() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { score, note: note.trim() || undefined, tags };
      if (geo) {
        body.lat = geo.lat;
        body.lng = geo.lng;
        if (geo.city) body.city = geo.city;
      }
      const r = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1800);
        onSaved();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <MoodSlider value={score} onChange={setScore} />
      <div className="mt-6">
        <label className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
          a few words (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="what's on your heart today?"
          rows={2}
          maxLength={400}
          className="mt-2 resize-none"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TAG_POOL.map((t) => {
          const on = tags.includes(t);
          return (
            <motion.button
              key={t}
              whileTap={{ scale: 0.94 }}
              onClick={() =>
                setTags((prev) =>
                  prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                )
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                on
                  ? "bg-white/15 border-white/30 text-white"
                  : "border-white/10 text-[color:var(--fg-dim)] hover:border-white/25"
              }`}
            >
              {t}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 justify-between">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={askLocation}
          className="glass-strong rounded-full text-xs px-3 py-2 inline-flex items-center gap-2"
        >
          <MapPin size={13} />
          {geoStatus === "asking"
            ? "locating…"
            : geoStatus === "ok"
              ? geo?.city
                ? `using ${geo.city}`
                : "location added"
              : geoStatus === "denied"
                ? "location denied"
                : "add location"}
        </motion.button>
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          disabled={saving}
          onClick={save}
          className="brand-button rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
        >
          <AnimatePresence mode="wait">
            {justSaved ? (
              <motion.span
                key="ok"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5"
              >
                <Check size={14} /> saved
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {today ? "update mood" : "log mood"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}
