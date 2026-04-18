"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { Settings, LogOut } from "lucide-react";

export function TopBar({
  partnerOnline,
  partnerName,
}: {
  partnerOnline?: boolean;
  partnerName?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 px-5 md:px-10 py-4 flex items-center justify-between glass"
    >
      <Link href="/dashboard" className="flex items-center gap-3">
        <Logo size={28} />
      </Link>
      <div className="flex items-center gap-3">
        {partnerName && (
          <div className="flex items-center gap-2 text-xs text-[color:var(--fg-dim)]">
            <span
              className={`w-2 h-2 rounded-full ${
                partnerOnline ? "bg-emerald-400" : "bg-white/20"
              }`}
            />
            {partnerName} {partnerOnline ? "online" : "offline"}
          </div>
        )}
        <Link
          href="/settings"
          className="p-2 rounded-full hover:bg-white/5 transition"
          aria-label="Settings"
        >
          <Settings size={18} />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="p-2 rounded-full hover:bg-white/5 transition"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </motion.header>
  );
}
