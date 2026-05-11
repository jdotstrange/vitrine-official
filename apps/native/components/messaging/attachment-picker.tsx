import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { ImageIcon, Camera, Package, LayoutGrid } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';

const log = logger.create('AttachmentPicker');

export type AttachmentType = 'photo' | 'camera' | 'collectible' | 'showcase';

export interface AttachmentResult {
  type: AttachmentType;
  data: {
    uris?: string[];
    collectibleId?: string;
    showcaseId?: string;
  };
}

interface AttachmentPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (result: AttachmentResult) => void;
  onSelectCollectible: () => void;
  onSelectShowcase: () => void;
}

export function AttachmentPicker({
  visible,
  onClose,
  onSelect,
  onSelectCollectible,
  onSelectShowcase,
}: AttachmentPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePhotoLibrary = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        onSelect({
          type: 'photo',
          data: { uris: result.assets.map((a) => a.uri) },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('Photo library error:', message);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleCamera = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        onSelect({
          type: 'camera',
          data: { uris: [result.assets[0].uri] },
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error('Camera error:', message);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  const handleCollectible = () => {
    onClose();
    onSelectCollectible();
  };

  const handleShowcase = () => {
    onClose();
    onSelectShowcase();
  };

  const options = [
    { icon: ImageIcon, label: 'Photo Library', onPress: handlePhotoLibrary },
    { icon: Camera, label: 'Camera', onPress: handleCamera },
    { icon: Package, label: 'Share Collectible', onPress: handleCollectible },
    { icon: LayoutGrid, label: 'Share Showcase', onPress: handleShowcase },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
          <View style={styles.backdrop} />
        </Animated.View>
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(150)}
        style={styles.menuContainer}
      >
        <View style={styles.handle} />
        <Text style={styles.heading}>Attach</Text>

        <View style={styles.grid}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.option}
              onPress={opt.onPress}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
            >
              <View style={styles.iconCircle}>
                <opt.icon size={22} color={colors.foreground} />
              </View>
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  option: {
    width: '45%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionLabel: {
    color: colors.foreground,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
