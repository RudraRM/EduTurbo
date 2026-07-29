import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="lumen-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cf4" />
          <stop offset="0.55" stopColor="#a45cf0" />
          <stop offset="1" stopColor="#4d9df6" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#lumen-g)" />
      <path
        d="M32 13c1.1 0 2 .7 2.3 1.8l2.5 8.3a6 6 0 0 0 4 4l8.4 2.6a2.4 2.4 0 0 1 0 4.6l-8.3 2.5a6 6 0 0 0-4 4l-2.6 8.4a2.4 2.4 0 0 1-4.6 0l-2.5-8.3a6 6 0 0 0-4-4l-8.4-2.6a2.4 2.4 0 0 1 0-4.6l8.3-2.5a6 6 0 0 0 4-4l2.6-8.4A2.4 2.4 0 0 1 32 13z"
        fill="#fff"
      />
      <circle cx="46.5" cy="17.5" r="3.5" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-semibold tracking-tight">Lumen</span>
    </span>
  );
}
