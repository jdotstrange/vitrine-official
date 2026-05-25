"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

interface Showcase {
  id: string
  title: string
  items: number
}

interface ShowcasePickerProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

export function ShowcasePicker({
  selectedIds,
  onChange,
  disabled,
}: ShowcasePickerProps) {
  const { profile } = useUser()
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    async function load() {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("showcases")
        .select("id, title")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false })

      if (cancelled) return
      if (error) {
        console.error("[ShowcasePicker] Query failed:", error.message)
      }

      setShowcases(
        (data ?? []).map((s) => ({ id: s.id, title: s.title, items: 0 }))
      )
      setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return showcases
    return showcases.filter((s) => s.title.toLowerCase().includes(q))
  }, [showcases, query])

  function toggleSelection(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  function handleCreate() {
    const title = newTitle.trim()
    if (!title) return
    const tempId = `local-${Date.now()}`
    setShowcases((prev) => [{ id: tempId, title, items: 0 }, ...prev])
    onChange([...selectedIds, tempId])
    setNewTitle("")
    setCreateOpen(false)
  }

  const label =
    selectedIds.length === 0
      ? "Showcases"
      : selectedIds.length === 1
        ? showcases.find((s) => s.id === selectedIds[0])?.title ?? "1 selected"
        : `${selectedIds.length} showcases`

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between rounded-md border border-frost-border bg-void px-2.5 py-2 text-xs transition-colors hover:border-frost-border/80 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className={selectedIds.length > 0 ? "text-fg1" : "text-fg3/50"}>
          {label}
        </span>
        <span className="text-fg3">›</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setIsOpen(false)
              setQuery("")
            }}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-md max-h-[80vh] bg-void border border-frost-border rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-9 h-1 rounded-full bg-fg3/40" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-frost-border">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-fg1">
                Add to Showcases
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setQuery("")
                }}
                className="text-fg3 hover:text-fg1 transition-colors"
                aria-label="Close"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search showcases"
                autoFocus
                className="w-full rounded-lg border border-frost-border bg-sheet-bg px-3 py-2 text-xs text-fg1 placeholder:text-fg3/50 outline-none focus:border-brand-volt/40 transition-colors"
              />
            </div>

            {/* Create new */}
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-3 px-5 py-3 border-b border-frost-border hover:bg-frost-border/10 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg border border-frost-border flex items-center justify-center">
                <PlusIcon className="w-4 h-4 text-brand-volt" />
              </div>
              <span className="text-sm text-brand-volt font-medium">
                Create new showcase
              </span>
            </button>

            {/* List */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="px-5 py-8 text-center text-xs text-fg3">
                  Loading showcases...
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-fg1">
                    {query ? "No matches" : "No showcases yet"}
                  </p>
                  {!query && (
                    <p className="text-xs text-fg3 mt-1">
                      Create your first showcase to group items together.
                    </p>
                  )}
                </div>
              ) : (
                filtered.map((showcase) => {
                  const selected = selectedIds.includes(showcase.id)
                  return (
                    <button
                      key={showcase.id}
                      onClick={() => toggleSelection(showcase.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-frost-border/10 transition-colors border-b border-frost-border/50 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-fg1 truncate">
                          {showcase.title}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? "bg-fg1 border-fg1"
                            : "border-frost-border"
                        }`}
                      >
                        {selected && (
                          <CheckIcon className="w-3 h-3 text-void" />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-frost-border">
              <button
                onClick={() => {
                  setIsOpen(false)
                  setQuery("")
                }}
                className="w-full rounded-full bg-fg1 py-2.5 text-sm font-medium text-void transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>

          {/* Create dialog */}
          {createOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => {
                  setCreateOpen(false)
                  setNewTitle("")
                }}
              />
              <div className="relative w-full max-w-sm bg-void border border-frost-border rounded-xl p-5 mx-4 animate-in zoom-in-95 fade-in duration-150">
                <h4 className="text-xs uppercase tracking-wide text-fg1 font-medium mb-1">
                  New Showcase
                </h4>
                <p className="text-[10px] text-fg3 mb-4">
                  Give it a short, recognizable name.
                </p>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value.slice(0, 80))}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Rookie Cards"
                  autoFocus
                  className="w-full rounded-lg border border-frost-border bg-void px-3 py-2 text-sm text-fg1 placeholder:text-fg3/50 outline-none focus:border-brand-volt/40 transition-colors mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCreateOpen(false)
                      setNewTitle("")
                    }}
                    className="flex-1 rounded-lg border border-frost-border py-2 text-xs text-fg2 hover:text-fg1 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newTitle.trim()}
                    className="flex-1 rounded-lg bg-brand-volt py-2 text-xs font-medium text-void transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8l4 4 6-7" />
    </svg>
  )
}
