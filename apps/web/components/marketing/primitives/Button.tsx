"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { MIcon } from "./MIcon"

export type ButtonVariant = "solid" | "volt" | "frost" | "ghost"

export interface ButtonProps {
  variant?: ButtonVariant
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void
  icon?: string
  fullWidth?: boolean
  href?: string
  target?: string
  rel?: string
  style?: React.CSSProperties
}

export function Button({
  variant = "solid",
  children,
  onClick,
  icon,
  fullWidth,
  href,
  target,
  rel,
  style,
}: ButtonProps) {
  const [hover, setHover] = useState(false)
  const [active, setActive] = useState(false)

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    solid: { background: T.fg1, color: T.void, border: "none" },
    volt: { background: T.volt, color: T.void, border: "none" },
    frost: {
      background: hover
        ? "rgba(214,235,253,0.06)"
        : "rgba(214,235,253,0.02)",
      color: T.fg1,
      border: `1px solid ${T.frostBorderStrong}`,
    },
    ghost: {
      background: "transparent",
      color: T.fg1,
      border: `1px solid ${T.frostDiv}`,
    },
  }

  const baseStyle: React.CSSProperties = {
    height: 48,
    padding: "0 22px",
    borderRadius: 9999,
    fontFamily: T.fontInter,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: fullWidth ? "100%" : undefined,
    opacity: active ? 0.82 : hover ? 0.94 : 1,
    transition: "opacity 120ms, background 120ms",
    ...variants[variant],
    ...style,
  }

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false)
      setActive(false)
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
  }

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        {...handlers}
        style={baseStyle}
      >
        {icon && <MIcon name={icon} size={16} />}
        {children}
      </a>
    )
  }

  return (
    <button onClick={onClick} {...handlers} style={baseStyle}>
      {icon && <MIcon name={icon} size={16} />}
      {children}
    </button>
  )
}
