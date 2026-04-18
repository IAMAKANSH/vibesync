"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type MoodEntry = {
  date: string;
  score: number;
};

type History = {
  me: { today: MoodEntry | null; history: MoodEntry[] };
  partner: { today: MoodEntry | null; history: MoodEntry[] } | null;
};

export function HistoryChart({ ver }: { ver: number }) {
  const [data, setData] = useState<History | null>(null);

  useEffect(() => {
    fetch("/api/mood", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => { /* noop */ });
  }, [ver]);

  if (!data) return null;

  const last = 14;
  const myMap = new Map(data.me.history.map((m) => [m.date, m.score]));
  const pMap = new Map(data.partner?.history.map((m) => [m.date, m.score]) ?? []);

  const days: string[] = [];
  for (let i = last - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">last 14 days</h3>
        <div className="flex items-center gap-3 text-xs text-[color:var(--fg-mute)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-400" />you
          </span>
          {data.partner && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />them
            </span>
          )}
        </div>
      </div>
      <div className="flex items-end gap-1 h-32">
        {days.map((d) => {
          const mine = myMap.get(d);
          const theirs = pMap.get(d);
          return (
            <div
              key={d}
              className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end"
            >
              <div className="flex items-end gap-0.5 w-full h-full justify-center">
                {mine != null && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${mine * 10}%` }}
                    transition={{ duration: 0.5 }}
                    className="w-2 rounded-t-sm bg-pink-400"
                    title={`you: ${mine}`}
                  />
                )}
                {theirs != null && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${theirs * 10}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-2 rounded-t-sm bg-cyan-400"
                    title={`partner: ${theirs}`}
                  />
                )}
                {mine == null && theirs == null && (
                  <div className="w-2 h-1 rounded-full bg-white/5" />
                )}
              </div>
              <span className="text-[9px] text-[color:var(--fg-mute)]">
                {d.slice(8)}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
