/**
 * Avatar — circular user avatar with initial fallback.
 *
 * Mirrors apps/native/components/vault/avatar.tsx.
 */

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const initial = (name ?? "U").charAt(0).toUpperCase()
  return (
    <div
      className={`rounded-full overflow-hidden bg-frost-border/20 flex items-center justify-center shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          className="text-fg2 font-grotesk font-semibold"
          style={{ fontSize: Math.max(10, Math.floor(size * 0.4)) }}
        >
          {initial}
        </span>
      )}
    </div>
  )
}
