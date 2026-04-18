"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export function SignInButton({
  children = "Continue with Google",
  callbackUrl = "/dashboard",
  className = "",
}: {
  children?: React.ReactNode;
  callbackUrl?: string;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => signIn("google", { callbackUrl })}
      className={`brand-button rounded-full px-6 py-3 inline-flex items-center gap-2 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#fff"
          d="M21.35 11.1h-9.17v2.98h5.28c-.24 1.4-1.72 4.12-5.28 4.12-3.18 0-5.78-2.63-5.78-5.87s2.6-5.87 5.78-5.87c1.8 0 3.02.77 3.72 1.43l2.54-2.45C16.97 3.9 14.86 3 12.18 3 6.98 3 2.82 7.16 2.82 12.33c0 5.17 4.16 9.33 9.36 9.33 5.41 0 8.98-3.8 8.98-9.14 0-.61-.06-1.08-.17-1.54z"
        />
      </svg>
      {children}
    </motion.button>
  );
}
