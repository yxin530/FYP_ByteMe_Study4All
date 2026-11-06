import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { notificationApi } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForStudyNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;
  if (finalStatus !== 'granted') {
    finalStatus = (await Notifications.requestPermissionsAsync()).status;
  }
  if (finalStatus !== 'granted') return null;
  if (Device.osName === 'Android') {
    await Notifications.setNotificationChannelAsync('study-reminders', { name: 'Study reminders', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await notificationApi.registerDeviceToken({ token, platform: Device.osName === 'iOS' ? 'ios' : 'android' });
  return token;
}
