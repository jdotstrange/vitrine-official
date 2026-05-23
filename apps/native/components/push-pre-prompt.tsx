/**
 * PushPrePrompt — contextual pre-prompt card shown before the iOS system
 * push permission dialog. Maximizes opt-in rate by explaining value at
 * high-intent moments.
 *
 * Trigger surfaces mount this card and pass a `context` prop to render
 * the appropriate headline. The first trigger that fires wins — after
 * the system dialog (grant or decline) the card never appears again.
 * "Not Now" defers for 14 days.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Radar, UserPlus, TrendingUp } from 'lucide-react-native';
import type { ComponentType } from 'react';

import { useTheme } from '@/lib/design';
import { usePush } from '@/lib/contexts/push-context';

export type PrePromptContext =
  | 'post_upload'
  | 'post_follow'
  | 'post_track'
  | 'activity_surface'
  | 'settings';

interface ContextConfig {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  headline: string;
}

const CONTEXT_MAP: Record<PrePromptContext, ContextConfig> = {
  post_upload: {
    icon: TrendingUp,
    headline: 'Get notified when collectors discover and track your items',
  },
  post_follow: {
    icon: UserPlus,
    headline: "We'll notify you when they post new items and showcases",
  },
  post_track: {
    icon: Radar,
    headline: 'Get comp alerts and status changes for items you track',
  },
  activity_surface: {
    icon: Bell,
    headline: 'Want these delivered to your lock screen?',
  },
  settings: {
    icon: Bell,
    headline: 'Enable push notifications',
  },
};

interface PushPrePromptProps {
  context: PrePromptContext;
}

export function PushPrePrompt({ context }: PushPrePromptProps) {
  const { shouldShowPrePrompt, requestPermission, deferPrompt } = usePush();
  const { colors } = useTheme();

  if (!shouldShowPrePrompt) return null;

  const config = CONTEXT_MAP[context];
  const Icon = config.icon;

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <View style={styles.iconRow}>
        <View style={[styles.iconCircle, { backgroundColor: colors.brandVoltFill }]}>
          <Icon size={22} color={colors.brandVolt} strokeWidth={1.8} />
        </View>
      </View>

      <Text style={[styles.headline, { color: colors.textPrimary }]}>
        {config.headline}
      </Text>

      <Text style={[styles.subtext, { color: colors.textSecondary }]}>
        You can customize which notifications you receive in Settings
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.enableBtn, { backgroundColor: colors.brandVolt }]}
          onPress={requestPermission}
          activeOpacity={0.8}
        >
          <Text style={[styles.enableText, { color: colors.background }]}>Enable</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={deferPrompt} activeOpacity={0.7}>
          <Text style={[styles.deferText, { color: colors.textSecondary }]}>Not Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconRow: {
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtext: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  enableBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },
  enableText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 15,
  },
  deferText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
});
