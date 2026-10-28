import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Flame,
  Headphones,
  Sparkles,
  Target,
} from 'lucide-react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { profileApi } from '@/lib/api';

export default function Home() {
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    profileApi
      .get()
      .then((p) => setStreakDays(p.streakDays ?? 0))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting & Avatar */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Text style={styles.greetingSub}>WELCOME BACK</Text>
              <View style={styles.streakBadge}>
                <Flame size={14} color="#EA580C" />
                <Text style={styles.streakText}>{streakDays} day{streakDays === 1 ? '' : 's'} streak</Text>
              </View>
            </View>
            <Text style={styles.title}>Hi, Aina 👋</Text>
          </View>
          <Pressable
            style={styles.avatarButton}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityLabel="View profile"
          >
            <Text style={styles.avatarText}>AR</Text>
          </Pressable>
        </View>

        {/* Today's Study Progress Card */}
        <Pressable
          style={styles.studyCard}
          onPress={() => router.push('/(tabs)/plan')}
        >
          <View style={styles.studyCardTop}>
            <View>
              <Text style={styles.cardOverline}>TODAY'S STUDY GOAL</Text>
              <Text style={styles.studyCardTitle}>3 of 5 tasks completed</Text>
            </View>
            <View style={styles.studyIconWrap}>
              <CalendarCheck size={20} color={theme.colors.blue} />
            </View>
          </View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '60%' }]} />
          </View>

          <View style={styles.studyCardFooter}>
            <Text style={styles.studyCardSub}>
              1h 15m studied · ~45 min remaining
            </Text>
            <View style={styles.viewPlanLink}>
              <Text style={styles.viewPlanText}>View Plan</Text>
              <ArrowRight size={13} color={theme.colors.blue} />
            </View>
          </View>
        </Pressable>

        {/* Quick Action Grid */}
        <Text style={styles.sectionHeading}>Learning Hub</Text>
        <View style={styles.grid}>
          {/* AI Tutor */}
          <Pressable
            style={[styles.actionCard, { borderLeftColor: theme.colors.violet, borderLeftWidth: 4 }]}
            onPress={() => router.push('/(tabs)/tutor')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.violetSoft }]}>
              <Bot size={22} color={theme.colors.violet} />
            </View>
            <Text style={styles.actionTitle}>AI Tutor</Text>
            <Text style={styles.actionDesc}>Chat & ask questions from your uploaded materials</Text>
            <View style={styles.cardArrow}>
              <ChevronRight size={16} color={theme.colors.secondary} />
            </View>
          </Pressable>

          {/* Learning Materials */}
          <Pressable
            style={[styles.actionCard, { borderLeftColor: theme.colors.blue, borderLeftWidth: 4 }]}
            onPress={() => router.push('/materials')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.blueLight }]}>
              <BookOpen size={22} color={theme.colors.blue} />
            </View>
            <Text style={styles.actionTitle}>Materials</Text>
            <Text style={styles.actionDesc}>4 files uploaded · PDF, PPTX, lecture notes</Text>
            <View style={styles.cardArrow}>
              <ChevronRight size={16} color={theme.colors.secondary} />
            </View>
          </Pressable>

          {/* Practice Quizzes */}
          <Pressable
            style={[styles.actionCard, { borderLeftColor: theme.colors.green, borderLeftWidth: 4 }]}
            onPress={() => router.push('/quiz')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.greenSoft }]}>
              <Target size={22} color={theme.colors.green} />
            </View>
            <Text style={styles.actionTitle}>Practice Quizzes</Text>
            <Text style={styles.actionDesc}>Adaptive quizzes with instant AI step-by-step marking</Text>
            <View style={styles.cardArrow}>
              <ChevronRight size={16} color={theme.colors.secondary} />
            </View>
          </Pressable>

          {/* Audio Lessons & Podcasts */}
          <Pressable
            style={[styles.actionCard, { borderLeftColor: theme.colors.amber, borderLeftWidth: 4 }]}
            onPress={() => router.push('/learn')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: theme.colors.amberSoft }]}>
              <Headphones size={22} color={theme.colors.amber} />
            </View>
            <Text style={styles.actionTitle}>Audio Podcasts</Text>
            <Text style={styles.actionDesc}>Turn your notes into AI audio lessons to listen on the go</Text>
            <View style={styles.cardArrow}>
              <ChevronRight size={16} color={theme.colors.secondary} />
            </View>
          </Pressable>
        </View>

        {/* AI Recommendation Banner */}
        <View style={styles.recommendCard}>
          <View style={styles.recommendHeader}>
            <View style={styles.recommendBadge}>
              <Sparkles size={14} color={theme.colors.violet} />
              <Text style={styles.recommendBadgeText}>AI STUDY INSIGHT</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/progress')}>
              <Text style={styles.weakLink}>Weak topics &gt;</Text>
            </Pressable>
          </View>
          <Text style={styles.recommendTitle}>Revise: Factorising quadratics</Text>
          <Text style={styles.recommendBody}>
            Your last 2 Mathematics quizzes scored below 60% on this topic. A quick 5-question practice will solidify this concept.
          </Text>

          <View style={styles.recommendActions}>
            <Pressable
              style={styles.recommendButtonPrimary}
              onPress={() => router.push('/quiz')}
            >
              <Target size={15} color="#FFFFFF" />
              <Text style={styles.recommendButtonPrimaryText}>Start 5-min Quiz</Text>
            </Pressable>

            <Pressable
              style={styles.recommendButtonSecondary}
              onPress={() => router.push('/(tabs)/tutor')}
            >
              <Bot size={15} color={theme.colors.violet} />
              <Text style={styles.recommendButtonSecondaryText}>Ask Tutor</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Performance Snapshot */}
        <View style={styles.snapshotCard}>
          <View style={styles.snapshotHeader}>
            <Text style={styles.snapshotTitle}>Recent Performance</Text>
            <Pressable onPress={() => router.push('/(tabs)/progress')}>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.snapshotRow}>
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>68%</Text>
              <Text style={styles.snapshotLabel}>Mathematics</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>81%</Text>
              <Text style={styles.snapshotLabel}>Statistics</Text>
            </View>
            <View style={styles.snapshotDivider} />
            <View style={styles.snapshotItem}>
              <Text style={styles.snapshotValue}>54%</Text>
              <Text style={styles.snapshotLabel}>Programming</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  page: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingSub: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  streakText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 4,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.blueLight,
    borderWidth: 2,
    borderColor: theme.colors.blueBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.blue,
  },
  studyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 24,
    ...theme.shadows.card,
  },
  studyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardOverline: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  studyCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 4,
  },
  studyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.blue,
    borderRadius: 4,
  },
  studyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  studyCardSub: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  viewPlanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewPlanText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.blue,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 14,
  },
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    position: 'relative',
    ...theme.shadows.card,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionDesc: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: 4,
    lineHeight: 18,
    paddingRight: 24,
  },
  cardArrow: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  recommendCard: {
    backgroundColor: theme.colors.violetSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    padding: 18,
    marginBottom: 20,
    ...theme.shadows.card,
  },
  recommendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recommendBadgeText: {
    color: theme.colors.violet,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  weakLink: {
    color: theme.colors.violet,
    fontSize: 12,
    fontWeight: '600',
  },
  recommendTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
  },
  recommendBody: {
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  recommendActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  recommendButtonPrimary: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recommendButtonPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  recommendButtonSecondary: {
    flex: 1,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  recommendButtonSecondaryText: {
    color: theme.colors.violet,
    fontWeight: '600',
    fontSize: 13,
  },
  snapshotCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    ...theme.shadows.sm,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  snapshotTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.blue,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotItem: {
    flex: 1,
    alignItems: 'center',
  },
  snapshotValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  snapshotLabel: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  snapshotDivider: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
});
