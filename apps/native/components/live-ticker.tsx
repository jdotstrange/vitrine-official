import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useEffect, useRef } from 'react';

const tickerItems = [
  { name: 'PSA 10 Charizard', price: '$42,500', change: '+12.4%', up: true },
  { name: 'Jordan 1 Chicago', price: '$2,850', change: '-3.2%', up: false },
  { name: 'Rolex Daytona', price: '$38,200', change: '+5.8%', up: true },
  { name: 'Black Lotus MTG', price: '$125,000', change: '+2.1%', up: true },
  { name: 'Kobe Rookie RC', price: '$8,400', change: '-1.5%', up: false },
  { name: 'Supreme Box Logo', price: '$1,200', change: '+8.9%', up: true },
];

interface LiveTickerProps {
  scrollDirection?: 'up' | 'down' | null;
}

export function LiveTicker({ scrollDirection }: LiveTickerProps) {
  const scrollX = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll animation
  useEffect(() => {
    const interval = setInterval(() => {
      scrollX.current += 1;
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: scrollX.current,
          animated: true,
        });
      }
      // Reset when we've scrolled far enough (seamless loop)
      if (scrollX.current > 2000) {
        scrollX.current = 0;
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Double the items for seamless loop
  const doubledItems = [...tickerItems, ...tickerItems];

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <View style={styles.border} />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {doubledItems.map((item, i) => (
          <View key={i} style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>{item.price}</Text>
            <View style={styles.changeContainer}>
              {item.up ? (
                <TrendingUp size={12} color={colors.positive} />
              ) : (
                <TrendingDown size={12} color={colors.negative} />
              )}
              <Text
                style={[
                  styles.change,
                  { color: item.up ? colors.positive : colors.negative },
                ]}
              >
                {item.change}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.6)',
  },
  border: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: `${colors.border}4D`, // 30% opacity
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  itemPrice: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
    color: colors.foreground,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  change: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
  },
});
