import { View, StyleSheet } from 'react-native';
import { useState } from 'react';
import { BottomDock } from '@/components/bottom-dock';
import { CommunityHub } from '@/components/community-hub';
import { colors } from '@/lib/colors';

export default function CommunityPage() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  return (
    <View style={styles.container}>
      <CommunityHub onScrollDirectionChange={setScrollDirection} />
      <BottomDock activeTab="community" scrollDirection={scrollDirection} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
