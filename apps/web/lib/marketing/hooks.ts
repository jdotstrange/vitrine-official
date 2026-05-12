"use client"

import { useEffect, useRef, useState } from "react"

// ───────── useTicker ─────────

/** Re-render every `ms` milliseconds. Returns a tick counter. */
export function useTicker(ms = 1000): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setN((x) => x + 1), ms)
    return () => clearInterval(i)
  }, [ms])
  return n
}

// ───────── useDriftingPrice ─────────

/** Returns a price that wanders on a small bounded random walk. */
export function useDriftingPrice(
  start: number,
  volatility = 0.003,
  ms = 2200
): number {
  const [p, setP] = useState(start)
  useEffect(() => {
    const i = setInterval(() => {
      setP((x) =>
        Math.max(
          start * 0.85,
          x * (1 + (Math.random() - 0.5) * 2 * volatility)
        )
      )
    }, ms)
    return () => clearInterval(i)
  }, [start, volatility, ms])
  return p
}

// ───────── usePulseFeed ─────────

export interface PulseEvent {
  id: number
  dot: "for_sale" | "for_trade" | "sell_trade"
  title: string
  sub: string
  val: string | null
  ageMs: number
}

const PULSE_TEMPLATES: Omit<PulseEvent, "id" | "ageMs">[] = [
  {
    dot: "for_sale",
    title: "New Perfect comp · 2008 Topps Chrome Trout RC PSA 9",
    sub: "$1,420 · @vintagebbcards",
    val: "+12%",
  },
  {
    dot: "for_trade",
    title: "Watchlist hit · Speedmaster Pro 1969",
    sub: "Listed at $42,000 · WatchCollective",
    val: "\u22122%",
  },
  {
    dot: "sell_trade",
    title: "Offer received · Funko Pop! Stan Lee 01",
    sub: "From @kelseyf",
    val: null,
  },
  {
    dot: "for_sale",
    title: "Strong comp · 1986 Fleer Jordan #57 PSA 8",
    sub: "$58,200 · Robert Edward Auctions",
    val: "+4%",
  },
  {
    dot: "for_trade",
    title: "Crown Jewel updated · Coltrane Blue Train OG",
    sub: "VAR refreshed",
    val: null,
  },
  {
    dot: "for_sale",
    title: "New comp · 1933 Double Eagle Saint-Gaudens",
    sub: "$5.2M · Stack\u2019s Bowers",
    val: "+1.4%",
  },
  {
    dot: "sell_trade",
    title: "Match found · Air Jordan 1 \u201CChicago\u201D 1985",
    sub: "Size 10.5 · DS · $14,800",
    val: "+8.6%",
  },
  {
    dot: "for_sale",
    title: "Strong comp · Action Comics #1 CGC 6.0",
    sub: "$3.6M · Heritage",
    val: "+0.9%",
  },
  {
    dot: "for_trade",
    title: "Trade pinged · Charizard 1st Ed Holo PSA 10",
    sub: "From @grailcave",
    val: null,
  },
]

export { PULSE_TEMPLATES }

/** Streams new fake events into a fixed-length queue. */
export function usePulseFeed(intervalMs = 3200, max = 7): PulseEvent[] {
  const [feed, setFeed] = useState<PulseEvent[]>(() =>
    PULSE_TEMPLATES.slice(0, max).map((p, i) => ({
      ...p,
      id: i,
      ageMs: i * 12000,
    }))
  )
  useEffect(() => {
    const t = setInterval(() => {
      setFeed((cur) => {
        const next =
          PULSE_TEMPLATES[Math.floor(Math.random() * PULSE_TEMPLATES.length)]
        return [
          { ...next, id: Date.now() + Math.random(), ageMs: 0 },
          ...cur,
        ].slice(0, max)
      })
    }, intervalMs)
    return () => clearInterval(t)
  }, [intervalMs, max])
  // Re-render every second so timestamps tick.
  useTicker(1000)
  return feed.map((f) => ({
    ...f,
    ageMs: f.ageMs + (Date.now() - (f.id > 1e10 ? f.id : Date.now())),
  }))
}

/** "X seconds/minutes ago" formatter — uses the id as a fake epoch. */
export function timeAgo(epoch: number): string {
  const s = Math.max(1, Math.floor((Date.now() - epoch) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

// ───────── prefers-reduced-motion ─────────

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [])
  return reduced
}

// ───────── useInView ─────────

export interface UseInViewOptions {
  threshold?: number
  once?: boolean
}

export interface UseInViewState {
  inView: boolean
  ratio: number
}

/** Returns [ref, inView, ratio]. Snapshot on enter when `once`. */
export function useInView<T extends Element = HTMLDivElement>({
  threshold = 0.18,
  once = true,
}: UseInViewOptions = {}): [
  React.RefObject<T | null>,
  boolean,
  number,
] {
  const ref = useRef<T | null>(null)
  const [state, setState] = useState<UseInViewState>({ inView: false, ratio: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") {
      setState({ inView: true, ratio: 1 })
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState({ inView: true, ratio: entry.intersectionRatio })
          if (once) io.disconnect()
        } else if (!once) {
          setState({ inView: false, ratio: entry.intersectionRatio })
        }
      },
      { threshold: [threshold, 0.5, 1] }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, once])
  return [ref, state.inView, state.ratio]
}

// ───────── useScrollProgress ─────────

/** 0 when element top is at viewport bottom; 1 when bottom is at viewport top. */
export function useScrollProgress<T extends Element = HTMLElement>(
  ref: React.RefObject<T | null>
): number {
  const [p, setP] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const span = r.height + vh
      const traveled = vh - r.top
      const next = Math.max(0, Math.min(1, traveled / span))
      setP(next)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

// ───────── useScrollY ─────────

/** Raw scrollY position, throttled by rAF. */
export function useScrollY(): number {
  const [y, setY] = useState(0)
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        setY(window.scrollY)
        raf = 0
      })
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return y
}

// ───────── useActiveSection ─────────

/** Given a stable list of element IDs, returns the id of the currently active section. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState<string>(ids[0] ?? "")
  const idsKey = ids.join(",")
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const trigger = window.innerHeight * 0.35
      let cur = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top - trigger <= 0) cur = id
      }
      if (cur) setActive(cur)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])
  return active
}
