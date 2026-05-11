import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { SearchBar } from '../search-bar';
import { VitrineButton } from '../ui/vitrine-button';
import { OptimizedImage } from '../optimized-image';
import { colors } from '@/lib/colors';

export interface ConnectionItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
  inviteSearch: string;
  onSearchChange: (text: string) => void;
  filteredConnections: ConnectionItem[];
  invitedMembers: string[];
  onToggleMember: (id: string) => void;
}

export function InviteModal({
  visible,
  onClose,
  inviteSearch,
  onSearchChange,
  filteredConnections,
  invitedMembers,
  onToggleMember,
}: InviteModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invite Members</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close invite modal"
            >
              <X size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.modalSearch}>
            <SearchBar
              value={inviteSearch}
              onChange={onSearchChange}
              placeholder="Search connections..."
              showClear
            />
          </View>

          {/* Connections List */}
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {filteredConnections.map((connection) => {
              const isInvited = invitedMembers.includes(connection.id);
              return (
                <TouchableOpacity
                  key={connection.id}
                  onPress={() => onToggleMember(connection.id)}
                  style={styles.inviteModalItem}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${isInvited ? 'Remove' : 'Invite'} ${connection.name}`}
                >
                  <View style={styles.inviteModalAvatarContainer}>
                    <OptimizedImage
                      source={{ uri: connection.avatar || '/placeholder.svg' }}
                      style={styles.inviteModalAvatar}
                    />
                    {isInvited && (
                      <View style={styles.inviteModalCheck}>
                        <Check size={12} color={colors.background} />
                      </View>
                    )}
                  </View>
                  <View style={styles.inviteModalText}>
                    <Text style={styles.inviteModalName}>{connection.name}</Text>
                    <Text style={styles.inviteModalUsername}>{connection.username}</Text>
                  </View>
                  <View
                    style={[
                      styles.inviteModalCheckbox,
                      isInvited && styles.inviteModalCheckboxChecked,
                    ]}
                  >
                    {isInvited && <Check size={16} color={colors.background} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Done Button */}
          <View style={styles.modalFooter}>
            <VitrineButton
              onPress={onClose}
              fullWidth
            >
              Done {invitedMembers.length > 0 && `(${invitedMembers.length})`}
            </VitrineButton>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 448,
    maxHeight: '80%',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 70, 0.5)',
    overflow: 'hidden',
    flexDirection: 'column',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearch: {
    padding: 8,
    paddingBottom: 16,
  },
  modalList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inviteModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  inviteModalAvatarContainer: {
    position: 'relative',
  },
  inviteModalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  inviteModalCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteModalText: {
    flex: 1,
  },
  inviteModalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  inviteModalUsername: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  inviteModalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteModalCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
