"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { TopBar } from "@/components/TopBar";
import { Check, Sparkles, Heart, ArrowLeft } from "lucide-react";

const PRESETS = [
  {
    id: "nvidia",
    label: "NVIDIA NIM",
    url: "https://integrate.api.nvidia.com/v1",
    model: "meta/llama-3.3-70b-instruct",
    hint: "free tier at build.nvidia.com",
  },
  {
    id: "openai",
    label: "OpenAI",
    url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    hint: "platform.openai.com",
  },
  {
    id: "groq",
    label: "Groq",
    url: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    hint: "console.groq.com — fast & free",
  },
  {
    id: "together",
    label: "Together AI",
    url: "https://api.together.xyz/v1",
    model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    hint: "api.together.xyz",
  },
];

export default function SettingsClient({
  meName,
  partnerName,
  myCode,
  aiProviderUrl,
  aiModel,
  hasKey,
}: {
  meName: string;
  partnerName: string;
  myCode: string;
  aiProviderUrl: string;
  aiModel: string;
  hasKey: boolean;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(aiProviderUrl);
  const [model, setModel] = useState(aiModel);
  const [key, setKey] = useState("");
  const [keyPresent, setKeyPresent] = useState(hasKey);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [unpairing, setUnpairing] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = { aiProviderUrl: url, aiModel: model };
      if (key.trim()) body.aiProviderKey = key.trim();
      const r = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        setSaved(true);
        if (key.trim()) setKeyPresent(true);
        setKey("");
        setTimeout(() => setSaved(false), 2200);
      }
    } finally {
      setSaving(false);
    }
  }

  async function clearKey() {
    setSaving(true);
    try {
      await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProviderKey: "" }),
      });
      setKeyPresent(false);
    } finally {
      setSaving(false);
    }
  }

  async function unpair() {
    if (!confirm(`Unpair from ${partnerName}? This clears your couple data.`)) return;
    setUnpairing(true);
    await fetch("/api/pair/unpair", { method: "POST" });
    router.push("/pair");
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <TopBar partnerName={partnerName} />
      <div className="flex-1 px-5 md:px-10 py-8 max-w-3xl w-full mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--fg-mute)] hover:text-white mb-6"
        >
          <ArrowLeft size={14} /> back
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-semibold tracking-tight mb-2"
        >
          Settings
        </motion.h1>
        <p className="text-sm text-[color:var(--fg-dim)] mb-10">
          changes here are shared — {partnerName} gets the same setup automatically.
        </p>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-pink-200" />
            <h2 className="font-semibold">AI provider</h2>
          </div>
          <p className="text-sm text-[color:var(--fg-dim)] mb-5">
            any OpenAI-compatible endpoint. one key works for both of you.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {PRESETS.map((p) => {
              const active = url === p.url;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setUrl(p.url);
                    setModel(p.model);
                  }}
                  className={`text-left p-3 rounded-xl border transition ${
                    active
                      ? "bg-white/15 border-white/30"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-[10px] text-[color:var(--fg-mute)] mt-0.5">
                    {p.hint}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <label className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
            base url
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://integrate.api.nvidia.com/v1"
            className="mt-2"
          />

          <label className="mt-4 block text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
            model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="meta/llama-3.3-70b-instruct"
            className="mt-2"
          />

          <label className="mt-4 block text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
            api key {keyPresent && "· set"}
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={keyPresent ? "•••••••• (leave blank to keep)" : "paste your key"}
            className="mt-2"
          />

          <div className="mt-5 flex items-center gap-3">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              disabled={saving}
              onClick={save}
              className="brand-button rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span
                    key="ok"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Check size={14} /> saved for both
                  </motion.span>
                ) : (
                  <motion.span
                    key="save"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    save
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            {keyPresent && (
              <button
                onClick={clearKey}
                className="text-sm text-[color:var(--fg-mute)] hover:text-pink-300"
              >
                remove key
              </button>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 mb-6"
        >
          <h2 className="font-semibold mb-2">your pair code</h2>
          <p className="text-sm text-[color:var(--fg-dim)] mb-3">
            if you lose your partner, send them this to re-pair.
          </p>
          <div className="text-3xl font-mono tracking-[0.25em] gradient-text">
            {myCode}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart size={16} className="text-pink-200" />
            <h2 className="font-semibold">pairing</h2>
          </div>
          <p className="text-sm text-[color:var(--fg-dim)] mb-4">
            paired with {partnerName} · {meName}
          </p>
          <button
            onClick={unpair}
            disabled={unpairing}
            className="text-sm text-pink-300 hover:text-pink-200 disabled:opacity-50"
          >
            {unpairing ? "unpairing…" : "unpair"}
          </button>
        </motion.section>
      </div>
    </main>
  );
}
