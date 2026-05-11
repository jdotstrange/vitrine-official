import { Stack } from 'expo-router';

/**
 * Design Lab — isolated sandbox route group.
 *
 * Routes inside this group are NOT wired into production navigation.
 * They exist to prototype new visual DNA in isolation so we can tune
 * tokens and composition on real devices against real data before
 * committing any changes to the shared design system.
 *
 * Access by typing the path directly (e.g. /collectible-detail) —
 * the (design-lab) group itself does not add a URL segment.
 */
export default function DesignLabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
        animation: 'fade',
      }}
    />
  );
}
