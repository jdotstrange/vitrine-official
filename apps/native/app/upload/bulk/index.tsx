import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BulkUploadPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.placeholder}>
          <Text style={styles.title}>Bulk Upload</Text>
          <Text style={styles.comingSoon}>Coming soon...</Text>
        </View>
      </View>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  comingSoon: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 16,
  },
});
