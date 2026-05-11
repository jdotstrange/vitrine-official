import { useState, useRef } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollY = useRef(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const previousOffset = lastScrollY.current;
    
    if (currentOffset > previousOffset + 10) {
      setScrollDirection('down');
    } else if (currentOffset < previousOffset - 10) {
      setScrollDirection('up');
    }
    
    lastScrollY.current = currentOffset;
  };

  return { scrollDirection, handleScroll };
}
