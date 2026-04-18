"use client";

import { motion } from "framer-motion";
import type { MoodEntryLite } from "@/lib/useCoupleState";

const EMOJIS = ["😞", "😔", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥰"];
const LABELS = [
  "rough", "low", "meh", "okay", "fine", "good", "happy", "great", "amazing", "glowing",
];

export function PartnerCard({
  name,
  image,
  online,
  today,
  distanceKm,
  city,
}: {
  name: string;
  image?: string;
  online: boolean;
  today: MoodEntryLite | null;
  distanceKm?: number;
  city?: string;
}) {
  const idx = today ? Math.max(0, Math.min(9, today.score - 1)) : -1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        {image ? (
          <img
            src={image}
            alt=""
            className="w-10 h-10 rounded-full border border-white/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500" />
        )}
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-[color:var(--fg-mute)] flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-white/20"}`}
            />
            {online ? "online" : "offline"}
            {city && ` · ${city}`}
            {distanceKm != null && (
              <span className="ml-1">
                · {Math.round(distanceKm)} km away
              </span>
            )}
          </div>
        </div>
      </div>
      {today ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between"
        >
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
              mood today
            </div>
            <div className="text-4xl font-semibold mt-1 flex items-baseline gap-3">
              <span>{today.score}</span>
              <span className="text-sm text-[color:var(--fg-dim)] capitalize">
                {LABELS[idx]}
              </span>
            </div>
            {today.note && (
              <p className="mt-2 text-sm text-[color:var(--fg-dim)] italic max-w-xs">
                &ldquo;{today.note}&rdquo;
              </p>
            )}
          </div>
          <div className="text-6xl">{EMOJIS[idx]}</div>
        </motion.div>
      ) : (
        <div className="text-sm text-[color:var(--fg-mute)] italic">
          {name.split(" ")[0]} hasn&rsquo;t logged today yet
        </div>
      )}
    </motion.div>
  );
}
