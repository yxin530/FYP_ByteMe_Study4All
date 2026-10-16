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
  BarChart3,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code2,
  Flame,
  Headphones,
  HelpCircle,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';

type Screen = 'overview' | 'empty' | 'subject' | 'weak';

const subjects = [
  ['Mathematics', '68%', '#2563EB', Target],
  ['Programming', '54%', '#7C3AED', Code2],
  ['Statistics', '81%', '#16A34A', BarChart3],
  ['English', '42%', '#D97706', BookOpen],
] as const;

export default function Progress() {
  const [screen, setScreen] = useState<Screen>('overview');
  const [range, setRange] = useState('Month');

  if (screen === 'weak') {
    return <WeakTopics back={() => setScreen('overview')} />;
  }

  if (screen === 'subject') {
    return <SubjectPerformance back={() => setScreen('overview')} />;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Progress & Mastery</Text>
          <Text style={s.sub}>Performance Analytics</Text>
        </View>
        <Pressable
          style={s.weakBadgeBtn}
          onPress={() => setScreen('weak')}
          accessibilityLabel="Review weak topics"
        >
          <Sparkles size={14} color={theme.colors.violet} />
          <Text style={s.weakBadgeText}>3 weak topics</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Timeframe Range Tabs */}
        <View style={s.tabs}>
          {['Week', 'Month', 'All time'].map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                setRange(value);
                setScreen(value === 'All time' ? 'empty' : 'overview');
              }}
              style={[s.tab, range === value && s.tabActive]}
            >
              <Text style={[s.tabText, range === value && s.tabTextActive]}>
                {value}
              </Text>
            </Pressable>
          ))}
        </View>

        {screen === 'empty' ? (
          <EmptyHistory />
        ) : (
          <Overview
            openSubject={() => setScreen('subject')}
            openWeak={() => setScreen('weak')}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({
  openSubject,
  openWeak,
}: {
  openSubject: () => void;
  openWeak: () => void;
}) {
  return (
    <>
      {/* 3 Key Metric Stats */}
      <View style={s.stats}>
        {[
          ['5 days', 'Study streak', Flame, '#EA580C'],
          ['65%', 'Avg quiz score', Target, theme.colors.blue],
          ['9h 40m', 'Total studied', Timer, '#16A34A'],
        ].map(([value, label, Icon, color]) => {
          const StatIcon = Icon as React.ComponentType<{
            size?: number;
            color?: string;
          }>;
          return (
            <View style={s.stat} key={String(label)}>
              <View
                style={[
                  s.statIconWrap,
                  { backgroundColor: `${String(color)}15` },
                ]}
              >
                <StatIcon size={18} color={String(color)} />
              </View>
              <Text style={s.statValue}>{String(value)}</Text>
              <Text style={s.statLabel}>{String(label)}</Text>
            </View>
          );
        })}
      </View>

      {/* Quiz Score History Chart */}
      <View style={s.chartCard}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.cardTitle}>Quiz Score Trajectory</Text>
            <Text style={s.cardSub}>Last 6 quizzes across all subjects</Text>
          </View>
          <Text style={s.chartScoreAvg}>+18% improvement</Text>
        </View>

        <View style={s.chartContainer}>
          <View style={s.chartGridLines}>
            <View style={s.gridLine} />
            <View style={s.gridLine} />
            <View style={s.gridLine} />
          </View>
          <View style={s.chartLine} />
          {[52, 64, 56, 72, 82, 70].map((score, i) => (
            <View
              key={i}
              style={[
                s.chartPointWrapper,
                { left: `${i * 18 + 5}%`, bottom: `${score * 0.9}%` },
              ]}
            >
              <View style={s.pointBadge}>
                <Text style={s.pointBadgeText}>{score}%</Text>
              </View>
              <View style={s.chartPoint} />
            </View>
          ))}
        </View>
        <View style={s.chartLabels}>
          {['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5', 'Quiz 6'].map(
            (q) => (
              <Text key={q} style={s.chartLabelText}>
                {q}
              </Text>
            )
          )}
        </View>
      </View>

      {/* Weak Topics Callout */}
      <Pressable style={s.weakBanner} onPress={openWeak}>
        <View style={s.weakBannerIcon}>
          <Sparkles size={20} color={theme.colors.violet} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.weakBannerTitle}>3 Topics Require Revision</Text>
          <Text style={s.weakBannerSub}>
            Quadratics, Recursion, Probability · Tap to view AI recommendations
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.violet} />
      </Pressable>

      {/* Subject Mastery List */}
      <Text style={s.sectionTitle}>Mastery by Subject</Text>
      {subjects.map(([name, score, color, Icon]) => {
        const SubjectIcon = Icon as React.ComponentType<{
          size?: number;
          color?: string;
        }>;
        return (
          <Pressable
            key={name}
            style={s.subjectRow}
            onPress={openSubject}
          >
            <View
              style={[
                s.subjectIconWrap,
                { backgroundColor: `${color}15` },
              ]}
            >
              <SubjectIcon size={20} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.subjectHeader}>
                <Text style={s.subjectName}>{name}</Text>
                <Text style={{ color, fontWeight: '800', fontSize: 14 }}>
                  {score}
                </Text>
              </View>
              <View style={s.bar}>
                <View
                  style={[
                    s.fill,
                    {
                      width: score as `${number}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            </View>
            <ChevronRight size={18} color={theme.colors.secondary} />
          </Pressable>
        );
      })}
    </>
  );
}

function EmptyHistory() {
  return (
    <View style={s.emptyCard}>
      <View style={s.emptyIconWrap}>
        <BarChart3 size={40} color={theme.colors.blue} />
      </View>
      <Text style={s.emptyTitle}>No historical records yet</Text>
      <Text style={s.emptyBody}>
        Complete quizzes and audio sessions to generate learning analytics and personalized study trends.
      </Text>
      <Pressable style={s.primary} onPress={() => router.push('/quiz')}>
        <Target size={18} color="#FFFFFF" />
        <Text style={s.primaryText}>Take First Practice Quiz</Text>
      </Pressable>
    </View>
  );
}

function SubjectPerformance({ back }: { back: () => void }) {
  const items = [
    ['Linear equations', '90%', '#16A34A', 'Mastered'],
    ['Functions & graphs', '74%', '#2563EB', 'Good'],
    ['Quadratic equations', '58%', '#DC2626', 'Needs revision'],
    ['Indices & surds', '—', '#CBD5E1', 'Not started'],
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={back} style={s.headerBtn}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Mathematics Mastery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.mastery}>
          <View style={s.masteryRing}>
            <Text style={s.masteryText}>68%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.masterySub}>Overall Syllabus Mastery</Text>
            <Text style={s.masteryTitle}>Improving Steadily</Text>
            <Text style={s.green}>↗ +8% vs last month</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Topic Breakdown</Text>
        {items.map(([name, score, color, state]) => (
          <View key={name} style={s.topicRow}>
            <View style={s.subjectHeader}>
              <Text style={s.subjectName}>{name}</Text>
              <Text
                style={[
                  s.topicStatus,
                  state === 'Needs revision'
                    ? s.statusRevision
                    : state === 'Mastered'
                    ? s.statusMastered
                    : undefined,
                ]}
              >
                {state}
              </Text>
            </View>
            <View style={s.topicProgressRow}>
              <View style={s.bar}>
                <View
                  style={[
                    s.fill,
                    {
                      width: (score === '—' ? '0%' : score) as `${number}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={s.scoreLabel}>{score}</Text>
            </View>
          </View>
        ))}

        <Text style={s.sectionTitle}>Recent Quiz Attempts</Text>
        {[
          'Quadratic equations · 70% (7/10) · 5 Oct',
          'Quadratic equations · 50% (5/10) · 1 Oct',
        ].map((item) => (
          <View style={s.quizRow} key={item}>
            <HelpCircle size={18} color={theme.colors.secondary} />
            <Text style={s.quizRowText}>{item}</Text>
          </View>
        ))}

        <Pressable
          style={s.primary}
          onPress={() => router.push('/quiz')}
        >
          <Target size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Take Mathematics Quiz</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeakTopics({ back }: { back: () => void }) {
  const items = [
    [
      'Factorising quadratics',
      'Mathematics · Last score: 50%',
      'Common pitfall: Sign errors when choosing factor pairs for negative constants',
      Target,
      '#2563EB',
    ],
    [
      'Recursion in Python',
      'Programming · Last score: 45%',
      'Common pitfall: Omitting the base termination case before recursive calls',
      Code2,
      '#7C3AED',
    ],
    [
      'Compound Probability',
      'Statistics · Last score: 55%',
      "Common pitfall: Confusing mutually exclusive vs independent conditional rules",
      BarChart3,
      '#16A34A',
    ],
  ] as const;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={back} style={s.headerBtn}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Weak Topics Analysis</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.profileCard}>
          <Sparkles size={22} color={theme.colors.violet} />
          <View style={{ flex: 1 }}>
            <Text style={s.profileLabel}>LEARNING PROFILE INSIGHTS</Text>
            <Text style={s.profileTitle}>3 Core Concepts Need Focus</Text>
            <Text style={s.profileBody}>
              Identified by your learning pattern across the last 5 quizzes and notes review.
            </Text>
          </View>
        </View>

        {items.map(([name, meta, mistake, Icon, color]) => {
          const TopicIcon = Icon as React.ComponentType<{
            size?: number;
            color?: string;
          }>;
          return (
            <View style={s.weakCard} key={name}>
              <View style={s.weakHeader}>
                <View
                  style={[s.weakIcon, { backgroundColor: `${color}18` }]}
                >
                  <TopicIcon size={22} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.weakTitle}>{name}</Text>
                  <Text style={s.weakMeta}>{meta}</Text>
                </View>
              </View>

              <View style={s.mistake}>
                <CircleAlert size={16} color="#B45309" />
                <Text style={s.mistakeText}>{mistake}</Text>
              </View>

              <View style={s.weakActions}>
                <Pressable
                  style={s.practiseAction}
                  onPress={() => router.push('/quiz')}
                >
                  <Target size={14} color="#FFFFFF" />
                  <Text style={s.practiseActionText}>Practise (5 Qs)</Text>
                </Pressable>

                <Pressable
                  style={s.aiAction}
                  onPress={() => router.push('/(tabs)/tutor')}
                >
                  <Bot size={14} color={theme.colors.violet} />
                  <Text style={s.aiActionText}>Ask AI Tutor</Text>
                </Pressable>

                <Pressable
                  style={s.audioAction}
                  onPress={() => router.push('/learn')}
                >
                  <Headphones size={14} color={theme.colors.amber} />
                </Pressable>
              </View>
            </View>
          );
        })}

        <Pressable
          style={s.primary}
          onPress={() => router.push('/(tabs)/plan')}
        >
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Add Revision to Study Plan</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
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
  sub: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  weakBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.violetSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
  },
  weakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.violet,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  tabs: {
    height: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.blue,
  },
  tabText: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  chartCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: theme.colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  chartScoreAvg: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  chartContainer: {
    height: 120,
    backgroundColor: theme.colors.blueLight,
    borderRadius: theme.radius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  chartGridLines: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  chartLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '44%',
    height: 2,
    backgroundColor: theme.colors.blue,
  },
  chartPointWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  pointBadge: {
    backgroundColor: theme.colors.text,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginBottom: 2,
  },
  pointBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  chartPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.blue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  chartLabelText: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  weakBanner: {
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  weakBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  weakBannerSub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 10,
  },
  subjectRow: {
    marginTop: 8,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...theme.shadows.card,
  },
  subjectIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectName: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: 14,
  },
  bar: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginTop: 8,
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  primary: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyCard: {
    padding: 32,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptyBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    lineHeight: 20,
    marginTop: 6,
    fontSize: 13,
  },
  mastery: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  masteryRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 8,
    borderColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.blue,
  },
  masterySub: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  masteryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  green: {
    color: theme.colors.green,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },
  topicRow: {
    marginTop: 8,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  topicProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 6,
    width: 36,
    textAlign: 'right',
  },
  topicStatus: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    color: theme.colors.secondary,
    backgroundColor: theme.colors.bg,
  },
  statusRevision: {
    color: theme.colors.red,
    backgroundColor: theme.colors.redSoft,
  },
  statusMastered: {
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  quizRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quizRowText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  profileCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.violet,
    letterSpacing: 0.8,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
    color: theme.colors.text,
  },
  profileBody: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  weakCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  weakHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  weakIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weakTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  weakMeta: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  mistake: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.amberSoft,
  },
  mistakeText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  weakActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  practiseAction: {
    flex: 1,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  practiseActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  aiAction: {
    flex: 1,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  aiActionText: {
    color: theme.colors.violet,
    fontWeight: '700',
    fontSize: 12,
  },
  audioAction: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
