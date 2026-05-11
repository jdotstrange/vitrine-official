import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/lib/colors';

interface UserAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
  borderWidth?: number;
  borderColor?: string;
}

/**
 * User avatar component with initials fallback
 * - Shows image if uri provided
 * - Falls back to initials from name
 * - Shows "?" if no name provided
 */
export function UserAvatar({
  uri,
  name,
  size = 40,
  style,
  borderWidth = 0,
  borderColor = colors.background,
}: UserAvatarProps) {
  const getInitials = (displayName: string | null | undefined): string => {
    if (!displayName?.trim()) return '?';
    
    const words = displayName.trim().split(/\s+/);
    if (words.length === 1) {
      // Single word - take first 2 characters
      return words[0].substring(0, 2).toUpperCase();
    }
    // Multiple words - take first letter of first two words
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor,
    overflow: 'hidden',
  };

  // Calculate font size based on avatar size
  const fontSize = Math.max(size * 0.35, 10);

  if (uri) {
    return (
      <View style={[containerStyle, style]}>
        <Image 
          source={{ uri }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, styles.initialsContainer, style]}>
      <Text style={[styles.initialsText, { fontSize }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '700',
    color: colors.primaryForeground,
    letterSpacing: 0.5,
  },
});
