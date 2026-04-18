"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { SignInButton } from "@/components/SignInButton";
import { Heart, MapPin, Sparkles, Radio } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Private just for two",
    body: "Share one code with your person. That's it. No feed, no followers.",
  },
  {
    icon: Sparkles,
    title: "AI that reads the room",
    body: "Drop your mood 1–10. Get conversation, a date idea, music, a little affirmation.",
  },
  {
    icon: MapPin,
    title: "Nearby or far apart",
    body: "Same city? See restaurants, cafes, parks near you. Apart? Virtual dates that feel close.",
  },
  {
    icon: Radio,
    title: "Live together",
    body: "Synced questions, surprise compliments, real-time vibes.",
  },
];

export default function Landing() {
  return (
    <main className="relative flex-1 flex flex-col">
      <nav className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Logo />
        <SignInButton>Sign in</SignInButton>
      </nav>

      <section className="px-6 md:px-10 pt-10 md:pt-20 pb-16 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--fg-mute)] mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-[color:var(--brand-a)] animate-pulse" />
          made for the two of you
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
        >
          Stay in sync
          <br />
          with your{" "}
          <span className="gradient-text">person.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-base md:text-lg text-[color:var(--fg-dim)] max-w-2xl mx-auto"
        >
          A tiny private space for two. Log how you feel today, and get playful
          nudges about what to talk about, where to go, and what to do — whether
          you're in the same room or different time zones.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <SignInButton>Start your space</SignInButton>
          <span className="text-xs text-[color:var(--fg-mute)]">
            free · no spam · just vibes
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35 }}
          className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="glass rounded-2xl p-5 text-left"
            >
              <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-pink-500/20 to-purple-500/20 mb-3">
                <f.icon size={18} className="text-pink-200" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-[color:var(--fg-dim)]">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <footer className="px-6 md:px-10 py-8 text-xs text-[color:var(--fg-mute)] text-center">
        made with love · data auto-clears after 30 days · only you two
      </footer>
    </main>
  );
}
