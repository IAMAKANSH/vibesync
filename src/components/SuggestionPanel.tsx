"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, Music2, Coffee, Heart, MessageCircle } from "lucide-react";

type Suggestions = {
  conversation: string[];
  activity: string;
  date_idea: string;
  music: { vibe: string; tracks: string[] };
  affirmation: string;
  long_distance?: string;
};

export function SuggestionPanel({ ver }: { ver: number }) {
  const [data, setData] = useState<Suggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  async function load(force = false) {
    setLoading(true);
    try {
      const r = await fetch(`/api/suggest${force ? "?force=1" : ""}`, {
        cache: "no-store",
      });
      const d = await r.json();
      if (r.ok && d.suggestions) {
        setData(d.suggestions);
        setFallback(d.fallback ? (d.reason ?? "using-offline") : null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(false); }, [ver]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-pink-200" />
          <h3 className="font-semibold">for you two, right now</h3>
          {fallback && (
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--fg-mute)] ml-1">
              · offline mode
            </span>
          )}
        </div>
        <motion.button
          whileTap={{ rotate: 180 }}
          onClick={() => load(true)}
          disabled={loading}
          aria-label="refresh"
          className="p-2 rounded-full hover:bg-white/5 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {data ? (
          <motion.div
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 md:grid-cols-2"
          >
            <Card icon={MessageCircle} title="talk about">
              <ul className="space-y-2 text-sm">
                {data.conversation.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-pink-300 shrink-0">·</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card icon={Heart} title="do together">
              <p className="text-sm mb-2">{data.activity}</p>
              <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)] mt-3">
                date idea
              </div>
              <p className="text-sm mt-1 text-[color:var(--fg-dim)]">
                {data.date_idea}
              </p>
            </Card>

            <Card icon={Music2} title={`music · ${data.music.vibe}`}>
              <ul className="text-sm space-y-1.5">
                {data.music.tracks.map((t, i) => (
                  <li key={i}>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-pink-200 transition"
                    >
                      ♫ {t}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <Card icon={Coffee} title="little love note">
              <p className="text-sm italic text-[color:var(--fg-dim)]">
                {data.affirmation}
              </p>
              {data.long_distance && (
                <>
                  <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)] mt-4">
                    for distance
                  </div>
                  <p className="text-sm mt-1">{data.long_distance}</p>
                </>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[color:var(--fg-mute)]"
          >
            log both of your moods to get fresh suggestions
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-purple-200" />
        <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
          {title}
        </div>
      </div>
      {children}
    </motion.div>
  );
}
