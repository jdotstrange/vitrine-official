import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme, COLORS, RADII, TYPE } from '@/lib/design';

import { Sparkline } from './sparkline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TelemetryDeltaDirection = 'up' | 'down' | 'flat';

export interface TelemetryPanel {
  /** Uppercase kicker label (e.g. `TRACKED VALUE`, `WATCHING`). */
  label: string;
  /** Primary readout. Pre-formatted (e.g. `$47.2K`, `27`). */
  value: string;
  /** Optional secondary slot for muted prefix or suffix (e.g. `$` muted). */
  valuePrefix?: string;
  /** Optional delta string (e.g. `+$1.2K`, `+3`). Sign drives direction unless overridden. */
  delta?: string;
  /** Override the auto-derived delta direction (default: parsed from delta string). */
  deltaDirection?: TelemetryDeltaDirection;
  /** Time window for the delta (e.g. `/24h`, `/7d`). Optional. */
  deltaWindow?: string;
  /** Sparkline data, oldest → newest. Empty array renders flat baseline. */
  series: number[];
  /** Override sparkline color. Defaults to deltaDirection-derived hue (or brandVolt for flat/none). */
  sparklineColor?: string;
  /**
   * Promote this panel to a full-width hero treatment with larger typography
   * and a wider sparkline. Hero panels render stacked above any secondary
   * panels (which share a flex-row beneath a frost divider). Use sparingly —
   * one hero panel is the canonical pattern.
   */
  hero?: boolean;
}

export interface TelemetryLiveStrip {
  /** Show the pulsing live dot. */
  isLive?: boolean;
  /** Pre-formatted "last update" string (e.g. `4m ago`). Optional. */
  lastUpdate?: string;
  /** Free-form mono items (e.g. `27 ITEMS`, `+3 /24H`). Each renders as a divider-separated cell. */
  items?: string[];
}

export interface TelemetryCardProps {
  /** Hero title (e.g. `YOUR RADAR`). */
  title: string;
  /** Optional uppercase subtitle below the title. */
  subtitle?: string;
  /** Optional vault watermark glyph rendered in bottom-right (e.g. `RADAR`). */
  watermark?: string;
  /** Optional channel header strip ("● LIVE · 27 ITEMS · 4M AGO"). */
  liveStrip?: TelemetryLiveStrip;
  /** Telemetry panels (1-4 supported). 3 is the canonical layout. */
  panels: TelemetryPanel[];
  /** Outer container style override. */
  style?: ViewStyle | ViewStyle[];
}

// ---------------------------------------------------------------------------
// Helpers (non-component utilities — keep static COLORS)
// ---------------------------------------------------------------------------

function autoDirection(delta?: string): TelemetryDeltaDirection {
  if (!delta) return 'flat';
  const trimmed = delta.trim();
  if (trimmed.startsWith('+') || trimmed.startsWith('↑')) return 'up';
  if (trimmed.startsWith('-') || trimmed.startsWith('−') || trimmed.startsWith('↓')) return 'down';
  return 'flat';
}

function deltaColor(dir: TelemetryDeltaDirection): string {
  switch (dir) {
    case 'up':
      return COLORS.semanticGreen;
    case 'down':
      return COLORS.semanticRed;
    case 'flat':
    default:
      return COLORS.textTertiary;
  }
}

function deltaGlyph(dir: TelemetryDeltaDirection): string {
  switch (dir) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'flat':
    default:
      return '·';
  }
}

// ---------------------------------------------------------------------------
// Live dot (pulsing)
// ---------------------------------------------------------------------------

function LiveDot() {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.liveDot, { backgroundColor: colors.brandVolt, opacity }]} />;
}

// ---------------------------------------------------------------------------
// Panel body — shared renderer for hero + secondary variants.
// ---------------------------------------------------------------------------

interface PanelBodyProps {
  panel: TelemetryPanel;
  variant: 'hero' | 'secondary';
}

