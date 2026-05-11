import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { StreamChat } from 'stream-chat';
import { OverlayProvider, Chat } from 'stream-chat-expo';
import { useAuth } from '@/lib/contexts/auth-context';
import { getAccessToken } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { vitrineStreamTheme } from '@/lib/stream-theme';

const log = logger.create('Stream');

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const chatClient = StreamChat.getInstance(STREAM_API_KEY);

interface StreamContextType {
  client: StreamChat;
  isReady: boolean;
}

const StreamContext = createContext<StreamContextType>({ client: chatClient, isReady: false });

async function fetchStreamToken(supabaseJwt: string): Promise<{ token: string; userId: string }> {
  const url = `${SUPABASE_URL}/functions/v1/stream-token`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseJwt}`,
      'apikey': SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `stream-token returned ${res.status}`);
  }

  return res.json();
}

export function StreamProvider({ children }: { children: ReactNode }) {
  const { user, profileStatus, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const connectingRef = useRef(false);

  const shouldConnect = isAuthenticated && !!user?.id && !!profileStatus?.isComplete;

  useEffect(() => {
    if (!shouldConnect) {
      if (chatClient.userID) {
        log.info('Auth lost or profile incomplete, disconnecting Stream');
        chatClient.disconnectUser().then(() => {
          log.info('Stream disconnected');
        }).catch((err) => {
          log.warn('Stream disconnect error:', err);
        });
      }
      setIsReady(false);
      return;
    }

    if (connectingRef.current) return;

    if (chatClient.userID === user.id) {
      log.info('Stream singleton already connected for user:', user.id);
      setIsReady(true);
      return;
    }

    let cancelled = false;

    async function connect() {
      connectingRef.current = true;
      try {
        log.info('Connecting to Stream for user:', user!.id);

        if (chatClient.userID && chatClient.userID !== user!.id) {
          log.info('Disconnecting previous Stream user:', chatClient.userID);
          await chatClient.disconnectUser();
        }

        const jwt = await getAccessToken();
        if (!jwt || cancelled) return;

        const { token, userId } = await fetchStreamToken(jwt);
        if (cancelled) return;

        const tokenProvider = async () => {
          const freshJwt = await getAccessToken();
          if (!freshJwt) throw new Error('No Supabase session for token refresh');
          const result = await fetchStreamToken(freshJwt);
          return result.token;
        };

        if (chatClient.userID === userId) {
          log.info('Stream already connected (race), skipping connectUser');
        } else {
          await chatClient.connectUser(
            {
              id: userId,
              name: user!.displayName || user!.username || 'User',
              username: user!.username || undefined,
              image: user!.avatarUrl || undefined,
            },
            tokenProvider,
          );
        }

        if (cancelled) {
          await chatClient.disconnectUser();
          return;
        }

        setIsReady(true);
        log.info('Stream connected successfully for user:', userId);
      } catch (err) {
        log.error('Stream connection failed:', err);
      } finally {
        connectingRef.current = false;
      }
    }

    connect();

    return () => {
      cancelled = true;
    };
  }, [shouldConnect, user?.id]);

  useEffect(() => {
    return () => {
      if (chatClient.userID) {
        chatClient.disconnectUser().catch(() => {});
      }
    };
  }, []);

  return (
    <StreamContext.Provider value={{ client: chatClient, isReady }}>
      <OverlayProvider style={vitrineStreamTheme}>
        <Chat client={chatClient} style={vitrineStreamTheme}>
          {children}
        </Chat>
      </OverlayProvider>
    </StreamContext.Provider>
  );
}

export function useStream() {
  return useContext(StreamContext);
}
