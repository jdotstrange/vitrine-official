import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

interface Reaction {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
  you_reacted: boolean;
}

interface ReactionPillsProps {
  reactions: Reaction[];
  onToggleReaction: (emoji: string) => void;
}

export function ReactionPills({ reactions, onToggleReaction }: ReactionPillsProps) {
  if (!reactions.length) return null;

  return (
    <View style={styles.container}>
      {reactions.map((reaction) => (
        <TouchableOpacity
          key={reaction.emoji}
          style={[styles.pill, reaction.you_reacted && styles.pillActive]}
          onPress={() => onToggleReaction(reaction.emoji)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${reaction.emoji} reaction, ${reaction.count} ${reaction.count === 1 ? 'person' : 'people'}. ${reaction.you_reacted ? 'Tap to remove' : 'Tap to react'}`}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text style={[styles.count, reaction.you_reacted && styles.countActive]}>
            {reaction.count}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
  countActive: {
    color: colors.primary,
  },
});
