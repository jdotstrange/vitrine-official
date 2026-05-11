import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  ArrowLeft,
  Target,
  Share2,
  Send,
  Pencil,
  Trash2,
  MoreVertical,
  QrCode,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { ActionIcon } from '../ui/action-icon';

export interface DetailTopControlsProps {
  isOwner: boolean;
  showOwnerMenu: boolean;
  insetTop: number;
  onBack: () => void;
  onEdit: () => void;
  onShowQR: () => void;
  onShare: () => void;
  onToggleOwnerMenu: () => void;
  onDelete: () => void;
}

export function DetailTopControls({
  isOwner,
  showOwnerMenu,
  insetTop,
  onBack,
  onEdit,
  onShowQR,
  onShare,
  onToggleOwnerMenu,
  onDelete,
}: DetailTopControlsProps) {
  return (
    <View style={[styles.topControls, { paddingTop: insetTop + 8 }]}>
      <ActionIcon icon={ArrowLeft} onPress={onBack} label="Go back" size={20} />

      <View style={styles.controlRight}>
        {isOwner && (
          <ActionIcon icon={QrCode} onPress={onShowQR} label="Show QR code" />
        )}
        {!isOwner && (
          <>
            <ActionIcon icon={Target} label="Track collectible" />
            <ActionIcon icon={Send} label="Message collector" />
          </>
        )}
        <ActionIcon icon={Share2} onPress={onShare} label="Share collectible" />
        {isOwner && (
          <View style={styles.menuContainer}>
            <ActionIcon icon={MoreVertical} onPress={onToggleOwnerMenu} label="More options" />
            {showOwnerMenu && (
              <View style={styles.menu}>
                <TouchableOpacity
                  onPress={() => { onToggleOwnerMenu(); onEdit(); }}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Edit collectible"
                >
                  <Pencil size={16} color={colors.foreground} />
                  <Text style={styles.menuItemText}>Edit Collectible</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onDelete}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Delete collectible"
                >
                  <Trash2 size={16} color={colors.destructive} />
                  <Text style={styles.menuItemTextRed}>Delete Collectible</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  controlRight: {
    flexDirection: 'row',
    gap: 6,
  },
  menuContainer: {
    position: 'relative',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 48,
    width: 192,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  menuItemTextRed: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.destructive,
  },
});
