import { useEffect, useState } from 'react';
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
  Check,
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
import { profileApi, type LearningProfile } from '@/lib/api';

type Screen = 'overview' | 'empty' | 'subject' | 'weak';

export default function Progress() {
  const [screen, setScreen] = useState<Screen>('overview');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [range, setRange] = useState('Month');
  const [profile, setProfile] = useState<LearningProfile | null>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => setProfile(null));
  }, []);

  if (screen === 'weak') {
    return <WeakTopics back={() => setScreen('overview')} profile={profile} />;
  }

  if (screen === 'subject') {
    return (
      <SubjectPerformance
        subject={selectedSubject}
        back={() => setScreen('overview')}
        profile={profile}
      />
    );
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
            <Text style={s.weakBadgeText}>{profile?.weakTopics.length ?? 0} weak topics</Text>
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
            openSubject={(subj) => {
              setSelectedSubject(subj);
              setScreen('subject');
            }}
            openWeak={() => setScreen('weak')}
            profile={profile}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Overview({
  openSubject,
  openWeak,
  profile,
}: {
  openSubject: (subject: string) => void;
  openWeak: () => void;
  profile: LearningProfile | null;
}) {
  const streakDays = profile?.streakDays ?? 0;
  const avgQuizScore = profile?.overallMastery ?? (profile?.progress.length ? Math.round(profile.progress.reduce((sum, item) => sum + item.percentage, 0) / profile.progress.length) : 0);
  const totalQuizzes = profile?.totalQuizzes ?? profile?.evidenceReferences?.length ?? 0;

  const chartQuizzes = [...(profile?.recentQuizzes ?? [])].reverse();
  const hasChartData = chartQuizzes.length > 0;
  const trendDiff =
    chartQuizzes.length >= 2
      ? chartQuizzes[chartQuizzes.length - 1].percentage - chartQuizzes[0].percentage
      : 0;

  const defaultMeta: Record<string, { color: string; icon: any }> = {
    Mathematics: { color: '#2563EB', icon: Target },
    Programming: { color: '#7C3AED', icon: Code2 },
    Statistics: { color: '#16A34A', icon: BarChart3 },
    English: { color: '#D97706', icon: BookOpen },
    Science: { color: '#059669', icon: Sparkles },
  };

  const subjectRows =
    profile?.subjectMastery && profile.subjectMastery.length > 0
      ? profile.subjectMastery.map((item) => ({
          name: item.subject,
          score: `${item.percentage}%`,
          scoreNum: item.percentage,
          color: defaultMeta[item.subject]?.color ?? theme.colors.blue,
          Icon: defaultMeta[item.subject]?.icon ?? Target,
          subtext: `${item.topicsCount} topic${item.topicsCount === 1 ? '' : 's'} · ${item.quizzesCount} attempt${item.quizzesCount === 1 ? '' : 's'}`,
        }))
      : [
          { name: 'Mathematics', score: '0%', scoreNum: 0, color: '#2563EB', Icon: Target, subtext: 'No quizzes yet' },
          { name: 'Programming', score: '0%', scoreNum: 0, color: '#7C3AED', Icon: Code2, subtext: 'No quizzes yet' },
          { name: 'Statistics', score: '0%', scoreNum: 0, color: '#16A34A', Icon: BarChart3, subtext: 'No quizzes yet' },
          { name: 'English', score: '0%', scoreNum: 0, color: '#D97706', Icon: BookOpen, subtext: 'No quizzes yet' },
        ];

  return (
    <>
      {/* 3 Key Metric Stats */}
      <View style={s.stats}>
        {[
          [`${streakDays} day${streakDays === 1 ? '' : 's'}`, 'Study streak', Flame, '#EA580C'],
          [`${avgQuizScore}%`, 'Avg quiz score', Target, theme.colors.blue],
          [`${totalQuizzes}`, 'Quizzes completed', Timer, '#16A34A'],
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
            <Text style={s.cardSub}>
              {hasChartData
                ? chartQuizzes.length === 1
                  ? 'First recorded quiz attempt'
                  : `Last ${chartQuizzes.length} quizzes across all subjects`
                : 'Track your performance improvement over time'}
            </Text>
          </View>
          <Text
            style={[
              s.chartScoreAvg,
              !hasChartData && { color: theme.colors.secondary, backgroundColor: theme.colors.surface },
            ]}
          >
            {hasChartData
              ? chartQuizzes.length >= 2
                ? `${trendDiff >= 0 ? '+' : ''}${trendDiff}% trend`
                : `${chartQuizzes[0].percentage}% score`
              : 'No quizzes yet'}
          </Text>
        </View>

        {hasChartData ? (
          <>
            <View style={s.chartContainer}>
              <View style={s.chartGridLines}>
                <View style={s.gridLine} />
                <View style={s.gridLine} />
                <View style={s.gridLine} />
              </View>
              <View style={s.chartLine} />
              {chartQuizzes.map((q, i) => {
                const score = q.percentage;
                const leftPercent =
                  chartQuizzes.length === 1
                    ? 50
                    : Math.round((i / (chartQuizzes.length - 1)) * 80 + 10);
                const bottomPercent = Math.min(88, Math.max(12, score * 0.82));
                return (
                  <View
                    key={q.quizId || i}
                    style={[
                      s.chartPointWrapper,
                      { left: `${leftPercent}%`, bottom: `${bottomPercent}%` },
                    ]}
                  >
                    <View style={s.pointBadge}>
                      <Text style={s.pointBadgeText}>{score}%</Text>
                    </View>
                    <View style={s.chartPoint} />
                  </View>
                );
              })}
            </View>
            <View style={s.chartLabels}>
              {chartQuizzes.map((q, i) => (
                <Text key={q.quizId || i} style={s.chartLabelText}>
                  {`Q${i + 1}`}
                </Text>
              ))}
            </View>
          </>
        ) : (
          <View
            style={[
              s.chartContainer,
              { alignItems: 'center', justifyContent: 'center', padding: 16 },
            ]}
          >
            <Target size={28} color={theme.colors.blue} style={{ marginBottom: 6, opacity: 0.6 }} />
            <Text style={{ fontSize: 13, color: theme.colors.secondary, textAlign: 'center' }}>
              Complete practice quizzes to visualize your grounded score trajectory.
            </Text>
          </View>
        )}
      </View>

      {/* Weak Topics Callout */}
      <Pressable style={s.weakBanner} onPress={openWeak}>
        <View style={s.weakBannerIcon}>
          <Sparkles size={20} color={theme.colors.violet} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.weakBannerTitle}>
            {profile?.weakTopics.length ?? 0} Topics Require Revision
          </Text>
          <Text style={s.weakBannerSub}>
            {profile?.weakTopics && profile.weakTopics.length > 0
              ? profile.weakTopics.map((item) => item.topic).join(', ')
              : 'Complete a quiz to generate grounded recommendations'}
          </Text>
        </View>
        <ChevronRight size={18} color={theme.colors.violet} />
      </Pressable>

      {/* Subject Mastery List */}
      <Text style={s.sectionTitle}>Mastery by Subject</Text>
      {subjectRows.map(({ name, score, scoreNum, color, Icon, subtext }) => {
        const SubjectIcon = Icon as React.ComponentType<{
          size?: number;
          color?: string;
        }>;
        return (
          <Pressable
            key={name}
            style={s.subjectRow}
            onPress={() => openSubject(name)}
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
                      width: `${Math.min(100, Math.max(0, scoreNum))}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={{ fontSize: 11, color: theme.colors.secondary, marginTop: 4 }}>
                {subtext}
              </Text>
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

function SubjectPerformance({
  subject,
  back,
  profile,
}: {
  subject: string;
  back: () => void;
  profile: LearningProfile | null;
}) {
  const subjectMeta = profile?.subjectMastery?.find(
    (s) => s.subject.toLowerCase() === subject.toLowerCase(),
  );
  const masteryPercentage = subjectMeta?.percentage ?? 0;

  const relevantProgress = (profile?.progress ?? []).filter(
    (p) => p.subject.toLowerCase() === subject.toLowerCase(),
  );

  const relevantQuizzes = (profile?.recentQuizzes ?? []).filter(
    (q) => q.subject.toLowerCase() === subject.toLowerCase(),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={back} style={s.headerBtn}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>{subject} Mastery</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.mastery}>
          <View style={s.masteryRing}>
            <Text style={s.masteryText}>{masteryPercentage}%</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.masterySub}>Overall Syllabus Mastery</Text>
            <Text style={s.masteryTitle}>
              {masteryPercentage >= 80
                ? 'Mastery Achieved'
                : masteryPercentage >= 60
                ? 'Steadily Improving'
                : 'Needs Focus'}
            </Text>
            <Text
              style={
                masteryPercentage >= 60
                  ? s.green
                  : { color: theme.colors.amber, fontWeight: '700' }
              }
            >
              {relevantQuizzes.length} quiz attempt{relevantQuizzes.length === 1 ? '' : 's'} recorded
            </Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Topic Breakdown</Text>
        {relevantProgress.length > 0 ? (
          relevantProgress.map((item) => {
            const state =
              item.percentage >= 80
                ? 'Mastered'
                : item.percentage >= 60
                ? 'Good'
                : 'Needs revision';
            const color =
              item.percentage >= 80
                ? '#16A34A'
                : item.percentage >= 60
                ? '#2563EB'
                : '#DC2626';
            return (
              <View key={item.topic} style={s.topicRow}>
                <View style={s.subjectHeader}>
                  <Text style={s.subjectName}>{item.topic}</Text>
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
                          width: `${item.percentage}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.scoreLabel}>{item.percentage}%</Text>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[s.chartCard, { alignItems: 'center', padding: 20 }]}>
            <Text style={{ color: theme.colors.secondary, fontSize: 13, textAlign: 'center' }}>
              No topic attempts recorded for {subject} yet. Take a quiz to generate grounded mastery stats.
            </Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Recent Quiz Attempts</Text>
        {relevantQuizzes.length > 0 ? (
          relevantQuizzes.map((item) => {
            const dateStr = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recent';
            return (
              <View style={s.quizRow} key={item.quizId}>
                <HelpCircle size={18} color={theme.colors.secondary} />
                <Text style={s.quizRowText}>
                  {`${item.topic} · ${item.percentage}% (${item.score}/${item.total}) · ${dateStr}`}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={[s.chartCard, { alignItems: 'center', padding: 16 }]}>
            <Text style={{ color: theme.colors.secondary, fontSize: 13 }}>
              No quiz attempts recorded for {subject} yet.
            </Text>
          </View>
        )}

        <Pressable style={s.primary} onPress={() => router.push('/quiz')}>
          <Target size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Take {subject} Quiz</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function WeakTopics({
  back,
  profile,
}: {
  back: () => void;
  profile: LearningProfile | null;
}) {
  const weakTopics = profile?.weakTopics ?? [];

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
            <Text style={s.profileTitle}>
              {weakTopics.length > 0
                ? `${weakTopics.length} Core Concept${weakTopics.length === 1 ? '' : 's'} Need Focus`
                : 'All Tested Concepts Above 60%'}
            </Text>
            <Text style={s.profileBody}>
              {weakTopics.length > 0
                ? 'Identified by your learning pattern across recorded grounded quiz sessions.'
                : 'Great performance! None of your tested topics fall below the 60% mastery threshold.'}
            </Text>
          </View>
        </View>

        {weakTopics.length > 0 ? (
          weakTopics.map((item) => {
            const recommendation = profile?.recommendations?.find(
              (r) => r.topic === item.topic,
            );
            return (
              <View style={s.weakCard} key={`${item.subject}-${item.topic}`}>
                <View style={s.weakHeader}>
                  <View
                    style={[s.weakIcon, { backgroundColor: `${theme.colors.red}18` }]}
                  >
                    <Target size={22} color={theme.colors.red} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.weakTitle}>{item.topic}</Text>
                    <Text style={s.weakMeta}>
                      {`${item.subject} · Recorded score: ${item.percentage}% (${item.attempts} attempt${item.attempts === 1 ? '' : 's'})`}
                    </Text>
                  </View>
                </View>

                <View style={s.mistake}>
                  <CircleAlert size={16} color="#B45309" />
                  <Text style={s.mistakeText}>
                    {recommendation?.reason ??
                      `Scored ${item.percentage}% in quizzes for this topic.`}
                  </Text>
                </View>

                <View style={s.weakActions}>
                  <Pressable
                    style={s.practiseAction}
                    onPress={() => router.push('/quiz')}
                  >
                    <Target size={14} color="#FFFFFF" />
                    <Text style={s.practiseActionText}>Practise Quiz</Text>
                  </Pressable>

                  <Pressable
                    style={s.aiAction}
                    onPress={() => router.push('/(tabs)/tutor')}
                  >
                    <Bot size={14} color={theme.colors.violet} />
                    <Text style={s.aiActionText}>Ask AI Tutor</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[s.chartCard, { alignItems: 'center', padding: 24 }]}>
            <Check size={32} color={theme.colors.green} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
              No Weak Topics
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.secondary,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              All of your tested topics are above 60% mastery. Keep taking quizzes to reinforce your knowledge!
            </Text>
          </View>
        )}

        <Pressable
          style={s.primary}
          onPress={() => router.push('/quiz')}
        >
          <Target size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Take Practice Quiz</Text>
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
