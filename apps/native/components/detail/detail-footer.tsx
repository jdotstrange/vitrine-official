import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Clipboard,
} from 'react-native';
import { Share2, Flag, Copy } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { SHARE_URLS } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/format-time';

export interface DetailFooterProps {
  collectibleId?: string;
  title: string;
  isOwner: boolean;
  listedAt: Date | string | number;
  confidence?: string | null;
  onToast?: (message: string) => void;
}

export function DetailFooter({
  collectibleId,
  title,
  isOwner,
  listedAt,
  confidence,
  onToast,
}: DetailFooterProps) {
  const shareUrl = SHARE_URLS.collectible(collectibleId || '');

  const handleShare = async () => {
    const prefix = isOwner ? 'Check out my' : 'Check out this';
    const message = `${prefix} "${title}" on the Vitrine App\n\n${shareUrl}`;
    try {
      await Share.share({ message, url: shareUrl });
    } catch {}
  };

  const handleCopyId = async () => {
    if (!collectibleId) return;
    Clipboard.setString(collectibleId);
    onToast?.('Item ID copied');
  };

  const shortId = collectibleId ? collectibleId.slice(0, 8) + '...' : '';

  return (
    <View style={styles.container}>
      <View style={styles.divider} />

      <TouchableOpacity style={styles.row} onPress={handleShare} activeOpacity={0.6}>
        <Share2 size={16} color={colors.mutedForeground} />
        <Text style={styles.rowText}>Share this collectible</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} activeOpacity={0.6}>
        <Flag size={16} color={colors.mutedForeground} />
        <Text style={styles.rowText}>Report a problem</Text>
      </TouchableOpacity>

      <View style={styles.metaBlock}>
        <Text style={styles.metaText}>
          Listed {formatTimeAgo(listedAt)}
        </Text>
        {confidence && (
          <Text style={styles.metaText}>
            AI classification confidence: {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
          </Text>
        )}
        {collectibleId && (
          <TouchableOpacity
            style={styles.idRow}
            onPress={handleCopyId}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel="Copy item ID"
          >
            <Text style={styles.idText}>Item ID: {shortId}</Text>
            <Copy size={11} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  rowText: {
    fontSize: 15,
    color: colors.foreground,
  },
  metaBlock: {
    marginTop: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  idText: {
    fontSize: 10,
    color: colors.mutedForeground,
    fontFamily: 'JetBrainsMono',
  },
});
