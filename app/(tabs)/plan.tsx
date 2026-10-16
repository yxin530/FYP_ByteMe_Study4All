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
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Headphones,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';

type Task = {
  title: string;
  subject: string;
  duration: string;
  state: 'done' | 'progress' | 'todo';
  isQuiz?: boolean;
};

const initialTasks: Task[] = [
  {
    title: 'Read Chapter 3 quadratics notes',
    subject: 'Mathematics',
    duration: '30 min',
    state: 'done',
  },
  {
    title: 'Mean & median exercises',
    subject: 'Statistics',
    duration: '25 min',
    state: 'done',
  },
  {
    title: 'Python loops practice quiz',
    subject: 'Programming',
    duration: '20 min',
    state: 'progress',
    isQuiz: true,
  },
  {
    title: 'Revise quadratic equations',
    subject: 'Mathematics',
    duration: '45 min',
    state: 'todo',
    isQuiz: true,
  },
];

export default function Plan() {
  const [tasks, setTasks] = useState(initialTasks);
  const [day, setDay] = useState('Mon');
  const [details, setDetails] = useState<Task | null>(null);
  const [rebalance, setRebalance] = useState(false);
  const [empty, setEmpty] = useState(false);

  if (details) {
    return (
      <TaskDetails
        task={details}
        close={() => setDetails(null)}
        complete={() => {
          setTasks(
            tasks.map((t) =>
              t.title === details.title ? { ...t, state: 'done' } : t
            )
          );
          setDetails(null);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Study Plan</Text>
          <Text style={s.sub}>AI Adaptive Schedule</Text>
        </View>
        <Pressable
          accessibilityLabel="Adjust study plan"
          style={s.headerButton}
          onPress={() => setRebalance(true)}
        >
          <SlidersHorizontal size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Selector */}
        <View style={s.weekTitle}>
          <Text style={s.sectionTitle}>This week · 5–11 Oct</Text>
          <View style={s.arrows}>
            <Pressable style={s.arrowBtn}>
              <ChevronLeft size={18} color={theme.colors.secondary} />
            </Pressable>
            <Pressable style={s.arrowBtn}>
              <ChevronRight size={18} color={theme.colors.secondary} />
            </Pressable>
          </View>
        </View>

        {/* Day Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.daysRow}
        >
          {[
            ['Mon', '5'],
            ['Tue', '6'],
            ['Wed', '7'],
            ['Thu', '8'],
            ['Fri', '9'],
            ['Sat', '10'],
            ['Sun', '11'],
          ].map(([name, date]) => (
            <Pressable
              key={name}
              onPress={() => {
                setDay(name);
                setEmpty(name === 'Sun');
              }}
              style={[s.day, day === name && s.daySelected]}
            >
              <Text style={[s.dayName, day === name && s.dayNameActive]}>
                {name}
              </Text>
              <Text style={[s.dayNumber, day === name && s.dayNumberActive]}>
                {date}
              </Text>
              <View style={[s.dayDot, day === name && s.dayDotActive]} />
            </Pressable>
          ))}
        </ScrollView>

        {empty ? (
          <EmptyDay
            addTask={() => setEmpty(false)}
            planAI={() => setRebalance(true)}
          />
        ) : (
          <>
            {/* Daily summary */}
            <View style={s.summary}>
              <View>
                <Text style={s.summaryTitle}>Today · Monday</Text>
                <Text style={s.summarySub}>
                  3 of 5 done · 2h 20m planned · 45m left
                </Text>
              </View>
              <View style={s.ring}>
                <Text style={s.ringText}>60%</Text>
              </View>
            </View>

            {/* AI Rebalance card */}
            <Pressable
              style={s.rebalanceCard}
              onPress={() => setRebalance(true)}
            >
              <Sparkles size={20} color={theme.colors.violet} />
              <View style={{ flex: 1 }}>
                <Text style={s.rebalanceTitle}>
                  You missed 2 tasks last weekend.
                </Text>
                <Text style={s.rebalanceSub}>
                  Let the AI Study Planner rebalance your remaining week?
                </Text>
              </View>
              <Text style={s.review}>Review</Text>
            </Pressable>

            {/* Task list */}
            <Text style={s.tasksHeading}>Today's Schedule</Text>
            {tasks.map((task) => (
              <TaskCard
                key={task.title}
                task={task}
                onPress={() => setDetails(task)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {rebalance && (
        <Rebalance
          close={() => setRebalance(false)}
          accept={() => setRebalance(false)}
        />
      )}
    </SafeAreaView>
  );
}

function TaskCard({ task, onPress }: { task: Task; onPress: () => void }) {
  return (
    <Pressable style={s.task} onPress={onPress}>
      <View style={[s.check, task.state === 'done' && s.checkDone]}>
        {task.state === 'done' ? <Check size={14} color="#fff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.taskTitle, task.state === 'done' && s.strike]}>
          {task.title}
        </Text>
        <View style={s.taskMeta}>
          <Clock3 size={13} color={theme.colors.secondary} />
          <Text style={s.taskMetaText}>
            {task.subject} · {task.duration}
          </Text>
        </View>
      </View>
      <Text
        style={[
          s.pill,
          task.state === 'done'
            ? s.donePill
            : task.state === 'progress'
            ? s.progressPill
            : s.todoPill,
        ]}
      >
        {task.state === 'done'
          ? 'Done'
          : task.state === 'progress'
          ? 'In progress'
          : 'To do'}
      </Text>
    </Pressable>
  );
}

function EmptyDay({
  addTask,
  planAI,
}: {
  addTask: () => void;
  planAI: () => void;
}) {
  return (
    <View style={s.emptyContainer}>
      <View style={s.emptyIcon}>
        <CalendarDays size={40} color={theme.colors.blue} />
      </View>
      <Text style={s.emptyTitle}>Rest Day or Revision</Text>
      <Text style={s.emptyBody}>
        No formal assignments scheduled for Sunday. Take a break or add a short review session.
      </Text>
      <View style={s.emptyButtons}>
        <Pressable style={s.outlineButton} onPress={addTask}>
          <Text style={s.outlineText}>＋ Add Custom Task</Text>
        </Pressable>
        <Pressable style={s.aiButton} onPress={planAI}>
          <Sparkles size={16} color="#fff" />
          <Text style={s.aiButtonText}>AI Rebalance</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TaskDetails({
  task,
  close,
  complete,
}: {
  task: Task;
  close: () => void;
  complete: () => void;
}) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={close} style={s.headerButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>Task Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.detailTagRow}>
          <Text style={s.tag}>{task.subject}</Text>
          <Text style={s.detailDuration}>{task.duration}</Text>
        </View>

        <Text style={s.detailTitle}>{task.title}</Text>

        <View style={s.metaBox}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Scheduled Time</Text>
            <Text style={s.metaVal}>Today, 8:00 pm</Text>
          </View>
          <View style={s.metaDivider} />
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Planned by</Text>
            <Text style={s.metaVal}>AI Adaptive Study Engine</Text>
          </View>
        </View>

        <View style={s.why}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sparkles size={16} color={theme.colors.violet} />
            <Text style={s.whyTitle}>Why this task was scheduled?</Text>
          </View>
          <Text style={s.whyBody}>
            You scored 2/4 on factorising in your last quiz. A focused review now will solidify foundational algebra before exams.
          </Text>
        </View>

        <Text style={s.sectionTitle}>Checklist Steps</Text>
        {[
          'Re-read Chapter 3 notes, pages 10–14',
          'Ask the AI Tutor 2 clarifying questions',
          'Complete 5-minute practice quiz',
        ].map((step, i) => (
          <Pressable
            key={step}
            style={s.step}
            onPress={i === 0 ? complete : undefined}
          >
            <View style={[s.box, i === 0 && s.boxDone]}>
              {i === 0 ? <Check size={14} color="#fff" /> : null}
            </View>
            <Text style={[s.stepText, i === 0 && s.strike]}>{step}</Text>
          </Pressable>
        ))}

        {/* Action CTAs */}
        <View style={{ gap: 10, marginTop: 24 }}>
          <Pressable
            style={s.primaryAction}
            onPress={() => router.push('/(tabs)/tutor')}
          >
            <Bot size={18} color="#FFFFFF" />
            <Text style={s.primaryActionText}>Start with AI Tutor</Text>
          </Pressable>

          <Pressable
            style={s.quizAction}
            onPress={() => router.push('/quiz')}
          >
            <Target size={18} color={theme.colors.blue} />
            <Text style={s.quizActionText}>Launch Practice Quiz</Text>
          </Pressable>

          <Pressable
            style={s.podcastAction}
            onPress={() => router.push('/learn')}
          >
            <Headphones size={18} color={theme.colors.amber} />
            <Text style={s.podcastActionText}>Listen to Audio Lesson</Text>
          </Pressable>

          <Pressable style={s.completeButton} onPress={complete}>
            <Check size={18} color={theme.colors.green} />
            <Text style={s.completeText}>Mark Task as Complete</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Rebalance({
  close,
  accept,
}: {
  close: () => void;
  accept: () => void;
}) {
  return (
    <View style={s.backdrop}>
      <Pressable style={s.dismiss} onPress={close} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.sheetTitleRow}>
          <Sparkles size={20} color={theme.colors.violet} />
          <View>
            <Text style={s.sheetTitle}>Rebalance Your Week</Text>
            <Text style={s.sheetSub}>Optimized by AI Study Planner</Text>
          </View>
        </View>
        <Text style={s.sheetBody}>
          2 tasks missed over the weekend will be evenly redistributed across Wednesday and Thursday.
        </Text>

        {[
          ['English essay outline', 'English · 20 min', 'Move to Wed'],
          ['Probability practice', 'Statistics · 30 min', 'Move to Thu'],
        ].map(([title, meta, move]) => (
          <View style={s.moveCard} key={title}>
            <View>
              <Text style={s.taskTitle}>{title}</Text>
              <Text style={s.taskMetaText}>{meta}</Text>
            </View>
            <Text style={s.movePill}>{move}</Text>
          </View>
        ))}

        <View style={s.warning}>
          <Text style={s.warningText}>
            Wednesday will total 2h 10m of study (within your 2.5h maximum preference).
          </Text>
        </View>

        <Pressable style={s.aiButtonFull} onPress={accept}>
          <Text style={s.aiButtonText}>Accept New Schedule</Text>
        </Pressable>
        <Pressable style={s.cancelButton} onPress={close}>
          <Text style={s.cancelText}>Keep Current Schedule</Text>
        </Pressable>
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
  sub: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  headerButton: {
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
  weekTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  arrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  day: {
    width: 48,
    height: 68,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  dayNameActive: {
    color: '#E0F2FE',
  },
  dayNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 2,
  },
  dayNumberActive: {
    color: '#FFFFFF',
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'transparent',
    marginTop: 4,
  },
  dayDotActive: {
    backgroundColor: '#FFFFFF',
  },
  summary: {
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    ...theme.shadows.card,
  },
  summaryTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: theme.colors.text,
  },
  summarySub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 3,
  },
  ring: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 4,
    borderColor: theme.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.greenSoft,
  },
  ringText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.green,
  },
  rebalanceCard: {
    padding: 14,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  rebalanceTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: theme.colors.text,
  },
  rebalanceSub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  review: {
    fontWeight: '700',
    color: theme.colors.violet,
    fontSize: 13,
  },
  tasksHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  task: {
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
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  taskMetaText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  taskTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.text,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: theme.colors.muted,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    fontSize: 11,
    fontWeight: '700',
  },
  donePill: {
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  progressPill: {
    color: theme.colors.amber,
    backgroundColor: theme.colors.amberSoft,
  },
  todoPill: {
    color: theme.colors.secondary,
    backgroundColor: theme.colors.bg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  emptyBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    lineHeight: 19,
    fontSize: 13,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  outlineButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 13,
  },
  aiButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  aiButtonFull: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  aiButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  detailTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.blueLight,
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 12,
  },
  detailDuration: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 16,
  },
  metaBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: theme.colors.secondary,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  metaDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  why: {
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    marginBottom: 20,
  },
  whyTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: theme.colors.text,
  },
  whyBody: {
    fontSize: 13,
    color: theme.colors.secondary,
    lineHeight: 19,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  box: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: theme.colors.muted,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: {
    backgroundColor: theme.colors.green,
    borderColor: theme.colors.green,
  },
  stepText: {
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
  },
  primaryAction: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  quizAction: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quizActionText: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
  podcastAction: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.amberSoft,
    borderWidth: 1,
    borderColor: theme.colors.amberBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  podcastActionText: {
    color: theme.colors.amber,
    fontWeight: '700',
    fontSize: 14,
  },
  completeButton: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.greenBorder,
    backgroundColor: theme.colors.greenSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeText: {
    color: theme.colors.green,
    fontWeight: '700',
    fontSize: 14,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,.45)',
    justifyContent: 'flex-end',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    padding: 20,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.borderDark,
    marginBottom: 14,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sheetSub: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  sheetBody: {
    marginTop: 12,
    color: theme.colors.secondary,
    lineHeight: 18,
    fontSize: 13,
  },
  moveCard: {
    marginTop: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  movePill: {
    color: theme.colors.violet,
    backgroundColor: theme.colors.violetSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    fontSize: 11,
    fontWeight: '700',
  },
  warning: {
    marginTop: 14,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.amberSoft,
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
  },
  cancelButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
});
