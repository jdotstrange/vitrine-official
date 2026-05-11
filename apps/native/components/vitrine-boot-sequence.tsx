import { View, Text, StyleSheet, Modal } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import Animated, { useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import { LinearGradient } from 'expo-linear-gradient';

interface VitrineBootSequenceProps {
  isActive: boolean;
  onComplete: () => void;
}

export function VitrineBootSequence({ isActive, onComplete }: VitrineBootSequenceProps) {
  const [phase, setPhase] = useState<'idle' | 'pulse' | 'burst' | 'fade'>('idle');
  const [hasCompleted, setHasCompleted] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      setPhase('idle');
      setHasCompleted(false);
      return;
    }

    // Don't restart if we've already completed
    if (hasCompleted) {
      return;
    }

    // Reset phase when becoming active
    setPhase('pulse');
    const burstTimer = setTimeout(() => setPhase('burst'), 400);
    const fadeTimer = setTimeout(() => setPhase('fade'), 1000);
    const completeTimer = setTimeout(() => {
      setHasCompleted(true);
      onCompleteRef.current();
      idleTimerRef.current = setTimeout(() => setPhase('idle'), 100);
    }, 2000);

    return () => {
      clearTimeout(burstTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [isActive, hasCompleted]);

  const pulseStyle = useAnimatedStyle(() => {
    if (phase === 'pulse') {
      return {
        transform: [{ scale: withSequence(withTiming(1.1, { duration: 300 }), withTiming(1, { duration: 300 })) }],
      };
    }
    if (phase === 'burst') {
      return {
        transform: [{ scale: withTiming(1.3, { duration: 300 }) }],
        opacity: withTiming(0, { duration: 300 }),
      };
    }
    return { transform: [{ scale: 0 }], opacity: 0 };
  });

  const progressStyle = useAnimatedStyle(() => {
    let width = '0%';
    if (phase === 'pulse') width = '30%';
    else if (phase === 'burst') width = '70%';
    else if (phase === 'fade') width = '100%';

    return {
      width: withTiming(width, { duration: 250 }),
    };
  });

  // Don't render if not active or if we've completed
  if (!isActive || phase === 'idle') return null;

  return (
    <Modal 
      visible={isActive && phase !== 'idle'} 
      transparent 
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.container}>
        {/* Center logo container */}
        <View style={styles.centerContainer}>
          {/* Subtle glow */}
          {phase === 'pulse' && (
            <Animated.View style={[styles.glow, pulseStyle]}>
              <View style={styles.glowFill} />
            </Animated.View>
          )}

          {/* Logo placeholder */}
          <Animated.View style={[styles.logoContainer, pulseStyle]}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>V</Text>
            </View>
          </Animated.View>
        </View>

        {/* Boot text */}
        <View style={styles.bootTextContainer}>
          <Text style={styles.bootText}>
            {phase === 'pulse' && 'INITIALIZING_'}
            {phase === 'burst' && 'LOADING...'}
            {phase === 'fade' && 'READY_'}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  logoContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primaryForeground,
  },
  bootTextContainer: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
    gap: 8,
  },
  bootText: {
    fontSize: 12,
    color: colors.primary + 'B3',
    letterSpacing: 2,
  },
  progressBarContainer: {
    width: 128,
    height: 2,
    backgroundColor: colors.foreground + '1A',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressGradient: {
    width: '100%',
    height: '100%',
  },
});
