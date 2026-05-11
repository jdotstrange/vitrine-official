import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '../skeleton';

export function EditProfileSkeleton() {
  return (
    <View style={s.root}>
      {/* Avatar section */}
      <View style={s.avatarSection}>
        <Skeleton width={120} height={120} borderRadius={60} />
        <Skeleton width={100} height={14} borderRadius={4} style={{ marginTop: 12 }} />
      </View>

      {/* Form fields */}
      <View style={s.form}>
        {['Display Name', 'Username', 'Bio', 'Email'].map((label, i) => (
          <View key={label} style={s.field}>
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton
              width="100%"
              height={label === 'Bio' ? 80 : 48}
              borderRadius={12}
              style={{ marginTop: 6 }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {},
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  form: { paddingHorizontal: 16, paddingTop: 24, gap: 24 },
  field: {},
});
