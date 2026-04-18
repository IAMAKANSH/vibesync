export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="vs-g" x1="0" y1="0" x2="48" y2="48">
            <stop offset="0%" stopColor="#ff5fa2" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path
          d="M24 43s-15-9.3-15-22.3C9 13.2 14.2 8 20.8 8c3.3 0 6 1.4 7.7 3.7C30.2 9.4 33 8 36 8c6.6 0 10.8 5.2 10.8 12.7 0 3.2-.9 6.1-2.3 8.7"
          stroke="url(#vs-g)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="36" r="5" fill="url(#vs-g)" />
      </svg>
      <span className="font-semibold tracking-tight text-[1.05rem]">
        VibeSync
      </span>
    </div>
  );
}
