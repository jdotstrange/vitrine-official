import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, X } from 'lucide-react-native';
import { OptimizedImage } from '../optimized-image';
import { colors } from '@/lib/colors';

export interface InvitedMember {
  id: string;
  name: string;
  avatar: string | null;
}

export interface InviteMembersSectionProps {
  invitedMembers: InvitedMember[];
  onRemoveMember: (id: string) => void;
  onOpenInviteModal: () => void;
}

export function InviteMembersSection({
  invitedMembers,
  onRemoveMember,
  onOpenInviteModal,
}: InviteMembersSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>Invite Members</Text>

      {invitedMembers.length > 0 && (
        <View style={styles.invitedMembersList}>
          {invitedMembers.map((member) => (
            <View key={member.id} style={styles.invitedMemberChip}>
              <OptimizedImage
                src={member.avatar || '/placeholder.svg'}
                style={styles.invitedMemberAvatar}
                width={20}
                height={20}
                accessibilityLabel={`${member.name} avatar`}
              />
              <Text style={styles.invitedMemberName}>{member.name.split(' ')[0]}</Text>
              <TouchableOpacity
                onPress={() => onRemoveMember(member.id)}
                style={styles.invitedMemberRemove}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${member.name}`}
              >
                <X size={12} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        onPress={onOpenInviteModal}
        style={styles.inviteButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Add people"
      >
        <Plus size={20} color={colors.primary} />
        <Text style={styles.inviteButtonText}>Add people</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  invitedMembersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  invitedMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  invitedMemberAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  invitedMemberName: {
    fontSize: 14,
    color: colors.foreground,
  },
  invitedMemberRemove: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteButton: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
