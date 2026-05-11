"use client"

import { cn } from "@/lib/utils"

interface PhoneFrameProps {
  src?: string
  alt?: string
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: { width: 220, height: 440, radius: "2rem" },
  md: { width: 280, height: 560, radius: "2.5rem" },
  lg: { width: 320, height: 640, radius: "2.75rem" },
}

export function PhoneFrame({
  src,
  alt = "App screenshot",
  label,
  size = "md",
  className,
}: PhoneFrameProps) {
  const s = sizes[size]

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        className="relative overflow-hidden border-[6px] flex-shrink-0"
        style={{
          width: s.width,
          height: s.height,
          borderRadius: s.radius,
          borderColor: "#2A2A2E",
          backgroundColor: "#0C0C10",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Notch / dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-[90px] h-[26px] rounded-full bg-black" />

        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center px-6 text-center">
            <div
              className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(211, 255, 195, 0.10)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(211, 255, 195, 0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <span className="text-[11px] font-medium" style={{ color: "rgba(239, 239, 231, 0.35)" }}>
              Screenshot placeholder
            </span>
          </div>
        )}

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
      </div>

      {label && (
        <span className="text-xs text-muted-foreground text-center max-w-[280px]">{label}</span>
      )}
    </div>
  )
}
