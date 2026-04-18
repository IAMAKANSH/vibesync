"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

const EMOJIS = ["😞", "😔", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥰"];
const LABELS = [
  "rough",
  "low",
  "meh",
  "okay",
  "fine",
  "good",
  "happy",
  "great",
  "amazing",
  "glowing",
];

export function MoodSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);
  const mv = useMotionValue(value);
  const scaleX = useTransform(mv, [1, 10], [0.1, 1]);

  useEffect(() => {
    setLocalValue(value);
    mv.set(value);
  }, [value, mv]);

  const idx = Math.max(0, Math.min(9, localValue - 1));

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--fg-mute)]">
            your mood today
          </div>
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-semibold mt-1 flex items-baseline gap-3"
          >
            <span>{localValue}</span>
            <span className="text-sm text-[color:var(--fg-dim)] capitalize">
              {LABELS[idx]}
            </span>
          </motion.div>
        </div>
        <motion.div
          key={`e-${idx}`}
          initial={{ scale: 0.6, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="text-6xl"
        >
          {EMOJIS[idx]}
        </motion.div>
      </div>
      <div className="relative h-12">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-white/8 overflow-hidden">
          <motion.div
            style={{ scaleX, transformOrigin: "left" }}
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400"
          />
        </div>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={localValue}
          disabled={disabled}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setLocalValue(v);
            mv.set(v);
            onChange(v);
          }}
          className="relative w-full h-12 appearance-none bg-transparent cursor-pointer z-10
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-purple-300
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-purple-300"
        />
        <div className="absolute inset-x-0 -bottom-1 flex justify-between text-[10px] text-[color:var(--fg-mute)] px-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
