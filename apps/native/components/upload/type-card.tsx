import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/lib/colors';
import Animated, { FadeIn } from 'react-native-reanimated';

const CARD_HEIGHT = 160;

export interface TypeItem {
  id: string;
  code: string;
  name: string;
  icon: LucideIcon;
  thumbnail: string;
  categories: CategoryItem[];
}

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
}

interface TypeCardProps {
  type: TypeItem;
  index: number;
  onSelect: () => void;
}

export function TypeCard({ type, index, onSelect }: TypeCardProps) {
  const Icon = type.icon;
  const hasThumbnail = type.thumbnail.length > 0;

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <TouchableOpacity
        style={styles.card}
        onPress={onSelect}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${type.name}, ${type.categories.length} categories`}
      >
        {hasThumbnail ? (
          <Image
            source={{ uri: type.thumbnail }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={`${type.name} preview`}
          />
        ) : (
          <View style={styles.iconFill}>
            <Icon size={40} color={colors.primary} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0.95)']}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.countChip}>
          <Text style={styles.countText}>{type.categories.length}</Text>
        </View>
        <View style={styles.label}>
          <Text style={styles.labelText} numberOfLines={1}>{type.name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export { CARD_HEIGHT as TYPE_CARD_HEIGHT };

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.muted,
  },
  iconFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary + '0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChip: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary + '25',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  labelText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.foreground,
  },
});
