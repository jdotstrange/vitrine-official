import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, TYPE, SPACING } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TERMS = `# Terms of Service

**Last Updated: January 2024**

## Agreement to Terms

By accessing or using Vitrine, you agree to be bound by these Terms of Service and all applicable laws and regulations.

## Use License

Permission is granted to temporarily use Vitrine for personal, non-commercial purposes. This is the grant of a license, not a transfer of title, and under this license you may not:

- Modify or copy the materials
- Use the materials for any commercial purpose
- Attempt to reverse engineer any software
- Remove any copyright or other proprietary notations

## User Accounts

You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.

## User Content

You retain ownership of any content you submit, post, or display on Vitrine. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute your content.

## Prohibited Uses

You may not use Vitrine:
- In any way that violates any applicable law
- To transmit any malicious code
- To impersonate any person or entity
- To collect or store personal data about other users
- For any unlawful purpose

## Intellectual Property

All content, features, and functionality of Vitrine are owned by us and are protected by international copyright, trademark, and other intellectual property laws.

## Limitation of Liability

In no event shall Vitrine be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.

## Changes to Terms

We reserve the right to modify these terms at any time. Your continued use of Vitrine after any changes constitutes acceptance of those changes.

## Contact Information

For questions about these Terms, please contact us at legal@vitrine.app`;

export function SettingsTerms() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <View style={[s.header, { paddingTop: insets.top + 16, borderBottomColor: colors.frostDivider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Terms of Service</Text>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={[s.contentText, { color: colors.textSecondary }]}>{TERMS}</Text>
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
