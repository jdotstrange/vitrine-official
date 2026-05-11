import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_COUNT_KEY = 'vitrine_session_count';
const LAST_GREETING_KEY = 'vitrine_last_greeting_idx';

interface GreetingResult {
  greeting: string;
  subtitle: string;
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night';
}

function getGreetingPrefix(sessionCount: number): string {
  if (sessionCount <= 1) return 'Welcome to Vitrine';
  if (sessionCount <= 3) return 'Welcome back';
  if (sessionCount <= 15) return getTimeGreeting();
  return 'Hey';
}

const NEW_USER_SUBTITLES = [
  'Start by uploading your first collectible.',
  'Explore thousands of collectibles from the community.',
  'Build your collection, showcase what you love.',
];

const EARLY_SUBTITLES = [
  'Keep building — your collection is just getting started.',
  'New collectibles are added every day. Explore what\'s new.',
  'Track items you love to stay on top of the market.',
];

const REGULAR_SUBTITLES = [
  '2K+ collectibles added since your last sign in.',
  'Your tracked items have new activity.',
  'New items from collectors you follow.',
  'Your showcase is getting views. Keep curating.',
  '14 new collectibles match your interests.',
  'The community has been active since you were last here.',
];

const POWER_USER_SUBTITLES = [
  '12 tracked items are trending this week.',
  'Your collection keeps growing. Nice work.',
  '3 new offers waiting in your inbox.',
  'Price drops on items you\'re watching.',
  'Your showcase got 48 new views.',
  'The market is moving — check your tracked items.',
];

function getSubtitlePool(sessionCount: number): string[] {
  if (sessionCount <= 1) return NEW_USER_SUBTITLES;
  if (sessionCount <= 5) return EARLY_SUBTITLES;
  if (sessionCount <= 50) return REGULAR_SUBTITLES;
  return POWER_USER_SUBTITLES;
}

export function useGreetingMessage(): GreetingResult {
  const [result, setResult] = useState<GreetingResult>({
    greeting: getTimeGreeting(),
    subtitle: '',
  });

  useEffect(() => {
    let mounted = true;

    async function resolve() {
      const raw = await AsyncStorage.getItem(SESSION_COUNT_KEY);
      const sessionCount = (parseInt(raw ?? '0', 10) || 0) + 1;
      await AsyncStorage.setItem(SESSION_COUNT_KEY, String(sessionCount));

      const lastIdx = parseInt(
        (await AsyncStorage.getItem(LAST_GREETING_KEY)) ?? '-1',
        10,
      );
      const pool = getSubtitlePool(sessionCount);

      let nextIdx = Math.floor(Math.random() * pool.length);
      if (pool.length > 1 && nextIdx === lastIdx) {
        nextIdx = (nextIdx + 1) % pool.length;
      }
      await AsyncStorage.setItem(LAST_GREETING_KEY, String(nextIdx));

      if (mounted) {
        setResult({
          greeting: getGreetingPrefix(sessionCount),
          subtitle: pool[nextIdx],
        });
      }
    }

    resolve();
    return () => { mounted = false; };
  }, []);

  return result;
}
