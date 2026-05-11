import { View } from 'react-native';
import { useState } from 'react';
import { CollectorProfile } from '@/components/collector-profile';

export default function MyProfilePage() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <CollectorProfile 
        collectorId="me" 
        onScrollDirectionChange={setScrollDirection}
      />
    </View>
  );
}
