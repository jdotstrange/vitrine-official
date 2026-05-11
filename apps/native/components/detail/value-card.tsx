import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface ValueCardProps {
  price: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export function ValueCard({ price, bgColor, borderColor, textColor }: ValueCardProps) {
  return (
    <View style={[styles.valueCard, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.valueCardLabel, { color: textColor }]}>VALUE</Text>
      <Text style={[styles.valueCardAmount, { color: textColor }]}>{price || '--'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  valueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  valueCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  valueCardAmount: {
    fontSize: 18,
    fontFamily: 'JetBrainsMono',
    fontWeight: 'bold',
  },
});
