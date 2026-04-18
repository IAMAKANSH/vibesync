"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useCoupleState } from "@/lib/useCoupleState";
import { TopBar } from "@/components/TopBar";
import { MoodCard } from "@/components/MoodCard";
import { PartnerCard } from "@/components/PartnerCard";
import { SuggestionPanel } from "@/components/SuggestionPanel";
import { NearbyPlaces } from "@/components/NearbyPlaces";
import { LiveRoom } from "@/components/LiveRoom";
import { HistoryChart } from "@/components/HistoryChart";

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 *
      Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat));
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function DashboardClient({
  meName,
  partnerName,
  partnerImage,
  aiConfigured,
}: {
  meName: string;
  partnerName: string;
  partnerImage?: string;
  aiConfigured: boolean;
}) {
  const { state, refresh } = useCoupleState();

  const myToday = state?.me.today ?? null;
  const partnerToday = state?.partner?.today ?? null;
  const partnerOnline = state?.partner?.online ?? false;

  const distanceKm =
    myToday?.lat && myToday?.lng && partnerToday?.lat && partnerToday?.lng
      ? haversineKm(
          { lat: myToday.lat, lng: myToday.lng },
          { lat: partnerToday.lat, lng: partnerToday.lng }
        )
      : undefined;

  return (
    <main className="min-h-dvh flex flex-col">
      <TopBar partnerName={partnerName} partnerOnline={partnerOnline} />

      <div className="flex-1 px-5 md:px-10 py-6 md:py-10 max-w-6xl w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight">
            Hey {meName.split(" ")[0]},{" "}
            <span className="gradient-text">
              how&rsquo;s your heart today?
            </span>
          </h1>
          <p className="mt-2 text-sm text-[color:var(--fg-dim)]">
            paired with {partnerName}
            {distanceKm != null && distanceKm > 40 && (
              <> · {Math.round(distanceKm)} km apart right now</>
            )}
            {!aiConfigured && (
              <>
                {" · "}
                <Link href="/settings" className="underline hover:text-white">
                  add your AI key
                </Link>{" "}
                for richer suggestions
              </>
            )}
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          <MoodCard today={myToday} onSaved={refresh} />
          <PartnerCard
            name={partnerName}
            image={partnerImage}
            online={partnerOnline}
            today={partnerToday}
            distanceKm={distanceKm && distanceKm > 40 ? distanceKm : undefined}
            city={partnerToday?.city}
          />
        </div>

        <div className="mt-5">
          <SuggestionPanel ver={state?.ver ?? 0} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <LiveRoom
            live={state?.live ?? null}
            partnerName={partnerName}
            partnerOnline={partnerOnline}
            onRefresh={refresh}
          />
          <NearbyPlaces lat={myToday?.lat} lng={myToday?.lng} />
        </div>

        <div className="mt-5">
          <HistoryChart ver={state?.ver ?? 0} />
        </div>

        <p className="text-center text-xs text-[color:var(--fg-mute)] mt-10">
          only you two see this · data auto-clears after 30 days
        </p>
      </div>
    </main>
  );
}
