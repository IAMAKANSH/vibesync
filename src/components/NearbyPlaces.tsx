"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Coffee,
  UtensilsCrossed,
  Trees,
  Film,
  Wine,
  IceCream,
  RefreshCw,
  LocateFixed,
} from "lucide-react";
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
  const [overrideCoords, setOverrideCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const effLat = overrideCoords?.lat ?? lat;
  const effLng = overrideCoords?.lng ?? lng;

  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const load = useCallback(
    async (la: number, ln: number, force = false) => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(
          `/api/nearby?lat=${la}&lng=${ln}${force ? `&t=${Date.now()}` : ""}`
        );
        const d = await r.json();
        if (r.ok && Array.isArray(d.places)) {
          setPlaces(d.places);
        } else if (d.error) {
          setErr(
            d.error.length > 80
              ? "couldn't reach map servers — try refresh"
              : d.error
          );
        } else {
          setErr("couldn't load places");
        }
      } catch {
        setErr("network error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (effLat == null || effLng == null) return;
    load(effLat, effLng);
  }, [effLat, effLng, load]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setErr("this browser can't share location");
      return;
    }
    setLocating(true);
    setErr(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOverrideCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setErr("location permission denied");
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }

  function refresh() {
    if (effLat != null && effLng != null) {
      load(effLat, effLng, true);
    }
  }

  const hasCoords = effLat != null && effLng != null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-cyan-200" />
          <h3 className="font-semibold">nearby spots</h3>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={useMyLocation}
            disabled={locating}
            className="glass-strong rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:bg-white/15 transition"
            title="use my current location"
          >
            <LocateFixed size={12} className={locating ? "animate-pulse" : ""} />
            {locating ? "locating…" : "my location"}
          </motion.button>
          {hasCoords && (
            <motion.button
              whileTap={{ rotate: 180 }}
              onClick={refresh}
              disabled={loading}
              aria-label="refresh"
              className="p-2 rounded-full hover:bg-white/5 disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={loading ? "animate-spin" : ""}
              />
            </motion.button>
          )}
        </div>
      </div>

      {!hasCoords && (
        <p className="text-sm text-[color:var(--fg-mute)]">
          tap <em>my location</em> or add your location when logging your mood
          to see cafes, restaurants, and parks around you.
        </p>
      )}

      {hasCoords && loading && !places && (
        <p className="text-sm text-[color:var(--fg-mute)]">
          finding places… this can take a few seconds the first time.
        </p>
      )}

      {err && (
        <p className="text-sm text-pink-300">
          {err}{" "}
          <button onClick={refresh} className="underline hover:text-pink-200">
            try again
          </button>
        </p>
      )}

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

      {hasCoords && places && places.length === 0 && !loading && !err && (
        <p className="text-sm text-[color:var(--fg-mute)]">
          nothing named within 2.5 km.{" "}
          <button onClick={refresh} className="underline hover:text-white">
            try again
          </button>
        </p>
      )}
    </motion.div>
  );
}
