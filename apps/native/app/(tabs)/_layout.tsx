import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Profile' }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explore' }}
      />
      <Tabs.Screen
        name="upload"
        options={{ title: 'Upload' }}
      />
      <Tabs.Screen
        name="tracking"
        options={{ title: 'Tracking' }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages' }}
      />
    </Tabs>
  );
}
