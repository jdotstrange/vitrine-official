/**
 * Edit collectible — reuses UploadEntry in edit mode on the same row id.
 */

import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { UploadEntry } from '@/components/upload-entry';

export default function CollectibleEditPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectibleId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';

  if (!collectibleId) {
    return null;
  }

  return <UploadEntry mode="edit" editCollectibleId={collectibleId} />;
}
