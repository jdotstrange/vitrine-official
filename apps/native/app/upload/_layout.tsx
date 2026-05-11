import { Stack } from 'expo-router';

export default function UploadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back gesture globally for upload flow
      }}
    />
  );
}
