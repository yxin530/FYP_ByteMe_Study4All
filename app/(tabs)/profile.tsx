import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  HelpCircle,
  LogOut,
  Moon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';

type Screen = 'profile' | 'settings' | 'preferences';

export default function Profile() {
  const { user, logout: performLogout } = useAuth();
  const [screen, setScreen] = useState<Screen>('profile');
  const [logout, setLogout] = useState(false);

  const displayName = user?.name || 'Aina Rahman';
  const displayEmail = user?.email || 'aina.rahman@student.edu.my';
  const displayLevel = user?.level ? `${user.level} · Computer Science` : 'Year 2 · Computer Science';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AR';

  const handleConfirmLogout = async () => {
    try {
      await performLogout();
    } finally {
      setLogout(false);
      router.replace('/(auth)/login');
    }
  };

  if (screen === 'settings') {
    return (
      <SettingsScreen
        back={() => setScreen('profile')}
        logout={() => setLogout(true)}
      />
    );
  }

  if (screen === 'preferences') {
    return <Preferences back={() => setScreen('profile')} />;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>My Profile</Text>
        <Pressable
          style={s.headerBtn}
          onPress={() => setScreen('settings')}
          accessibilityLabel="Settings"
        >
          <SlidersHorizontal size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User Identity Card */}
        <View style={s.identityCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{displayName}</Text>
            <Text style={s.email}>{displayEmail}</Text>
            <View style={s.gradeBadge}>
              <Text style={s.gradeText}>{displayLevel}</Text>
            </View>
          </View>
          <Pressable
            style={s.editProfileBtn}
            onPress={() => setScreen('preferences')}
          >
            <Text style={s.editProfileText}>Edit</Text>
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={s.stats}>
          {[
            ['5 days', 'Study streak', '🔥'],
            ['12', 'Quizzes completed', '🎯'],
            ['4', 'Notes uploaded', '📚'],
          ].map(([value, label, emoji]) => (
            <View style={s.stat} key={label}>
              <Text style={s.statEmoji}>{emoji}</Text>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Learning section */}
        <Text style={s.overline}>LEARNING CONFIGURATION</Text>
        <View style={s.group}>
          <Row
            icon={<BookOpen size={18} color={theme.colors.blue} />}
            title="Learning preferences & subjects"
            detail="4 subjects"
            onPress={() => setScreen('preferences')}
          />
          <Row
            icon={<Sparkles size={18} color={theme.colors.violet} />}
            title="AI Tutor explanation style"
            detail="Step-by-step"
            onPress={() => setScreen('preferences')}
          />
          <Row
            icon={<Bell size={18} color={theme.colors.amber} />}
            title="Notifications & study alarms"
            detail="8:00 pm daily"
            onPress={() => setScreen('settings')}
          />
        </View>

        {/* Account section */}
        <Text style={s.overline}>SECURITY & SYSTEM</Text>
        <View style={s.group}>
          <Row
            icon={<Shield size={18} color={theme.colors.secondary} />}
            title="Account security & credentials"
            onPress={() => setScreen('settings')}
          />
          <Row
            icon={<HelpCircle size={18} color={theme.colors.secondary} />}
            title="Help, documentation & feedback"
          />
          <Pressable style={s.logoutRow} onPress={() => setLogout(true)}>
            <LogOut size={18} color={theme.colors.red} />
            <Text style={s.logoutText}>Log out of Study4All</Text>
          </Pressable>
        </View>
      </ScrollView>

      {logout && (
        <LogoutModal
          cancel={() => setLogout(false)}
          confirm={handleConfirmLogout}
        />
      )}
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View style={s.rowIcon}>{icon}</View>
      <Text style={s.rowTitle}>{title}</Text>
      {detail ? <Text style={s.rowDetail}>{detail}</Text> : null}
      <ChevronRight size={18} color={theme.colors.muted} />
    </Pressable>
  );
}

function SettingsScreen({
  back,
  logout,
}: {
  back: () => void;
  logout: () => void;
}) {
  const [toggles, setToggles] = useState([true, true, true, false]);
  const toggle = (index: number) =>
    setToggles(toggles.map((val, i) => (i === index ? !val : val)));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="Settings" back={back} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.overline}>NOTIFICATIONS</Text>
        <View style={s.group}>
          <ToggleRow
            label="Daily study reminders"
            value={toggles[0]}
            onPress={() => toggle(0)}
          />
          <View style={s.row}>
            <Clock3 size={18} color={theme.colors.secondary} />
            <Text style={s.rowTitle}>Reminder schedule</Text>
            <Text style={s.rowDetail}>8:00 pm</Text>
          </View>
          <ToggleRow
            label="Quiz result explanations ready"
            value={toggles[1]}
            onPress={() => toggle(1)}
          />
          <ToggleRow
            label="Material processed for AI"
            value={toggles[2]}
            onPress={() => toggle(2)}
          />
          <ToggleRow
            label="Weekly mastery report"
            value={toggles[3]}
            onPress={() => toggle(3)}
          />
        </View>

        <Text style={s.overline}>ACCOUNT SETTINGS</Text>
        <View style={s.group}>
          <Row
            icon={<UserRound size={18} color={theme.colors.secondary} />}
            title="Edit student profile"
          />
          <Row
            icon={<Shield size={18} color={theme.colors.secondary} />}
            title="Change password"
          />
          <Row
            icon={<BookOpen size={18} color={theme.colors.secondary} />}
            title="Data privacy & grounded materials"
          />
        </View>

        <Pressable style={s.logoutGroupBtn} onPress={logout}>
          <LogOut size={18} color={theme.colors.red} />
          <Text style={s.logoutText}>Log out of Study4All</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Bell size={18} color={theme.colors.secondary} />
      <Text style={s.rowTitle}>{label}</Text>
      <View style={[s.toggle, value && s.toggleOn]}>
        <View style={[s.toggleKnob, value && s.knobOn]} />
      </View>
    </Pressable>
  );
}

