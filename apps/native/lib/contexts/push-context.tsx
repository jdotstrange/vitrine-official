/**
 * PushProvider — orchestrates the push notification lifecycle:
 * permission status, pre-prompt state, token registration, and
 * token refresh.
 *
 * Wraps the app inside StreamProvider so it can access chatClient
 * for device registration. Auto-registers on mount when permission
 * is already granted (returning users). Listens for token refresh
 * events and re-registers.
 *
 * expo-notifications is never imported directly here — all access
 * goes through lib/push.ts which lazy-loads it to avoid the
 * @ide/backoff → assert Metro crash.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/lib/contexts/auth-context';
import { useStream } from '@/lib/contexts/stream-context';
import { useFeeds } from '@/lib/contexts/feeds-context';
import {
  getPushPermissionStatus,
  requestPushPermission,
  getAndRegisterPushToken,
  setBadgeCount,
  addPushTokenRefreshListener,
  type PermissionStatus,
} from '@/lib/push';
import { logger } from '@/lib/logger';

const log = logger.create('PushProvider');

// ---------------------------------------------------------------------------
// Pre-prompt persistence
// ---------------------------------------------------------------------------

const PUSH_PROMPT_KEY = 'push_prompt_status';
const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type PromptStatus = 'not_shown' | 'deferred' | 'granted' | 'declined';

async function loadPromptStatus(): Promise<PromptStatus> {
  try {
    const raw = await AsyncStorage.getItem(PUSH_PROMPT_KEY);
    if (!raw) return 'not_shown';

    if (raw === 'granted' || raw === 'declined') return raw;

    if (raw.startsWith('deferred:')) {
      const ts = parseInt(raw.split(':')[1], 10);
      if (Date.now() - ts > COOLDOWN_MS) return 'not_shown';
      return 'deferred';
    }

    return 'not_shown';
  } catch {
    return 'not_shown';
  }
}

async function savePromptStatus(status: 'deferred' | 'granted' | 'declined'): Promise<void> {
  const value = status === 'deferred' ? `deferred:${Date.now()}` : status;
  await AsyncStorage.setItem(PUSH_PROMPT_KEY, value);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface PushContextType {
  permissionStatus: PermissionStatus | null;
  promptStatus: PromptStatus;
  requestPermission: () => Promise<boolean>;
  deferPrompt: () => Promise<void>;
  shouldShowPrePrompt: boolean;
}

const PushContext = createContext<PushContextType>({
  permissionStatus: null,
  promptStatus: 'not_shown',
  requestPermission: async () => false,
  deferPrompt: async () => {},
  shouldShowPrePrompt: false,
});

// Module-level flag — survives hot reload remounts in dev.
// The cooldown in push.ts is the real guard; this prevents even
// entering the async flow on every re-render.
let _hasAttemptedAutoRegister = false;

export function PushProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { client: chatClient, isReady: streamReady } = useStream();
  const { unseenCount } = useFeeds();

  const [permissionStatus, setPermissionStatus] =
    useState<PermissionStatus | null>(null);
  const [promptStatus, setPromptStatus] = useState<PromptStatus>('not_shown');

  // Load initial state
  useEffect(() => {
    (async () => {
      const [perm, prompt] = await Promise.all([
        getPushPermissionStatus(),
        loadPromptStatus(),
      ]);
      setPermissionStatus(perm);
      setPromptStatus(prompt);
    })();
  }, []);

  // Auto-register when permission is already granted and Stream is ready
  useEffect(() => {
    if (
      !isAuthenticated ||
      !user?.id ||
      !streamReady ||
      _hasAttemptedAutoRegister ||
      permissionStatus !== 'granted'
    ) {
      return;
    }

    _hasAttemptedAutoRegister = true;
    getAndRegisterPushToken(chatClient, user.id).then((token) => {
      if (token) log.info('Auto-registered push token on mount');
    });
  }, [isAuthenticated, user?.id, streamReady, permissionStatus, chatClient]);

  // Listen for token refresh events — re-register when iOS rotates the token
  useEffect(() => {
    if (!isAuthenticated || !user?.id || !streamReady) return;

    const sub = addPushTokenRefreshListener(({ data }) => {
      log.info('Push token refreshed, re-registering...');
      getAndRegisterPushToken(chatClient, user.id).catch((err) =>
        log.error('Token refresh re-registration failed:', err),
      );
    });

    return () => sub.remove();
  }, [isAuthenticated, user?.id, streamReady, chatClient]);

  // Badge sync on app foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && isAuthenticated) {
        const chatUnread = (chatClient as any)?.user?.total_unread_count ?? 0;
        const total = chatUnread + unseenCount;
        setBadgeCount(total);
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, chatClient, unseenCount]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const status = await requestPushPermission();
    setPermissionStatus(status);

    if (status === 'granted') {
      await savePromptStatus('granted');
      setPromptStatus('granted');

      if (user?.id && streamReady) {
        const token = await getAndRegisterPushToken(chatClient, user.id);
        if (token) {
          _hasAttemptedAutoRegister = true;
          log.info('Push token registered after permission grant');
        }
      }
      return true;
    }

    await savePromptStatus('declined');
    setPromptStatus('declined');
    return false;
  }, [user?.id, streamReady, chatClient]);

  const deferPrompt = useCallback(async () => {
    await savePromptStatus('deferred');
    setPromptStatus('deferred');
  }, []);

  const shouldShowPrePrompt =
    promptStatus === 'not_shown' &&
    permissionStatus !== 'granted' &&
    permissionStatus !== null;

  return (
    <PushContext.Provider
      value={{
        permissionStatus,
        promptStatus,
        requestPermission,
        deferPrompt,
        shouldShowPrePrompt,
      }}
    >
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  return useContext(PushContext);
}
