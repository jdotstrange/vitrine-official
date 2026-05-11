import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Copy, Reply, Smile, Trash2 } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

let Clipboard: { setStringAsync: (text: string) => Promise<void> } | null = null;
try { Clipboard = require('expo-clipboard'); } catch { /* not installed */ }
import { colors } from '@/lib/colors';

const QUICK_EMOJIS = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F632}', '\u{1F622}', '\u{1F525}'];

interface MessageActionMenuProps {
  visible: boolean;
  onClose: () => void;
  messageContent?: string | null;
  isOwnMessage: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onDelete: () => void;
}

export function MessageActionMenu({
  visible,
  onClose,
  messageContent,
  isOwnMessage,
  onReply,
  onReact,
  onDelete,
}: MessageActionMenuProps) {
  const handleCopy = async () => {
    if (messageContent && Clipboard) {
      await Clipboard.setStringAsync(messageContent);
    }
    onClose();
  };

  const handleReply = () => {
    onReply();
    onClose();
  };

  const handleReact = (emoji: string) => {
    onReact(emoji);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete();
            onClose();
          },
        },
      ]
    );
  };

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
        {/* Quick emoji row */}
        <View style={styles.emojiRow}>
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => handleReact(emoji)}
              accessibilityRole="button"
              accessibilityLabel={`React with ${emoji}`}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Action buttons */}
        <TouchableOpacity
          style={styles.action}
          onPress={handleReply}
          accessibilityRole="button"
          accessibilityLabel="Reply to message"
        >
          <Reply size={18} color={colors.foreground} />
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>

        {messageContent && (
          <TouchableOpacity
            style={styles.action}
            onPress={handleCopy}
            accessibilityRole="button"
            accessibilityLabel="Copy message text"
          >
            <Copy size={18} color={colors.foreground} />
            <Text style={styles.actionText}>Copy</Text>
          </TouchableOpacity>
        )}

        {isOwnMessage && (
          <TouchableOpacity
            style={styles.action}
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Delete message"
          >
            <Trash2 size={18} color={colors.destructive} />
            <Text style={[styles.actionText, styles.destructiveText]}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
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
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  actionText: {
    color: colors.foreground,
    fontSize: 16,
  },
  destructiveText: {
    color: colors.destructive,
  },
  cancelButton: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  cancelText: {
    color: colors.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
  },
});
