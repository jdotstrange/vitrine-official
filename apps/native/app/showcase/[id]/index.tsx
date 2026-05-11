import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ShowcaseDetailV3 from '@/components/showcase-detail-v3';
import { useAuth } from '@/lib/contexts/auth-context';

export default function ShowcasePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <ShowcaseDetailV3 showcaseId={id} currentUserId={user?.id} />
    </View>
  );
}
