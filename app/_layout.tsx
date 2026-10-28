import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/lib/authContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="materials"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="quiz"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="learn"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
