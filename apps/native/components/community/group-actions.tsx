import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Link2, Bell, BellOff, UserPlus, LogOut, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import * as MessagingAPI from '@/lib/api/messaging';

const log = logger.create('GroupActions');

let Clipboard: { setStringAsync: (text: string) => Promise<void> } | null = null;
try {
  Clipboard = require('expo-clipboard');
} catch {
  // Not available
}

interface GroupActionsProps {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isOwner: boolean;
  initialMuted: boolean;
  onLeave?: () => void;
  onMuteToggle?: () => void;
  paddingBottom: number;
}

export function GroupActions({
  groupId,
  groupName,
  isAdmin,
  isOwner,
  initialMuted,
  onLeave,
  onMuteToggle,
  paddingBottom,
}: GroupActionsProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isTogglingMute, setIsTogglingMute] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const linkTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (linkTimerRef.current) clearTimeout(linkTimerRef.current); };
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (Clipboard) {
      await Clipboard.setStringAsync(`https://vitrine.app/community/${groupId}`);
    }
    setLinkCopied(true);
    linkTimerRef.current = setTimeout(() => setLinkCopied(false), 2000);
  }, [groupId]);

  const handleMuteToggle = useCallback(async () => {
    setIsTogglingMute(true);
    try {
      const newState = !isMuted;
      await MessagingAPI.updateConversationSettings(groupId, { is_muted: newState });
      setIsMuted(newState);
      onMuteToggle?.();
    } catch (err: unknown) {
      log.error('Failed to toggle mute:', err);
    } finally {
      setIsTogglingMute(false);
    }
  }, [groupId, isMuted, onMuteToggle]);

  const handleLeave = useCallback(async () => {
    setIsLeaving(true);
    try {
      await MessagingAPI.leaveConversation(groupId);
      onLeave?.();
      router.back();
    } catch (err: unknown) {
      log.error('Failed to leave group:', err);
      setIsLeaving(false);
      setShowLeaveConfirm(false);
    }
  }, [groupId, onLeave, router]);

  return (
    <>
      {/* Action buttons row */}
      <View style={styles.row}>
        <TouchableOpacity
          onPress={handleCopyLink}
          style={styles.btn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Share group link"
        >
          {linkCopied ? (
            <>
              <Check size={16} color={colors.success} />
              <Text style={[styles.btnText, { color: colors.success }]}>Copied!</Text>
            </>
          ) : (
            <>
              <Link2 size={16} color={colors.foreground} />
              <Text style={styles.btnText}>Share Link</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleMuteToggle}
          disabled={isTogglingMute}
          style={[styles.btn, isMuted && styles.btnMuted]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute notifications' : 'Mute notifications'}
        >
          {isMuted ? (
            <BellOff size={16} color={colors.primary} />
          ) : (
            <Bell size={16} color={colors.foreground} />
          )}
        </TouchableOpacity>

        {(isAdmin || isOwner) && (
          <TouchableOpacity
            style={styles.btn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Invite member"
          >
            <UserPlus size={16} color={colors.foreground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Leave button */}
      <View style={[styles.leaveContainer, { paddingBottom: paddingBottom + 16 }]}>
        <TouchableOpacity
          onPress={() => setShowLeaveConfirm(true)}
          style={styles.leaveBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Leave group"
        >
          <LogOut size={20} color={colors.destructive} />
          <Text style={styles.leaveBtnText}>Leave Group</Text>
        </TouchableOpacity>
      </View>

      {/* Leave confirmation modal */}
      <Modal
        visible={showLeaveConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveConfirm(false)}
        accessibilityViewIsModal
      >
        <View style={styles.modalWrap}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowLeaveConfirm(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.modalContent}>
            <View style={styles.modalIcon}>
              <LogOut size={24} color={colors.destructive} />
            </View>
            <Text style={styles.modalTitle}>Leave Group?</Text>
            <Text style={styles.modalText}>
              You will no longer receive messages from {groupName}. You can rejoin anytime.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                onPress={() => setShowLeaveConfirm(false)}
                style={[styles.modalBtn, styles.modalBtnCancel]}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLeave}
                disabled={isLeaving}
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                accessibilityRole="button"
                accessibilityLabel="Confirm leave"
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>
                  {isLeaving ? 'Leaving...' : 'Leave'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
  },
  btnMuted: {
    backgroundColor: colors.primaryGlow,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  leaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.destructive + '1A',
  },
  leaveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.destructive,
  },
  modalWrap: {
    flex: 1,
    backgroundColor: colors.glass,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.destructive + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: colors.secondary,
  },
  modalBtnConfirm: {
    backgroundColor: colors.destructive,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
});
