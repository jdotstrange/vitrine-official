/**
 * Realtime subscription hooks for messaging
 *
 * Wired to Supabase Realtime (Postgres Changes + Broadcast + Presence).
 * Supabase JS v2 uses WebSockets natively — fully React Native compatible.
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { Message, Conversation } from '@/lib/api/messaging';
import type { RealtimeChannel } from '@supabase/supabase-js';

const log = logger.create('Realtime');

// =============================================================================
// CONVERSATION MESSAGES SUBSCRIPTION
// =============================================================================

interface UseConversationMessagesOptions {
  conversationId: string;
  onNewMessage?: (message: Message) => void;
  onMessageEdited?: (message: { id: string; content: string; edited_at: string }) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
  enabled?: boolean;
}

/**
 * Subscribe to real-time messages in a conversation via Postgres Changes
 * and typing indicators via Broadcast.
 */
export function useConversationMessages({
  conversationId,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onTypingStart,
  onTypingStop,
  enabled = true,
}: UseConversationMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const callbacksRef = useRef({ onNewMessage, onMessageEdited, onMessageDeleted, onTypingStart, onTypingStop });

  callbacksRef.current = { onNewMessage, onMessageEdited, onMessageDeleted, onTypingStart, onTypingStop };

  useEffect(() => {
    if (!enabled || !conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          log.debug('New message received:', payload.new?.id);
          callbacksRef.current.onNewMessage?.(payload.new as unknown as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.deleted_at) {
            log.debug('Message deleted:', updated.id);
            callbacksRef.current.onMessageDeleted?.(updated.id as string);
          } else if (updated.edited_at) {
            log.debug('Message edited:', updated.id);
            callbacksRef.current.onMessageEdited?.({
              id: updated.id as string,
              content: updated.content as string,
              edited_at: updated.edited_at as string,
            });
          }
        }
      )
      .subscribe((status) => {
        log.debug(`Messages channel ${conversationId} status:`, status);
      });

    channelRef.current = channel;

    // Typing indicators via Broadcast
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const userId = payload.payload?.user_id as string | undefined;
        if (!userId) return;

        callbacksRef.current.onTypingStart?.(userId);

        const existing = typingTimeoutsRef.current.get(userId);
        if (existing) clearTimeout(existing);

        const timeout = setTimeout(() => {
          callbacksRef.current.onTypingStop?.(userId);
          typingTimeoutsRef.current.delete(userId);
        }, 3000);
        typingTimeoutsRef.current.set(userId, timeout);
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    return () => {
      channel.unsubscribe();
      typingChannel.unsubscribe();
      typingTimeoutsRef.current.forEach((t) => clearTimeout(t));
      typingTimeoutsRef.current.clear();
      channelRef.current = null;
      typingChannelRef.current = null;
    };
  }, [conversationId, enabled]);

  const sendTyping = useCallback(
    async (_isTyping: boolean, userId: string) => {
      if (!typingChannelRef.current || !conversationId) return;
      try {
        await typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: userId },
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        log.warn('Failed to send typing indicator:', message);
      }
    },
    [conversationId]
  );

  return { sendTyping };
}

// =============================================================================
// INBOX SUBSCRIPTION
// =============================================================================

interface UseInboxOptions {
  userId: string;
  onConversationUpdate?: (conversation: Partial<Conversation> & { id: string }) => void;
  onNewConversation?: (conversation: Conversation) => void;
  enabled?: boolean;
}

/**
 * Subscribe to real-time inbox updates via Postgres Changes on
 * conversation_members for the current user.
 */
export function useInbox({
  userId,
  onConversationUpdate,
  onNewConversation,
  enabled = true,
}: UseInboxOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef({ onConversationUpdate, onNewConversation });
  callbacksRef.current = { onConversationUpdate, onNewConversation };

  useEffect(() => {
    if (!enabled || !userId) return;

    const channel = supabase
      .channel(`inbox:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          log.debug('Inbox update for conversation member:', payload.new?.id);
          const updated = payload.new as Record<string, unknown>;
          callbacksRef.current.onConversationUpdate?.({
            id: updated.conversation_id as string,
            unread_count: updated.unread_count as number | undefined ?? 0,
            is_muted: updated.is_muted as boolean,
            is_pinned: updated.is_pinned as boolean,
          } as Partial<Conversation> & { id: string });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          log.debug('New conversation member row:', payload.new?.id);
          callbacksRef.current.onNewConversation?.({
            id: payload.new?.conversation_id,
          } as Conversation);
        }
      )
      .subscribe((status) => {
        log.debug(`Inbox channel ${userId} status:`, status);
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [userId, enabled]);
}

// =============================================================================
// PRESENCE (ONLINE STATUS)
// =============================================================================

interface UsePresenceOptions {
  conversationId?: string;
  userId: string;
  onPresenceChange?: (presences: Record<string, { online_at: string }>) => void;
  enabled?: boolean;
}

/**
 * Track online presence in a conversation via Supabase Presence.
 */
export function usePresence({
  conversationId,
  userId,
  onPresenceChange,
  enabled = true,
}: UsePresenceOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const callbacksRef = useRef({ onPresenceChange });
  callbacksRef.current = { onPresenceChange };

  useEffect(() => {
    if (!enabled || !userId || !conversationId) return;

    const channel = supabase
      .channel(`presence:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const presences: Record<string, { online_at: string }> = {};
        for (const [, entries] of Object.entries(state)) {
          for (const entry of entries as Array<Record<string, unknown>>) {
            const uid = entry.user_id as string;
            if (uid) {
              presences[uid] = { online_at: entry.online_at as string };
            }
          }
        }
        callbacksRef.current.onPresenceChange?.(presences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [conversationId, userId, enabled]);
}
