import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { useAuth } from '@/lib/contexts/auth-context';

export default function Index() {
  const { isLoading } = useAuth();

  // Auth context handles all routing - this is just a loading screen
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Auth context will redirect appropriately
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
