"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, MessageSquare, Gift, RefreshCw } from "lucide-react";

type Live = {
  question?: string;
  questionAt?: number;
  reactionMe?: string;
  reactionPartner?: string;
  compliment?: string;
  complimentAt?: number;
  complimentFrom?: string;
};

const REACTIONS = ["😂", "🥲", "😳", "🔥", "❤️", "🫶", "😏", "🤭"];

export function LiveRoom({
  live,
  partnerName,
  partnerOnline,
  onRefresh,
}: {
  live: Live | null;
  partnerName: string;
  partnerOnline: boolean;
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function act(body: object, label: string) {
    setBusy(label);
    try {
      await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onRefresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-cyan-300" />
          <h3 className="font-semibold">live together</h3>
          <span
            className={`ml-2 text-xs ${partnerOnline ? "text-emerald-300" : "text-[color:var(--fg-mute)]"}`}
          >
            {partnerOnline ? `${partnerName} is here` : `${partnerName} offline`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => act({ action: "compliment" }, "compliment")}
            disabled={busy !== null}
            className="glass-strong rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:bg-white/15 transition"
          >
            <Gift size={12} /> send surprise
          </button>
          <button
            onClick={() => act({ action: "new-question" }, "new-question")}
            disabled={busy !== null}
            className="glass-strong rounded-full px-3 py-1.5 text-xs inline-flex items-center gap-1.5 hover:bg-white/15 transition"
          >
            <RefreshCw size={12} className={busy === "new-question" ? "animate-spin" : ""} />
            new question
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {live?.question ? (
          <motion.div
            key={live.question}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-5 mb-3"
          >
            <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)] mb-2 flex items-center gap-1.5">
              <MessageSquare size={12} />
              question for both of you
            </div>
            <p className="text-lg md:text-xl leading-snug">{live.question}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {REACTIONS.map((r) => (
                <motion.button
                  key={r}
                  whileTap={{ scale: 0.8, rotate: -10 }}
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    act({ action: "react", reaction: r }, `react-${r}`)
                  }
                  className="text-2xl"
                  aria-label={`react ${r}`}
                >
                  {r}
                </motion.button>
              ))}
            </div>
            {(live.reactionMe || live.reactionPartner) && (
              <div className="mt-3 text-xs text-[color:var(--fg-mute)] flex gap-4">
                {live.reactionMe && (
                  <span>you: <span className="text-lg">{live.reactionMe}</span></span>
                )}
                {live.reactionPartner && (
                  <span>
                    {partnerName.split(" ")[0]}:{" "}
                    <span className="text-lg">{live.reactionPartner}</span>
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-[color:var(--fg-mute)] mb-3"
          >
            tap <em>new question</em> to start a little thing together
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {live?.compliment && (
          <motion.div
            key={live.complimentAt}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-4 bg-gradient-to-br from-pink-500/15 to-purple-500/15"
          >
            <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)] mb-1.5 flex items-center gap-1.5">
              <Gift size={12} /> from {live.complimentFrom ?? "them"}
            </div>
            <p className="text-sm italic">{live.compliment}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
