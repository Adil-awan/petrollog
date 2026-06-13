import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { initDB } from '../src/db/database';
import { Colors } from '../src/theme/colors';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '700', color: Colors.textPrimary },
          contentStyle: { backgroundColor: Colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-record"
          options={{
            title: 'Add Fuel Record',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerStyle: { backgroundColor: Colors.card },
          }}
        />
        <Stack.Screen
          name="edit-record"
          options={{
            title: 'Edit Record',
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerStyle: { backgroundColor: Colors.card },
          }}
        />
        <Stack.Screen
          name="export"
          options={{
            title: 'Export Data',
            headerStyle: { backgroundColor: Colors.card },
          }}
        />
      </Stack>
    </View>
  );
}
