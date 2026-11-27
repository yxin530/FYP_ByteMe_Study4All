import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Plus, Trash2 } from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';
import { notificationApi } from '@/lib/api';
import { registerForStudyNotifications } from '@/lib/notifications';

interface ReminderItem {
  id: string;
  title: string;
  body: string;
  scheduled_for?: string;
  scheduledFor?: string;
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const isDemo = session?.access_token === 'demo-guest-token';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [newTitle, setNewTitle] = useState('Evening Study Review');
  const [newBody, setNewBody] = useState('Review Chapter 3 flashcards for 15 minutes');

  useEffect(() => {
    if (isDemo) {
      setReminders([
        {
          id: 'demo-rem-1',
          title: 'Daily Study Streak',
          body: 'Complete 1 quick quiz to keep your streak alive!',
          scheduledFor: '2026-11-28T20:00:00Z',
        },
      ]);
      setLoading(false);
      return;
    }

    Promise.all([
      notificationApi.getPreferences().catch(() => null),
      notificationApi.listReminders().catch(() => ({ reminders: [] })),
    ])
      .then(([prefs, remRes]: any[]) => {
        if (prefs) {
          setPushEnabled(Boolean(prefs.push_enabled ?? prefs.pushEnabled ?? true));
          setDailyRemindersEnabled(Boolean(prefs.daily_reminders_enabled ?? prefs.dailyRemindersEnabled ?? true));
          if (prefs.reminder_time || prefs.reminderTime) {
            setReminderTime(prefs.reminder_time || prefs.reminderTime);
          }
        }
        setReminders(remRes?.reminders ?? []);
      })
      .finally(() => setLoading(false));
  }, [isDemo]);

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      if (!isDemo) {
        await notificationApi.savePreferences({
          pushEnabled,
          dailyRemindersEnabled,
          reminderTime: reminderTime.trim() || '20:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kuala_Lumpur',
        });
        if (pushEnabled) {
          await registerForStudyNotifications().catch(() => undefined);
        }
      }
      Alert.alert('Saved', 'Notification preferences updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not save notification preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const scheduledFor = new Date(Date.now() + 3600 * 1000).toISOString();
    if (isDemo) {
      setReminders((prev) => [
        { id: `demo-rem-${Date.now()}`, title: newTitle.trim(), body: newBody.trim(), scheduledFor },
        ...prev,
      ]);
      return;
    }
    try {
      const created: any = await notificationApi.createReminder({
        title: newTitle.trim(),
        body: newBody.trim(),
        scheduledFor,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kuala_Lumpur',
      });
      setReminders((prev) => [created?.reminder ?? created, ...prev]);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not schedule reminder.');
    }
  };

  const handleCancelReminder = async (id: string) => {
    if (isDemo) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    try {
      await notificationApi.cancelReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not cancel reminder.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
          <ArrowLeft size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Notifications & Reminders</Text>
          <Text style={s.headerSub}>Manage push alerts and study schedules</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={theme.colors.blue} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Preferences</Text>
            <View style={s.switchRow}>
              <Text style={s.label}>Push Notifications</Text>
              <Switch value={pushEnabled} onValueChange={setPushEnabled} />
            </View>
            <View style={s.switchRow}>
              <Text style={s.label}>Daily Study Reminders</Text>
              <Switch value={dailyRemindersEnabled} onValueChange={setDailyRemindersEnabled} />
            </View>
            <Text style={s.inputLabel}>Preferred Reminder Time (HH:MM)</Text>
            <TextInput style={s.input} value={reminderTime} onChangeText={setReminderTime} />
            <Pressable style={s.primaryBtn} onPress={handleSavePreferences} disabled={saving}>
              <Bell size={16} color="#FFFFFF" />
              <Text style={s.primaryBtnText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
            </Pressable>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Schedule a Reminder</Text>
            <Text style={s.inputLabel}>Title</Text>
            <TextInput style={s.input} value={newTitle} onChangeText={setNewTitle} />
            <Text style={s.inputLabel}>Message</Text>
            <TextInput style={s.input} value={newBody} onChangeText={setNewBody} />
            <Pressable style={s.primaryBtn} onPress={handleCreateReminder}>
              <Plus size={16} color="#FFFFFF" />
              <Text style={s.primaryBtnText}>Add Reminder (+1 hr)</Text>
            </Pressable>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Upcoming Reminders</Text>
            {reminders.length === 0 ? (
              <Text style={s.muted}>No reminders scheduled.</Text>
            ) : (
              reminders.map((rem) => (
                <View key={rem.id} style={s.remRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.remTitle}>{rem.title}</Text>
                    <Text style={s.remBody}>{rem.body}</Text>
                  </View>
                  <Pressable onPress={() => handleCancelReminder(rem.id)} style={s.delBtn}>
                    <Trash2 size={16} color={theme.colors.red} />
                  </Pressable>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  headerSub: { fontSize: 12, color: theme.colors.secondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  label: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  inputLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.secondary, marginTop: 8, marginBottom: 4 },
  input: {
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  primaryBtn: {
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  muted: { fontSize: 13, color: theme.colors.muted },
  remRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  remTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  remBody: { fontSize: 12, color: theme.colors.secondary, marginTop: 2 },
  delBtn: { padding: 6 },
});
