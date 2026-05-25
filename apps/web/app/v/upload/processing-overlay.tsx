"use client"

import type { CardProcessingState, CardProcessingStatus } from "./types"

interface ProcessingOverlayProps {
  state: CardProcessingState
  onRetry?: () => void
}

const STATUS_LABELS: Record<CardProcessingStatus, string> = {
  idle: "",
  uploading: "Uploading photos…",
  queued: "In queue…",
  processing: "Identifying…",
  extracted: "Finalizing…",
  committing: "Saving…",
  done: "Complete",
  failed: "Failed",
}

export function ProcessingOverlay({ state, onRetry }: ProcessingOverlayProps) {
  if (state.status === "idle") return null

  const isDone = state.status === "done"
  const isFailed = state.status === "failed"
  const label = STATUS_LABELS[state.status]

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDone
            ? "bg-semantic-green/10"
            : isFailed
            ? "bg-semantic-red/10"
            : "bg-void/80"
        }`}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-4">
        {isDone ? (
          <CheckCircle />
        ) : isFailed ? (
          <FailCircle />
        ) : (
          <ProgressRing progress={state.progress} />
        )}

        <span
          className={`text-[10px] font-medium uppercase tracking-wider ${
            isDone
              ? "text-semantic-green"
              : isFailed
              ? "text-semantic-red"
              : "text-fg1"
          }`}
        >
          {label}
        </span>

        {isFailed && state.error && (
          <span className="text-[9px] text-fg3 text-center max-w-[140px] leading-tight">
            {state.error}
          </span>
        )}

        {isFailed && onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 rounded-full border border-frost-border bg-void px-3 py-1 text-[9px] uppercase tracking-wide text-fg1 hover:border-brand-volt/50 transition-colors"
          >
            Retry
          </button>
        )}
      </div>

      {/* Bottom progress bar */}
      {!isDone && !isFailed && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-frost-border/30">
          <div
            className="h-full bg-brand-volt transition-all duration-700 ease-out"
            style={{ width: `${Math.round(state.progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ProgressRing({ progress }: { progress: number }) {
  const size = 48
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--frost-border)"
        strokeWidth={stroke}
        opacity={0.3}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--brand-volt)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
      />
      {/* Center percent text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-[90deg] origin-center fill-fg1"
        fontSize="10"
        fontFamily="var(--font-mono, monospace)"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  )
}

function CheckCircle() {
  return (
    <div className="w-12 h-12 rounded-full border-2 border-semantic-green/60 bg-semantic-green/10 flex items-center justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--semantic-green)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  )
}

function FailCircle() {
  return (
    <div className="w-12 h-12 rounded-full border-2 border-semantic-red/60 bg-semantic-red/10 flex items-center justify-center">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--semantic-red)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  )
}
