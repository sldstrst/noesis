import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { blink } from '@/lib/blink';
import type { PushTokensRow } from '@/lib/db-types';

export async function registerForPushNotifications(userId: string) {
  if (Platform.OS === 'web') return null;
  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Новые лекции',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const token = result.data;
  const table = blink.db.table<PushTokensRow>('push_tokens');
  const existing = await table.list({ where: { userId } });
  if (!existing.some((row) => row.token === token)) await table.create({ userId, token });
  return token;
}

/** Placeholder: delivery must be wired to a trusted server before production use. */
export async function notifyNewLecture(_lectureTitle: string) {
  return { sent: false, reason: 'Отправка push-уведомлений пока не подключена к серверу.' };
}
