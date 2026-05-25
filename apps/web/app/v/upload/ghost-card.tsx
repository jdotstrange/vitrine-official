"use client"

interface GhostCardProps {
  onAdd: () => void
  disabled?: boolean
}

export function GhostCard({ onAdd, disabled }: GhostCardProps) {
  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      className="rounded-xl border-2 border-dashed border-frost-border bg-sheet-bg/50 flex flex-col items-center justify-center gap-1.5 min-h-[200px] hover:border-brand-volt/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Add another item"
    >
      <div className="w-8 h-8 rounded-full border border-frost-border flex items-center justify-center">
        <PlusIcon className="w-4 h-4 text-fg3" />
      </div>
      <span className="text-[10px] text-fg3">Add item</span>
    </button>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
