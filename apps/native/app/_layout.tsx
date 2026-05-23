import { Stack, router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { LibreCaslonDisplay_400Regular } from '@expo-google-fonts/libre-caslon-display';
import {
  LibreCaslonText_400Regular,
  LibreCaslonText_400Regular_Italic,
} from '@expo-google-fonts/libre-caslon-text';
import {
  BodoniModa_400Regular,
  BodoniModa_500Medium,
} from '@expo-google-fonts/bodoni-moda';
import { Electrolize_400Regular } from '@expo-google-fonts/electrolize';
import { CategoryProvider } from '@/lib/contexts/category-context';
import { AuthProvider } from '@/lib/contexts/auth-context';
import { StreamProvider } from '@/lib/contexts/stream-context';
import { FeedsProvider } from '@/lib/contexts/feeds-context';
import { PushProvider } from '@/lib/contexts/push-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { SkeletonProvider } from '@/components/skeleton';
import { ThemeProvider } from '@/lib/design';
import { colors } from '@/lib/colors';
import { initSentry, Sentry } from '@/lib/sentry';
import {
  setupNotificationHandler,
  setupAndroidChannels,
  addNotificationResponseListener,
} from '@/lib/push';
import { logger } from '@/lib/logger';

const pushLog = logger.create('PushHandler');

SplashScreen.preventAutoHideAsync();
initSentry();

/**
 * Handles notification setup and tap routing.
 * Mounted inside the navigation tree so router is available.
 * expo-notifications is loaded lazily via lib/push.ts helpers
 * to avoid the @ide/backoff → assert Metro crash.
 */
function NotificationTapHandler() {
  const lastNotificationRef = useRef<string | null>(null);

  // Set up foreground handler + Android channels on first mount
  useEffect(() => {
    setupNotificationHandler();
    setupAndroidChannels();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data ?? {};
      const notifId = response.notification.request.identifier;

      if (notifId === lastNotificationRef.current) return;
      lastNotificationRef.current = notifId;

      pushLog.info('Notification tapped:', data.type || data.verb || 'unknown');

      try {
        // Stream Chat push — navigate to messages then the channel
        if (data.stream_channel_cid || data.type === 'message.new') {
          const cid = data.stream_channel_cid || data.channel_id || '';
          if (cid) {
            router.navigate('/(tabs)/messages');
            setTimeout(() => {
              router.push(`/messages/${encodeURIComponent(cid)}`);
            }, 300);
          } else {
            router.navigate('/(tabs)/messages');
          }
          return;
        }

        // Stream Feeds activity push — route based on verb
        const verb = data.verb as string | undefined;
        const collectibleId = data.collectibleId as string | undefined;
        const showcaseId = data.showcaseId as string | undefined;
        const actorId = data.actorId as string | undefined;

        if (verb === 'new_follower' && actorId) {
          router.push(`/profile/${actorId}`);
          return;
        }

        if (collectibleId && (
          verb === 'someone_tracked_your_item' ||
          verb === 'status_change' ||
          verb === 'value_change' ||
          verb === 'comp_alert' ||
          verb === 'new_item_from_followed'
        )) {
          router.push(`/collectible/${collectibleId}`);
          return;
        }

        if (showcaseId && (
          verb === 'new_showcase_from_followed' ||
          verb === 'share_initiated'
        )) {
          router.push(`/showcase/${showcaseId}`);
          return;
        }

        if (verb === 'share_initiated' && collectibleId) {
          router.push(`/collectible/${collectibleId}`);
          return;
        }

        if (verb === 'weekly_view_digest') {
          router.navigate('/(tabs)');
          return;
        }

        // Fallback: navigate to the activity lens on the profile hub
        router.navigate('/(tabs)');
      } catch (err) {
        pushLog.error('Deep-link routing failed:', err);
        router.navigate('/(tabs)');
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}

function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk: SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    InstrumentSerif: InstrumentSerif_400Regular,
    JetBrainsMono: JetBrainsMono_400Regular,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    LibreCaslonDisplay: LibreCaslonDisplay_400Regular,
    LibreCaslonText: LibreCaslonText_400Regular,
    'LibreCaslonText-Italic': LibreCaslonText_400Regular_Italic,
    BodoniModa: BodoniModa_400Regular,
    'BodoniModa-Medium': BodoniModa_500Medium,
    Electrolize: Electrolize_400Regular,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <ThemeProvider>
          <SafeAreaProvider>
            <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
              <AuthProvider>
                <StreamProvider>
                  <FeedsProvider>
                    <PushProvider>
                      <NotificationTapHandler />
                      <SkeletonProvider>
                        <CategoryProvider>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.background },
                            gestureEnabled: true,
                            animation: 'slide_from_right',
                          }}
                        />
                        </CategoryProvider>
                      </SkeletonProvider>
                    </PushProvider>
                  </FeedsProvider>
                </StreamProvider>
              </AuthProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
