"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Coffee, UtensilsCrossed, Trees, Film, Wine, IceCream } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Place = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance?: number;
};

const CAT_ICON: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  bar: Wine,
  park: Trees,
  cinema: Film,
  ice_cream: IceCream,
};

export function NearbyPlaces({
  lat,
  lng,
}: {
  lat?: number;
  lng?: number;
}) {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (lat == null || lng == null) {
      setPlaces(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setErr(null);
    fetch(`/api/nearby?lat=${lat}&lng=${lng}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancel) return;
        if (d.places) setPlaces(d.places);
        else setErr("couldn't load places");
      })
      .catch(() => {
        if (!cancel) setErr("network error");
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [lat, lng]);

  if (lat == null || lng == null) {
    return (
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} className="text-cyan-200" />
          <h3 className="font-semibold">nearby spots</h3>
        </div>
        <p className="text-sm text-[color:var(--fg-mute)]">
          share your location when logging mood to see cafes, restaurants, and
          parks around you
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={16} className="text-cyan-200" />
        <h3 className="font-semibold">nearby spots</h3>
      </div>
      {loading && (
        <p className="text-sm text-[color:var(--fg-mute)]">finding places…</p>
      )}
      {err && <p className="text-sm text-pink-300">{err}</p>}
      {places && places.length > 0 && (
        <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-2">
          {places.map((p) => {
            const Icon = CAT_ICON[p.category] ?? MapPin;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between gap-3 py-1.5"
              >
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}(${encodeURIComponent(p.name)})`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 flex-1 min-w-0 hover:text-pink-200 transition"
                >
                  <span className="w-8 h-8 rounded-full grid place-items-center bg-white/5 shrink-0">
                    <Icon size={14} />
                  </span>
                  <span className="truncate text-sm">{p.name}</span>
                </a>
                <span className="text-[11px] text-[color:var(--fg-mute)] shrink-0">
                  {p.distance ? `${p.distance.toFixed(1)} km` : ""}
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
      {places && places.length === 0 && (
        <p className="text-sm text-[color:var(--fg-mute)]">
          nothing nearby. try exploring a bit further.
        </p>
      )}
    </motion.div>
  );
}
