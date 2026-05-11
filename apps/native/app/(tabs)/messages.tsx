import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MessageInboxBody } from '@/components/profile-lenses';
import { BottomDock } from '@/components/bottom-dock';
import { useTheme } from '@/lib/design';

/**
 * Messages tab — dedicated communications surface.
 *
 * The full inbox UX (chip filter row, V3 search, channel rows, brand-volt
 * FAB) lives in `MessageInboxBody`; this route is a thin wrapper that adds
 * the BottomDock. The same body also renders inside the standalone
 * /messages stack route for deep-link and external navigation.
 */
export default function MessagesTab() {
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.void }]}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <MessageInboxBody fabBottomOffset={80} />
      </SafeAreaView>
      <BottomDock activeTab="messages" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
});
