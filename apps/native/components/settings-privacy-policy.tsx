import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, TYPE, SPACING } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIVACY_POLICY = `# Privacy Policy

**Last Updated: January 2024**

## Introduction

Welcome to Vitrine. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application.

## Information We Collect

### Personal Information
- Name and username
- Email address
- Profile information and photos
- Collection data (collectibles, showcases, etc.)

### Usage Data
- App usage patterns
- Device information
- Location data (if enabled)

### Content Data
- Photos and images you upload
- Messages and communications
- Comments and interactions

## How We Use Your Information

- To provide and maintain our service
- To notify you about changes to our service
- To provide customer support
- To gather analysis or valuable information
- To monitor the usage of our service
- To detect, prevent and address technical issues

## Data Security

We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Object to processing of your data
- Data portability
- Withdraw consent

## Contact Us

If you have questions about this Privacy Policy, please contact us at privacy@vitrine.app`;

export function SettingsPrivacyPolicy() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Privacy Policy</Text>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={[s.contentText, { color: colors.textSecondary }]}>{PRIVACY_POLICY}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.gutter,
    paddingBottom: 32,
  },
  contentText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 22,
  },
});
