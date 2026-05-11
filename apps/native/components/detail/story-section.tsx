import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

export interface StorySectionProps {
  listingDescription?: string | null;
  description?: string | null;
}

export function StorySection({ listingDescription, description }: StorySectionProps) {
  const text = listingDescription || description;
  if (!text) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.foreground,
  },
});
