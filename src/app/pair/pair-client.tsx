"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Copy, Check, Heart } from "lucide-react";
import { signOut } from "next-auth/react";

export default function PairClient({
  myName,
  myCode,
  partnerName,
}: {
  myName: string;
  myCode: string;
  partnerName?: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copy() {
    await navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 4) {
      setError("that code looks short");
      return;
    }
    setJoining(true);
    try {
      const resp = await fetch("/api/pair/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg =
          data.error === "code-not-found"
            ? "no one with that code"
            : data.error === "cannot-pair-with-self"
              ? "that's your own code 😅"
              : data.error === "already-paired"
                ? "one of you is already paired"
                : "couldn't pair — try again";
        setError(msg);
        setJoining(false);
        return;
      }
      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("network hiccup, try again");
      setJoining(false);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col">
      <nav className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Logo />
        <button
          className="text-xs text-[color:var(--fg-mute)] hover:text-white transition"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          sign out
        </button>
      </nav>

      <div className="flex-1 grid place-items-center px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex mx-auto w-14 h-14 rounded-2xl items-center justify-center bg-gradient-to-br from-pink-500/30 to-purple-500/30 mb-5"
            >
              <Heart size={22} className="text-pink-200" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Hey {myName.split(" ")[0]} — pair with your person
            </h1>
            <p className="mt-3 text-[color:var(--fg-dim)]">
              Share your code, or drop theirs in. One of you does it, that's
              enough.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-3xl p-6 md:p-8 mb-4"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-[color:var(--fg-mute)]">
              your code
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div className="text-4xl md:text-5xl font-mono tracking-[0.3em] font-semibold gradient-text">
                {myCode}
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={copy}
                className="glass-strong rounded-full px-4 py-2.5 inline-flex items-center gap-2 text-sm"
              >
                <AnimatePresence mode="wait">
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Check size={14} /> copied
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Copy size={14} /> copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            <p className="mt-4 text-xs text-[color:var(--fg-mute)]">
              expires if unused for 30 days
            </p>
          </motion.div>

          <div className="relative flex items-center my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="px-3 text-xs text-[color:var(--fg-mute)]">
              or
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={join}
            className="glass rounded-3xl p-6 md:p-8"
          >
            <label className="text-xs uppercase tracking-[0.2em] text-[color:var(--fg-mute)]">
              their code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 8)
                )
              }
              placeholder="ABC123"
              className="mt-3 text-xl font-mono tracking-[0.3em] text-center"
              autoFocus
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-pink-300"
              >
                {error}
              </motion.p>
            )}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={joining || code.length < 4}
              className="brand-button mt-5 rounded-full px-6 py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "pairing…" : "pair up"}
            </motion.button>
          </motion.form>

          {partnerName && (
            <p className="mt-6 text-center text-sm text-[color:var(--fg-mute)]">
              last paired with {partnerName}
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
