import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { timeAgo, type PulseEvent } from "@/lib/marketing/hooks"

export interface PulseRowProps {
  event: PulseEvent
  dense?: boolean
}

const DOT_COLORS: Record<string, string> = {
  for_sale: T.green,
  for_trade: T.blue,
  sell_trade: T.orange,
}

export function PulseRow({ event, dense = false }: PulseRowProps) {
  const dotColor = DOT_COLORS[event.dot] || T.fg2
  const ageLabel =
    event.id > 1e10
      ? timeAgo(event.id)
      : `${Math.floor(event.ageMs / 1000)}s ago`
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: dense ? "10px 14px" : "14px 18px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          background: dotColor,
          boxShadow: `0 0 10px ${dotColor}`,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: dense ? 12 : 13,
            fontWeight: 500,
            color: T.fg1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {event.title}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: T.fg2,
            marginTop: 3,
            fontFamily: T.fontMono,
            letterSpacing: 0.3,
          }}
        >
          {event.sub} · {ageLabel}
        </div>
      </div>
      {event.val && (
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 12,
            color: event.val.startsWith("+")
              ? T.green
              : event.val.startsWith("\u2212") || event.val.startsWith("-")
                ? T.red
                : T.fg1,
          }}
        >
          {event.val}
        </div>
      )}
    </div>
  )
}
