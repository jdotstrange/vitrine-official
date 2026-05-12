import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { MIcon } from "./MIcon"

export type PillVariant =
  | "for_sale"
  | "for_trade"
  | "sell_trade"
  | "nfst"
  | "rookie"
  | "signed"
  | "game_used"
  | "graded"
  | "volt"
  | "pro"
  | "green"

const PILL_VARIANTS: Record<
  PillVariant,
  { bg: string; border: string; fg: string }
> = {
  for_sale: { bg: T.greenFill, border: T.greenBorder, fg: T.green },
  for_trade: { bg: T.blueFill, border: T.blueBorder, fg: T.blue },
  sell_trade: { bg: T.orangeFill, border: T.orangeBorder, fg: T.orange },
  nfst: { bg: T.silverFill, border: T.frostBorderStrong, fg: T.fg1 },
  rookie: { bg: T.pinkFill, border: T.pinkBorder, fg: T.pink },
  signed: { bg: T.violetFill, border: T.violetBorder, fg: T.violet },
  game_used: { bg: T.oliveFill, border: T.oliveBorder, fg: T.olive },
  graded: { bg: T.cyanFill, border: T.cyanBorder, fg: T.cyan },
  volt: { bg: T.voltFill, border: T.voltBorder, fg: T.volt },
  pro: { bg: T.proFill, border: T.proBorder, fg: T.pro },
  green: { bg: T.greenFill, border: T.greenBorder, fg: T.green },
}

export interface PillProps {
  variant?: PillVariant
  children: React.ReactNode
  icon?: string
  style?: React.CSSProperties
}

export function Pill({ variant = "nfst", children, icon, style }: PillProps) {
  const v = PILL_VARIANTS[variant] || PILL_VARIANTS.nfst
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 9999,
        border: `1px solid ${v.border}`,
        background: v.bg,
        color: v.fg,
        fontFamily: T.fontGrotesk,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: "uppercase",
        lineHeight: "13px",
        ...style,
      }}
    >
      {icon && <MIcon name={icon} size={11} />}
      {children}
    </span>
  )
}
