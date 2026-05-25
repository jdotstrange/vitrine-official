"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  Channel,
  Window,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Message,
  useChannelStateContext,
  useMessageContext,
} from "stream-chat-react"
import type { Channel as StreamChannel, Attachment } from "stream-chat"
import { useStreamChat } from "@/lib/contexts/stream-context"
import { EmptyState } from "@/components/vault"

export default function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const decodedId = decodeURIComponent(id)
  const { client, isReady, error } = useStreamChat()
  const [channel, setChannel] = useState<StreamChannel | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!client || !isReady) return
    const ch = client.channel("messaging", decodedId)
    ch.watch()
      .then(() => setChannel(ch))
      .catch((err) => setLoadError(err.message ?? "Failed to load conversation"))
  }, [client, isReady, decodedId])

  if (error) {
    return (
      <div className="px-8 py-24">
        <EmptyState title="Stream not available" subtitle={error} />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="px-8 py-24">
        <EmptyState title="Couldn't load conversation" subtitle={loadError} />
      </div>
    )
  }

  if (!channel) {
    return <div className="px-8 py-12 text-fg2 text-sm">Loading...</div>
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-frost-border px-4 py-3 flex items-center gap-3">
        <Link
          href="/v/messages"
          className="text-fg2 hover:text-fg1 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
      </div>
      <div className="flex-1 min-h-0 vitrine-stream-shell">
        <Channel channel={channel} Attachment={VitrineAttachment}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </div>
    </div>
  )
}

/**
 * Custom Vitrine attachment renderer.
 *
 * Mirrors apps/native/components/messaging/vitrine-attachment.tsx — when
 * a Stream message has a custom attachment with type
 * `vitrine.collectible` or `vitrine.showcase`, render a clickable link
 * card instead of the default attachment UI.
 */
function VitrineAttachment(props: { attachments: Attachment[] }) {
  const { attachments } = props
  const vitrine = attachments?.filter((a) =>
    String(a.type ?? "").startsWith("vitrine."),
  )
  const others = attachments?.filter(
    (a) => !String(a.type ?? "").startsWith("vitrine."),
  )

  return (
    <>
      {vitrine?.map((att, i) => (
        <VitrineCard key={i} attachment={att} />
      ))}
      {/* Default attachment fallback — render images/files via standard <Attachment /> */}
      {others && others.length > 0 && (
        <div className="text-fg3 text-[11px] mt-1">
          [Attachment unavailable in web view]
        </div>
      )}
    </>
  )
}

function VitrineCard({ attachment }: { attachment: Attachment }) {
  const type = String(attachment.type ?? "")
  const isCollectible = type === "vitrine.collectible"
  const isShowcase = type === "vitrine.showcase"

  const id = (attachment as any).vitrine_id || (attachment as any).id_external
  const title = attachment.title || (attachment as any).vitrine_title || "Vitrine item"
  const image =
    (attachment as any).image_url ||
    (attachment as any).vitrine_image ||
    (attachment as any).thumb_url

  if (!isCollectible && !isShowcase) return null

  const href = isCollectible ? `/v/collectible/${id}` : `/v/showcase/${id}`

  return (
    <Link
      href={href}
      className="block rounded-lg border border-frost-border bg-sheet-bg overflow-hidden hover:border-frost-border-strong transition-colors my-1 max-w-sm"
    >
      <div className="flex">
        {image && (
          <div className="w-24 h-24 shrink-0">
            <img
              src={image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 p-3 min-w-0">
          <p className="text-fg3 text-[10px] uppercase font-grotesk font-bold tracking-wider">
            {isCollectible ? "Collectible" : "Showcase"}
          </p>
          <p className="text-fg1 font-semibold text-sm mt-0.5 line-clamp-2">
            {title}
          </p>
        </div>
      </div>
    </Link>
  )
}