function PanelBody({ panel, variant }: PanelBodyProps) {
  const { colors } = useTheme();
  const dir = panel.deltaDirection ?? autoDirection(panel.delta);
  const dColor = deltaColor(dir);
  const sColor = panel.sparklineColor ?? (dir === 'down' ? colors.semanticRed : colors.brandVolt);
  const isHero = variant === 'hero';

  const labelStyle = isHero ? styles.heroLabel : styles.panelLabel;
  const valueStyle = isHero ? styles.heroValue : styles.panelValue;
  const valuePrefixStyle = isHero ? styles.heroValuePrefix : styles.panelValuePrefix;
  const deltaTextStyle = isHero ? styles.heroDeltaText : styles.deltaText;
  const deltaWindowStyle = isHero ? styles.heroDeltaWindow : styles.deltaWindow;
  const sparklineHeight = isHero ? 32 : 20;
  const sparklineBarWidth = isHero ? 4 : 3;
  const sparklineGap = isHero ? 3 : 2;

  return (
    <View>
      <Text style={[labelStyle, { color: colors.textTertiary }]}>{panel.label}</Text>

      <Text style={[valueStyle, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {panel.valuePrefix ? <Text style={[valuePrefixStyle, { color: colors.textSecondary }]}>{panel.valuePrefix}</Text> : null}
        {panel.value}
      </Text>

      {panel.delta || panel.deltaWindow ? (
        <View style={isHero ? styles.heroDeltaRow : styles.deltaRow}>
          {panel.delta ? (
            <Text style={[deltaTextStyle, { color: dColor }]} numberOfLines={1}>
              {deltaGlyph(dir)} {panel.delta}
            </Text>
          ) : null}
          {panel.deltaWindow ? (
            <Text style={[deltaWindowStyle, { color: colors.textTertiary }]} numberOfLines={1}>
              {panel.deltaWindow}
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={isHero ? styles.heroDeltaRow : styles.deltaRow}>
          <Text style={[deltaTextStyle, { color: colors.textTertiary }]}>· no Δ</Text>
        </View>
      )}

      <Sparkline
        data={panel.series}
        color={sColor}
        height={sparklineHeight}
        barWidth={sparklineBarWidth}
        gap={sparklineGap}
        style={styles.sparkline}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * Telemetry-style intelligence card. The signature surface for monitoring
 * lenses (RADAR, future portfolio dashboards). Distinct from DossierCard:
 *
 * - No corner brackets (those are the Dossier signature).
 * - Optional channel header strip with live indicator.
 * - Each metric panel renders value + delta + sparkline in observability-card
 *   composition (Datadog/Grafana/Linear DNA).
 *
 * Panels with `hero: true` render full-width above the secondary row with
 * larger typography and a wider sparkline. The canonical pattern is one hero
 * (the headline portfolio number) plus N secondary panels.
 *
 * Stays inside the V3 token system (void canvas, frost borders, mono type,
 * brandVolt accents). The watermark glyph is preserved as the only shared
 * identity-zone element across vault hub cards.
 */
export function TelemetryCard({
  title,
  subtitle,
  watermark,
  liveStrip,
  panels,
  style,
}: TelemetryCardProps) {
  const { colors } = useTheme();

  const heroPanels = panels.filter((p) => p.hero);
  const secondaryPanels = panels.filter((p) => !p.hero);

  return (
    <View style={[styles.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }, style]}>
      {watermark ? <Text style={[styles.watermark, { color: colors.pressOverlay }]}>{watermark}</Text> : null}

      {liveStrip && (liveStrip.isLive || liveStrip.lastUpdate || (liveStrip.items?.length ?? 0) > 0) ? (
        <View style={styles.channelStrip}>
          {liveStrip.isLive ? (
            <View style={styles.channelCell}>
              <LiveDot />
              <Text style={[styles.channelLive, { color: colors.brandVolt }]}>LIVE</Text>
            </View>
          ) : null}
          {(liveStrip.items ?? []).map((item, i) => (
            <View key={`${item}-${i}`} style={styles.channelCell}>
              <View style={[styles.channelDivider, { backgroundColor: colors.frostBorder }]} />
              <Text style={[styles.channelText, { color: colors.textTertiary }]}>{item}</Text>
            </View>
          ))}
          {liveStrip.lastUpdate ? (
            <View style={styles.channelCell}>
              <View style={[styles.channelDivider, { backgroundColor: colors.frostBorder }]} />
              <Text style={[styles.channelText, { color: colors.textTertiary }]}>{liveStrip.lastUpdate}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text> : null}

      {heroPanels.map((panel, idx) => (
        <View
          key={`hero-${panel.label}-${idx}`}
          style={[styles.heroPanel, idx > 0 && styles.heroPanelGap]}
        >
          <PanelBody panel={panel} variant="hero" />
        </View>
      ))}

      {heroPanels.length > 0 && secondaryPanels.length > 0 ? (
        <View style={[styles.sectionDivider, { backgroundColor: colors.frostBorder }]} />
      ) : null}

      {secondaryPanels.length > 0 ? (
        <View style={styles.panelsRow}>
          {secondaryPanels.map((panel, idx) => (
            <React.Fragment key={`secondary-${panel.label}-${idx}`}>
              {idx > 0 ? <View style={[styles.panelDivider, { backgroundColor: colors.frostBorder }]} /> : null}
              <View style={styles.panel}>
                <PanelBody panel={panel} variant="secondary" />
              </View>
            </React.Fragment>
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: RADII.card,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    bottom: -10,
    right: -5,
    fontSize: 120,
    fontFamily: TYPE.heroDisplay,
  },

  // Channel strip
  channelStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  channelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  channelDivider: {
    width: 1,
    height: 9,
    marginHorizontal: 10,
  },
  channelLive: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.6,
  },
  channelText: {
    fontFamily: TYPE.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Title block
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 28,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.8,
    marginTop: 2,
    marginBottom: 22,
    textTransform: 'uppercase',
  },

  // Hero panel
  heroPanel: {},
  heroPanelGap: {
    marginTop: 18,
  },
  heroLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  heroValuePrefix: {},
  heroDeltaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  heroDeltaText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 12,
    letterSpacing: -0.2,
  },
  heroDeltaWindow: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.4,
  },

  // Section divider
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
  },

  // Secondary panels
  panelsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  panel: {
    flex: 1,
  },
  panelDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  panelLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  panelValue: {
    fontFamily: TYPE.monoMedium,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  panelValuePrefix: {},
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  deltaText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: -0.2,
  },
  deltaWindow: {
    fontFamily: TYPE.mono,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  sparkline: {
    marginTop: 2,
  },
});
