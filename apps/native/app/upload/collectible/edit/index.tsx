import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';

export default function EditCollectiblePage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Edit Collectible</Text>
        <Text style={styles.subtitle}>Use the edit button on the collectible detail card.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.foreground} />
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    color: colors.foreground,
  },
});
