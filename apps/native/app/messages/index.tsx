import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageInboxBody } from '@/components/profile-lenses';
import { useTheme } from '@/lib/design';

/**
 * /messages — standalone inbox screen.
 *
 * The full inbox UX (chip filter row, V3 search, Crown-Jewel-DNA channel
 * rows, brand-volt FAB) lives in `MessageInboxBody`; this route is now a
 * thin wrapper so the same body can also render as a profile-hub lens
 * without forking. Both consumers stay in lockstep with one source of truth.
 *
 * No top bar / back arrow:
 *   - Stack-pushed mounts of this screen rely on the iOS edge-back gesture
 *     (and Android system back). The user-facing entry point is the profile
 *     hub's MESSAGE lens; this route survives mainly for deep links and
 *     external navigation, neither of which need a custom back affordance.
 */
export default function MessagesPage() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <MessageInboxBody />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
