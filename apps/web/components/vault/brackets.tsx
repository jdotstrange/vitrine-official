/**
 * Brackets — four corner-bracket marks for vault chrome.
 *
 * Mirrors apps/native/components/vault/brackets.tsx. Absolute overlays
 * inside a relatively-positioned parent with `overflow: hidden`.
 */

interface BracketsProps {
  size?: number
  color?: string
}

export function Brackets({ size = 8, color }: BracketsProps) {
  const stroke = color ?? "var(--frost-border-strong)"
  const common = { width: size, height: size, position: "absolute" as const }
  return (
    <>
      <span
        aria-hidden
        style={{
          ...common,
          top: 0,
          left: 0,
          borderTop: `1px solid ${stroke}`,
          borderLeft: `1px solid ${stroke}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...common,
          top: 0,
          right: 0,
          borderTop: `1px solid ${stroke}`,
          borderRight: `1px solid ${stroke}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...common,
          bottom: 0,
          left: 0,
          borderBottom: `1px solid ${stroke}`,
          borderLeft: `1px solid ${stroke}`,
        }}
      />
      <span
        aria-hidden
        style={{
          ...common,
          bottom: 0,
          right: 0,
          borderBottom: `1px solid ${stroke}`,
          borderRight: `1px solid ${stroke}`,
        }}
      />
    </>
  )
}