function Preferences({ back }: { back: () => void }) {
  const [goal, setGoal] = useState('60 min');
  const [time, setTime] = useState('Evening');
  const [style, setStyle] = useState('Step by step');
  const [saved, setSaved] = useState(false);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="Learning Preferences" back={back} />
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Enrolled Subjects</Text>
        <View style={s.chips}>
          {['Mathematics', 'Programming', 'Statistics', 'English'].map(
            (item) => (
              <View style={s.chip} key={item}>
                <Text style={s.chipText}>{item}</Text>
              </View>
            )
          )}
        </View>

        <Choice
          title="Daily Study Target"
          values={['30 min', '60 min', '90 min']}
          selected={goal}
          onSelect={setGoal}
        />
        <Choice
          title="Preferred Study Routine"
          values={['Morning', 'Afternoon', 'Evening']}
          selected={time}
          onSelect={setTime}
        />

        <Text style={s.sectionTitle}>How should the AI Tutor teach?</Text>
        {[
          ['Step by step', 'Detailed sequential working with formula citations'],
          ['Short and direct', 'Key summary points and immediate answers'],
          ['With analogies', 'Real-world practical examples first'],
        ].map(([title, detail]) => (
          <Pressable
            key={title}
            onPress={() => setStyle(title)}
            style={[s.preference, style === title && s.preferenceSelected]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.preferenceTitle}>{title}</Text>
              <Text style={s.preferenceSub}>{detail}</Text>
            </View>
            <View
              style={[s.radio, style === title && s.radioSelected]}
            >
              {style === title && <View style={s.radioDot} />}
            </View>
          </Pressable>
        ))}

        <Pressable
          style={s.primary}
          onPress={() => {
            setSaved(true);
            setTimeout(() => {
              setSaved(false);
              back();
            }, 700);
          }}
        >
          {saved ? <Check size={18} color="#FFFFFF" /> : null}
          <Text style={s.primaryText}>
            {saved ? 'Preferences Saved!' : 'Save Preferences'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Choice({
  title,
  values,
  selected,
  onSelect,
}: {
  title: string;
  values: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={{ marginTop: 20 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.choiceRow}>
        {values.map((value) => (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[s.choice, selected === value && s.choiceSelected]}
          >
            <Text
              style={[
                s.choiceText,
                selected === value && s.choiceTextActive,
              ]}
            >
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Header({
  title,
  back,
}: {
  title: string;
  back: () => void;
}) {
  return (
    <View style={s.header}>
      <Pressable onPress={back} style={s.headerBtn}>
        <ChevronLeft size={24} color={theme.colors.text} />
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function LogoutModal({
  cancel,
  confirm,
}: {
  cancel: () => void;
  confirm: () => void;
}) {
  return (
    <View style={s.backdrop}>
      <Pressable style={s.dismiss} onPress={cancel} />
      <View style={s.modal}>
        <View style={s.logoutIcon}>
          <LogOut size={24} color={theme.colors.red} />
        </View>
        <Text style={s.modalTitle}>Log out of Study4All?</Text>
        <Text style={s.modalBody}>
          Your notes and quiz history are safely saved in your account. You can log back in anytime.
        </Text>
        <View style={s.buttons}>
          <Pressable style={s.cancel} onPress={cancel}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable style={s.confirm} onPress={confirm}>
            <Text style={s.confirmBtnText}>Log Out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    height: 58,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.blueLight,
    borderWidth: 2,
    borderColor: theme.colors.blueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.blue,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  email: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    marginTop: 6,
  },
  gradeText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
  editProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
    backgroundColor: theme.colors.blueLight,
  },
  editProfileText: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  overline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: theme.colors.secondary,
    marginBottom: 8,
    marginTop: 8,
  },
  group: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 24,
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  rowDetail: {
    color: theme.colors.secondary,
    fontSize: 12,
  },
  logoutRow: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutText: {
    color: theme.colors.red,
    fontWeight: '700',
    fontSize: 13,
  },
  logoutGroupBtn: {
    height: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.redBorder,
    backgroundColor: theme.colors.redSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    padding: 3,
  },
  toggleOn: {
    backgroundColor: theme.colors.blue,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
    backgroundColor: theme.colors.blueLight,
  },
  chipText: {
    color: theme.colors.blue,
    fontSize: 12,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  choice: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  choiceSelected: {
    backgroundColor: theme.colors.blue,
  },
  choiceText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  choiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  preference: {
    minHeight: 64,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  preferenceSelected: {
    borderColor: theme.colors.blue,
    borderWidth: 2,
    backgroundColor: theme.colors.blueLight,
  },
  preferenceTitle: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: 14,
  },
  preferenceSub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.blue,
    backgroundColor: theme.colors.blue,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  primary: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,.45)',
    justifyContent: 'center',
    padding: 20,
  },
  dismiss: {
    flex: 1,
  },
  modal: {
    padding: 24,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
  logoutIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.redSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  modalBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    marginTop: 6,
    lineHeight: 18,
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    marginTop: 20,
  },
  cancel: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirm: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
