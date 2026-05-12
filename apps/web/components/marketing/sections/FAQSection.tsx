"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { MIcon } from "@/components/marketing/primitives"
import { FAQS } from "@/lib/marketing/constants"
import { SectionHeader } from "./SectionHeader"

export function FAQSection() {
  return (
    <section
      id="faq"
      data-marketing-section="faq"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <SectionHeader
          num="12"
          kicker="FAQ"
          title={
            <>
              The{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                fine print.
              </em>
            </>
          }
        />
        <div
          style={{ marginTop: 60, borderTop: `1px solid ${T.frostDiv}` }}
        >
          {FAQS.map((f, i) => (
            <FAQItem key={i} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        padding: "24px 0",
        borderBottom: `1px solid ${T.frostDiv}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 22,
            letterSpacing: -0.2,
            color: T.fg1,
          }}
        >
          {q}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid ${T.frostDiv}`,
            color: open ? T.volt : T.fg2,
            transform: open ? "rotate(45deg)" : "rotate(0)",
            transition: "transform 280ms, color 200ms",
            flexShrink: 0,
          }}
        >
          <MIcon name="plus" size={14} />
        </div>
      </div>
      {open && (
        <div
          style={{
            marginTop: 14,
            fontSize: 14.5,
            lineHeight: 1.6,
            color: T.fg2,
            maxWidth: 720,
            animation: "feedFadeIn 280ms ease-out",
          }}
        >
          {a}
        </div>
      )}
    </div>
  )
}
