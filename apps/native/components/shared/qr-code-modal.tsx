import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Copy, Check } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { HolographicFrame } from '@/components/vault';
import { useTheme, RADII, TYPE } from '@/lib/design';
import { copyToClipboard } from '@/lib/clipboard';

export interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  title: string;
  subtitle?: string;
}

export function QRCodeModal({ visible, onClose, value, title, subtitle }: QRCodeModalProps) {
  const { colors } = useTheme();
  const [linkCopied, setLinkCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    setLinkCopied(false);
    onClose();
  };

  const handleCopy = () => {
    copyToClipboard(value);
    setLinkCopied(true);
    timerRef.current = setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
      statusBarTranslucent
    >
      <View style={[s.overlay, { backgroundColor: colors.scrim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <HolographicFrame borderRadius={32} intensity="standard">
          <View style={[s.card, { backgroundColor: colors.sheetBg }]}>
            <View style={[s.codeFrame, { backgroundColor: colors.void, borderColor: colors.frostDivider }]}>
              <QRCode
                value={value}
                size={200}
                backgroundColor="transparent"
                color={colors.textPrimary}
                ecl="H"
              />
            </View>

            <Text style={[s.label, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
            {subtitle ? (
              <Text style={[s.subLabel, { color: colors.textTertiary }]} numberOfLines={2}>{subtitle}</Text>
            ) : null}

            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.copyBtn, { borderColor: colors.frostBorder, backgroundColor: colors.void }, linkCopied && { borderColor: colors.semanticGreenBorder, backgroundColor: colors.semanticGreenFill }]}
                onPress={handleCopy}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Copy link"
              >
                {linkCopied ? (
                  <Check size={14} color={colors.semanticGreen} strokeWidth={2} />
                ) : (
                  <Copy size={14} color={colors.textSecondary} strokeWidth={1.8} />
                )}
                <Text style={[s.copyText, { color: colors.textSecondary }, linkCopied && { color: colors.semanticGreen }]}>
                  {linkCopied ? 'COPIED' : 'COPY LINK'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.textPrimary }]} onPress={handleClose} activeOpacity={0.85}>
              <Text style={[s.closeText, { color: colors.textInverse }]}>DONE</Text>
            </TouchableOpacity>
          </View>
        </HolographicFrame>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  codeFrame: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  label: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 6,
  },
  subLabel: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  actionRow: {
    marginTop: 20,
    marginBottom: 20,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  copyBtnCopied: {},
  copyText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  closeBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
});
