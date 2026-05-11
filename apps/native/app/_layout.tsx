import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { AuthProvider, useAuth } from '@/lib/contexts/auth-context';
import { StreamProvider } from '@/lib/contexts/stream-context';
import { FeedsProvider } from '@/lib/contexts/feeds-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { SkeletonProvider } from '@/components/skeleton';
import { ThemeProvider } from '@/lib/design';
import { colors } from '@/lib/colors';
import { initSentry } from '@/lib/sentry';
import { sweepStaleStagingRows } from '@/lib/api/collectibles';

SplashScreen.preventAutoHideAsync();
initSentry();

function StagingRowSweep() {
  const { user, isAuthenticated } = useAuth();
  const swept = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || swept.current) return;
    swept.current = true;
    sweepStaleStagingRows(user.id).catch(() => {});
  }, [isAuthenticated, user?.id]);

  return null;
}

export default function RootLayout() {
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
            <AuthProvider>
              <StagingRowSweep />
              <StreamProvider>
                <FeedsProvider>
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
                </FeedsProvider>
              </StreamProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
