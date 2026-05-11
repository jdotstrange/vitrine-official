import { Tracking } from '@/components/tracking';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TrackingPage() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Tracking />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
