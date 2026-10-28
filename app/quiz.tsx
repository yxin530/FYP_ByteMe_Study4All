import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BarChart3,
  Bot,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Code2,
  FileQuestion,
  Home,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { materialsApi, quizApi, type QuizGenerationResponse, type QuizSubmissionResponse } from '@/lib/api';

type Screen =
  | 'subjects'
  | 'topics'
  | 'question'
  | 'selected'
  | 'confirm'
  | 'marking'
  | 'results'
  | 'review';

export default function Quiz() {
  const [screen, setScreen] = useState<Screen>('subjects');
  const [answer, setAnswer] = useState('x = 4 and x = −1');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Quadratic equations');
  const [questions, setQuestions] = useState('10 questions');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [quiz, setQuiz] = useState<QuizGenerationResponse | null>(null);
  const [submission, setSubmission] = useState<QuizSubmissionResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const startQuiz = async () => {
    setBusy(true); setError(null);
    try {
      const materials = await materialsApi.list();
      const ready = materials.filter((material) => material.processing_status === 'ready');
      if (!ready.length) throw new Error('Upload and process relevant learning material before starting a quiz.');
      const generated = await quizApi.generate({
        subject: selectedSubject,
        topic,
        materialIds: ready.map((material) => material.id),
        difficulty: difficulty === 'Easy' || difficulty === 'Hard' ? difficulty.toLowerCase() as 'easy' | 'hard' : 'medium',
        questionCount: Number.parseInt(questions, 10) || 10,
      });
      setQuiz(generated); setCurrentIndex(0); setAnswersByQuestion({}); setScreen('question');
    } catch (caught: any) { setError(caught?.message ?? 'Unable to generate the quiz.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    if (!quiz) return;
    setBusy(true); setError(null);
    try {
      const result = await quizApi.submit(quiz.quizId, Object.entries(answersByQuestion).map(([questionId, answer]) => ({ questionId, answer })));
      setSubmission(result); setScreen('results');
    } catch (caught: any) { setError(caught?.message ?? 'Unable to submit the quiz.'); }
    finally { setBusy(false); }
  };

  if (busy) return <CenterState title="Preparing your grounded quiz…" body="Retrieving your selected material and saving the quiz session." loading />;
  if (error) return <CenterState title="Quiz unavailable" body={error} onDone={() => { setError(null); setScreen('topics'); }} />;

  if (screen === 'subjects') {
    return (
      <SubjectScreen
        selectedSubject={selectedSubject}
        onSelectSubject={(s) => setSelectedSubject(s)}
        onContinue={() => setScreen('topics')}
        onClose={() => router.back()}
      />
    );
  }

  if (screen === 'topics') {
    return (
      <TopicScreen
        subject={selectedSubject}
        topic={topic}
        setTopic={setTopic}
        questions={questions}
        setQuestions={setQuestions}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        onBack={() => setScreen('subjects')}
        onStart={startQuiz}
      />
    );
  }

  if (screen === 'marking') {
    return (
      <CenterState
        title="Marking your answers…"
        body="The AI is checking your answers against grounded lecture notes and preparing step-by-step explanations."
        loading
        onDone={() => setScreen('results')}
      />
    );
  }

  if (screen === 'results') {
    return (
      <Results
        onReview={() => setScreen('review')}
        onDone={() => router.replace('/(tabs)/home')}
        onRetake={() => { setSubmission(null); setCurrentIndex(0); setScreen('question'); }}
        percentage={submission?.percentage ?? 0}
        score={submission?.score ?? 0}
        total={submission?.total ?? quiz?.questions.length ?? 0}
      />
    );
  }

  if (screen === 'review') {
    return (
      <Review
        onBack={() => setScreen('results')}
        onDone={() => router.replace('/(tabs)/home')}
        quiz={quiz}
        answers={answersByQuestion}
      />
    );
  }

  return (
    <QuestionScreen
      screen={screen}
      topic={topic}
      question={quiz?.questions[currentIndex]}
      questionNumber={currentIndex + 1}
      totalQuestions={quiz?.questions.length ?? 0}
      answer={quiz ? answersByQuestion[quiz.questions[currentIndex]?.id] ?? '' : answer}
      setAnswer={(value) => { if (quiz?.questions[currentIndex]) setAnswersByQuestion((previous) => ({ ...previous, [quiz.questions[currentIndex].id]: value })); else setAnswer(value); }}
      onNext={() => { if (!quiz) return; if (currentIndex >= quiz.questions.length - 1) setScreen('confirm'); else { setCurrentIndex((index) => index + 1); setScreen('question'); } }}
      onCancel={() => setScreen('topics')}
      onKeepGoing={() => setScreen('question')}
      onSubmit={submit}
    />
  );
}

function Header({
  title,
  close = false,
  onBack,
}: {
  title: string;
  close?: boolean;
  onBack?: () => void;
}) {
  return (
    <View style={s.header}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={s.back}
        accessibilityLabel={close ? 'Close quiz' : 'Go back'}
      >
        {close ? (
          <X size={22} color={theme.colors.text} />
        ) : (
          <ChevronLeft size={24} color={theme.colors.text} />
        )}
      </Pressable>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function SubjectScreen({
  selectedSubject,
  onSelectSubject,
  onContinue,
  onClose,
}: {
  selectedSubject: string;
  onSelectSubject: (name: string) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const subjects = [
    ['Mathematics', '14 topics', '68%', Target, '#2563EB'],
    ['Programming', '10 topics', '54%', Code2, '#7C3AED'],
    ['Statistics', '8 topics', '81%', BarChart3, '#16A34A'],
    ['English', '9 topics', '42%', FileQuestion, '#D97706'],
  ] as const;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="Practice Quiz" close onBack={onClose} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.heroTitle}>What do you want to practise?</Text>
        <Text style={s.subtitle}>Pick a subject to customize topics and difficulty.</Text>

        <View style={s.subjectGrid}>
          {subjects.map(([name, count, score, Icon, color]) => (
            <Pressable
              key={name}
              onPress={() => {
                onSelectSubject(name);
                onContinue();
              }}
              style={[
                s.subjectCard,
                selectedSubject === name && s.subjectSelected,
              ]}
            >
              <View style={[s.subjectIcon, { backgroundColor: `${color}18` }]}>
                <Icon size={24} color={color} />
              </View>
              <Text style={s.subjectName}>{name}</Text>
              <View style={s.subjectMeta}>
                <Text style={s.metaText}>{count}</Text>
                <Text style={{ color, fontWeight: '700' }}>{score}</Text>
              </View>
              <View style={s.miniBar}>
                <View
                  style={[
                    s.miniFill,
                    { width: score as `${number}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={s.recommend}>
          <Sparkles size={20} color={theme.colors.violet} />
          <View style={{ flex: 1 }}>
            <Text style={s.recommendLabel}>AI ADAPTIVE RECOMMENDATION</Text>
            <Text style={s.recommendTitle}>Suggested: Quadratic equations</Text>
            <Text style={s.recommendBody}>
              Based on your recent scores, this topic has the highest room for score improvement.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TopicScreen({
  subject,
  topic,
  setTopic,
  questions,
  setQuestions,
  difficulty,
  setDifficulty,
  onBack,
  onStart,
}: {
  subject: string;
  topic: string;
  setTopic: (v: string) => void;
  questions: string;
  setQuestions: (v: string) => void;
  difficulty: string;
  setDifficulty: (v: string) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const topics = [
    ['Quadratic equations', 'Last score 58%', 'Needs revision'],
    ['Functions & graphs', 'Last score 74%', 'Good'],
    ['Linear equations', 'Last score 90%', 'Mastered'],
    ['Indices & surds', 'Not attempted yet', 'New'],
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title={subject} onBack={onBack} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionTitle}>Select a Topic</Text>
        {topics.map(([name, score, badge]) => (
          <Pressable
            key={name}
            style={[s.topic, topic === name && s.topicSelected]}
            onPress={() => setTopic(name)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.topicName}>{name}</Text>
              <Text style={s.topicScore}>{score}</Text>
              {badge ? (
                <Text
                  style={[
                    s.badge,
                    badge === 'Needs revision'
                      ? s.badgeRevision
                      : s.badgeMastered,
                  ]}
                >
                  {badge}
                </Text>
              ) : null}
            </View>
            {topic === name ? (
              <Check size={22} color={theme.colors.blue} />
            ) : (
              <View style={s.radio} />
            )}
          </Pressable>
        ))}

        <Choice
          title="Number of questions"
          values={['5 questions', '10 questions', '15 questions']}
          selected={questions}
          onSelect={setQuestions}
        />
        <Choice
          title="Difficulty"
          values={['Easy', 'Mixed', 'Hard']}
          selected={difficulty}
          onSelect={setDifficulty}
        />

        <Pressable style={s.primary} onPress={onStart}>
          <Target size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Start Quiz</Text>
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
      <Text style={s.choiceTitle}>{title}</Text>
      <View style={s.choiceRow}>
        {values.map((value) => (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[s.choice, selected === value && s.choiceSelected]}
          >
            <Text style={[s.choiceText, selected === value && s.choiceTextActive]}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function QuestionScreen({
  screen,
  topic,
  question,
  questionNumber,
  totalQuestions,
  answer,
  setAnswer,
  onNext,
  onCancel,
  onKeepGoing,
  onSubmit,
}: {
  screen: Screen;
  topic: string;
  question?: { id: string; question: string; options: string[]; difficulty: 'easy' | 'medium' | 'hard' };
  questionNumber: number;
  totalQuestions: number;
  answer: string;
  setAnswer: (v: string) => void;
  onNext: () => void;
  onCancel: () => void;
  onKeepGoing: () => void;
  onSubmit: () => void;
}) {
  const confirmed = screen === 'confirm';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title={topic} close onBack={onCancel} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.questionHeader}>
          <Text style={s.sectionTitle}>
            Question {questionNumber} of {totalQuestions}
          </Text>
          <Text style={s.diffPill}>Mixed difficulty</Text>
        </View>

        <View style={s.progress}>
          <View
            style={[
              s.progressFill,
              { width: screen === 'confirm' ? '100%' : '30%' },
            ]}
          />
        </View>

        <View style={s.questionCard}>
          <Text style={s.questionLabel}>
            QUESTION {screen === 'confirm' ? '10' : '3'}
          </Text>
          <Text style={s.questionTitle}>
            {question?.question ?? 'No question is loaded.'}
          </Text>
        </View>

        {(question?.options ?? []).map((item, i) => (
          <Pressable
            key={item}
            style={[s.answerOption, answer === item && s.answerSelected]}
            onPress={() => setAnswer(item)}
          >
            <Text
              style={[
                s.answerLetter,
                answer === item && s.answerLetterSelected,
              ]}
            >
              {String.fromCharCode(65 + i)}
            </Text>
            <Text style={s.answerText}>{item}</Text>
          </Pressable>
        ))}

        <View style={s.answerFooter}>
          <View style={s.dots}>
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                i < questionNumber - 1 && s.dotActive,
                ]}
              />
            ))}
          </View>
          <Text style={s.metaText}>
            {questionNumber - 1} of {totalQuestions} answered
          </Text>
        </View>

        <View style={s.buttonRow}>
          <Pressable style={s.secondaryButton} onPress={onCancel}>
            <Text style={s.secondaryButtonText}>Back to Topics</Text>
          </Pressable>
          <Pressable
            style={s.primarySmall}
            onPress={confirmed ? onSubmit : onNext}
          >
            <Text style={s.primaryText}>{confirmed ? 'Submit' : 'Next'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {confirmed && (
        <View style={s.modalBackdrop}>
          <View style={s.modal}>
            <View style={s.modalIcon}>
              <CircleAlert size={26} color={theme.colors.blue} />
            </View>
            <Text style={s.modalTitle}>Submit your quiz?</Text>
            <Text style={s.modalBody}>
              You've answered all questions. You cannot change your answers after submitting.
            </Text>
            <View style={s.buttonRow}>
              <Pressable style={s.secondaryButton} onPress={onKeepGoing}>
                <Text style={s.secondaryButtonText}>Review again</Text>
              </Pressable>
              <Pressable style={s.primarySmall} onPress={onSubmit}>
                <Text style={s.primaryText}>Confirm & Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function CenterState({
  title,
  body,
  loading,
  onDone,
}: {
  title: string;
  body: string;
  loading?: boolean;
  onDone?: () => void;
}) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="" close />
      <View style={s.center}>
        {loading && (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="large" color={theme.colors.blue} />
          </View>
        )}
        <Text style={s.centerTitle}>{title}</Text>
        <Text style={s.centerBody}>{body}</Text>
        {onDone ? (
          <Pressable style={s.primary} onPress={onDone}>
            <Text style={s.primaryText}>View Results</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Results({
  onReview,
  onDone,
  onRetake,
  percentage,
  score,
  total,
}: {
  onReview: () => void;
  onDone: () => void;
  onRetake: () => void;
  percentage: number;
  score: number;
  total: number;
}) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="Quiz Results" close onBack={onDone} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.scoreCircle}>
          <Text style={s.scoreText}>{percentage}%</Text>
          <Text style={s.scoreSub}>{score} of {total} correct</Text>
        </View>

        <Text style={s.resultsTitle}>Good effort, Aina!</Text>
        <Text style={s.subtitle}>
          You're improving on quadratics. Focus on factorising signs to push past 80%.
        </Text>

        <View style={s.statRow}>
          {[
            ['8m 12s', 'Time taken', Clock3],
            [String(score), 'Correct', Check],
            [String(Math.max(0, total - score)), 'Incorrect', X],
          ].map(([value, label, Icon]) => {
            const StatIcon = Icon as React.ComponentType<{
              size?: number;
              color?: string;
            }>;
            return (
              <View style={s.stat} key={String(label)}>
                <StatIcon size={16} color={theme.colors.secondary} />
                <Text style={s.statValue}>{String(value)}</Text>
                <Text style={s.metaText}>{String(label)}</Text>
              </View>
            );
          })}
        </View>

        <Text style={s.sectionTitle}>Breakdown by sub-topic</Text>
        {[
          ['Factorising', '2/4', '#DC2626'],
          ['Quadratic formula', '3/3', '#16A34A'],
          ['Graphs of quadratics', '2/3', '#D97706'],
        ].map(([name, score, color]) => (
          <View key={name} style={s.topicScoreItem}>
            <View style={s.subjectMeta}>
              <Text style={s.breakdownName}>{name}</Text>
              <Text style={{ color, fontWeight: '700' }}>{score}</Text>
            </View>
            <View style={s.miniBar}>
              <View
                style={[
                  s.miniFill,
                  {
                    width: score === '3/3' ? '100%' : '60%',
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        <Pressable style={s.primary} onPress={onReview}>
          <Sparkles size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Review Answers & AI Explanations</Text>
        </Pressable>

        <Pressable style={s.secondary} onPress={onRetake}>
          <RotateCcw size={18} color={theme.colors.blue} />
          <Text style={s.secondaryText}>Retake Quiz</Text>
        </Pressable>

        <Pressable style={s.outlineHomeButton} onPress={onDone}>
          <Home size={18} color={theme.colors.secondary} />
          <Text style={s.outlineHomeText}>Return to Home Dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Review({
  onBack,
  onDone,
  quiz,
  answers,
}: {
  onBack: () => void;
  onDone: () => void;
  quiz: QuizGenerationResponse | null;
  answers: Record<string, string>;
}) {
  const [reviewIndex, setReviewIndex] = useState(0);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanations, setExplanations] = useState<
    Record<string, { explanation: string; correctAnswer: string; sourceReferences: unknown[] }>
  >({});

  const questionsList = quiz?.questions ?? [];
  const currentQuestion = questionsList[reviewIndex];

  useEffect(() => {
    if (!quiz?.quizId || !currentQuestion?.id) return;
    if (explanations[currentQuestion.id]) return;

    let active = true;
    setLoadingExplanation(true);
    quizApi
      .explain(quiz.quizId, currentQuestion.id)
      .then((res) => {
        if (active) {
          setExplanations((prev) => ({
            ...prev,
            [currentQuestion.id]: {
              explanation: res.explanation,
              correctAnswer: res.correctAnswer,
              sourceReferences: res.sourceReferences ?? [],
            },
          }));
        }
      })
      .catch((err) => {
        console.warn('Failed to load grounded explanation', err);
      })
      .finally(() => {
        if (active) setLoadingExplanation(false);
      });

    return () => {
      active = false;
    };
  }, [quiz?.quizId, currentQuestion?.id, explanations]);

  const currentExplanation = currentQuestion ? explanations[currentQuestion.id] : null;
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header title="Review Answers" onBack={onBack} />
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.questionHeader}>
          <Text style={s.sectionTitle}>
            Question {reviewIndex + 1} of {questionsList.length || 0}
          </Text>
          <Text style={s.badgeRevision}>Review</Text>
        </View>

        <View style={s.questionCard}>
          <Text style={s.questionTitle}>{currentQuestion?.question ?? 'No question available.'}</Text>
          <Text style={s.metaText}>Topic: {quiz?.topic}</Text>
        </View>

        {(currentQuestion?.options ?? []).map((item, i) => {
          const isCorrect = currentExplanation?.correctAnswer === item;
          const isUserChoice = userAnswer === item;
          const isWrongChoice = isUserChoice && currentExplanation && !isCorrect;

          return (
            <View
              key={item}
              style={[
                s.answerOption,
                isCorrect && s.correct,
                isWrongChoice && s.wrong,
              ]}
            >
              <Text style={s.answerLetter}>{String.fromCharCode(65 + i)}</Text>
              <Text style={s.answerText}>{item}</Text>
              {isCorrect && <Check size={20} color={theme.colors.green} />}
              {isWrongChoice && <X size={20} color="#DC2626" />}
            </View>
          );
        })}

        {/* Grounded Explanation Box */}
        <View style={s.explanation}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkles size={16} color={theme.colors.violet} />
            <Text style={s.recommendLabel}>AI STEP-BY-STEP EXPLANATION</Text>
          </View>
          {loadingExplanation && !currentExplanation ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <ActivityIndicator size="small" color={theme.colors.violet} />
              <Text style={s.explanationText}>Retrieving grounded explanation from your material…</Text>
            </View>
          ) : (
            <>
              <Text style={s.explanationText}>
                {currentExplanation?.explanation ??
                  'This answer is derived directly from your grounded course materials.'}
              </Text>
              {currentExplanation?.correctAnswer ? (
                <Text style={[s.explanationSource, { marginTop: 6, color: theme.colors.text }]}>
                  Grounded answer: {currentExplanation.correctAnswer}
                </Text>
              ) : null}
              <Text style={s.explanationSource}>
                {currentExplanation?.sourceReferences?.length
                  ? `Source: Verified against ${currentExplanation.sourceReferences.length} passage(s) in uploaded material.`
                  : 'Source references are stored with this quiz.'}
              </Text>
            </>
          )}
        </View>

        {/* Navigation between questions */}
        <View style={s.buttonRow}>
          <Pressable
            style={[s.secondaryButton, reviewIndex === 0 && { opacity: 0.5 }]}
            disabled={reviewIndex === 0}
            onPress={() => setReviewIndex((i) => Math.max(0, i - 1))}
          >
            <Text style={s.secondaryButtonText}>Previous Question</Text>
          </Pressable>
          <Pressable
            style={[
              s.secondaryButton,
              reviewIndex >= questionsList.length - 1 && { opacity: 0.5 },
            ]}
            disabled={reviewIndex >= questionsList.length - 1}
            onPress={() => setReviewIndex((i) => Math.min(questionsList.length - 1, i + 1))}
          >
            <Text style={s.secondaryButtonText}>Next Question</Text>
          </Pressable>
        </View>

        {/* Ask AI Tutor why wrong */}
        <Pressable
          style={s.whyWrongButton}
          onPress={() => router.push('/(tabs)/tutor')}
        >
          <Bot size={18} color={theme.colors.violet} />
          <Text style={s.whyWrongText}>Ask AI Tutor why I got this wrong</Text>
        </Pressable>

        <Pressable style={s.primary} onPress={onDone}>
          <Home size={18} color="#FFFFFF" />
          <Text style={s.primaryText}>Done · Back to Home</Text>
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
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
  },
  back: {
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: theme.colors.text,
    marginTop: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.colors.secondary,
    marginTop: 6,
    lineHeight: 20,
    fontSize: 14,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  subjectCard: {
    width: '48%',
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  subjectSelected: {
    borderColor: theme.colors.blue,
    borderWidth: 2,
  },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: {
    fontWeight: '700',
    fontSize: 15,
    marginTop: 12,
    color: theme.colors.text,
  },
  subjectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    color: theme.colors.secondary,
    fontSize: 12,
  },
  miniBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    overflow: 'hidden',
  },
  miniFill: {
    height: 6,
    borderRadius: 3,
  },
  recommend: {
    marginTop: 20,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    gap: 12,
  },
  recommendLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.violet,
    letterSpacing: 0.8,
  },
  recommendTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.text,
    marginTop: 4,
  },
  recommendBody: {
    marginTop: 4,
    color: theme.colors.secondary,
    lineHeight: 18,
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 8,
  },
  topic: {
    minHeight: 68,
    marginTop: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  topicSelected: {
    borderColor: theme.colors.blue,
    borderWidth: 2,
    backgroundColor: theme.colors.blueLight,
  },
  topicName: {
    fontWeight: '700',
    fontSize: 15,
    color: theme.colors.text,
  },
  topicScore: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeRevision: {
    color: theme.colors.red,
    backgroundColor: theme.colors.redSoft,
  },
  badgeMastered: {
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.muted,
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
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
  primary: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    ...theme.shadows.sm,
  },
  primarySmall: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondary: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  secondaryText: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diffPill: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  progress: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: theme.colors.blue,
    borderRadius: 3,
  },
  questionCard: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: 16,
    ...theme.shadows.card,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.blue,
    letterSpacing: 0.8,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
    marginTop: 6,
    color: theme.colors.text,
  },
  answerOption: {
    minHeight: 56,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  answerSelected: {
    borderColor: theme.colors.blue,
    borderWidth: 2,
    backgroundColor: theme.colors.blueLight,
  },
  answerLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bg,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontWeight: '700',
    color: theme.colors.text,
    lineHeight: 32,
  },
  answerLetterSelected: {
    backgroundColor: theme.colors.blue,
    color: '#FFFFFF',
  },
  answerText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  answerFooter: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  dotActive: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  secondaryButtonText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    padding: 24,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    ...theme.shadows.elevated,
  },
  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 14,
    color: theme.colors.text,
  },
  modalBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loaderWrap: {
    marginBottom: 20,
  },
  centerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  centerBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    marginTop: 10,
    lineHeight: 20,
    fontSize: 14,
  },
  scoreCircle: {
    alignSelf: 'center',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 10,
    borderColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: theme.colors.surface,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.blue,
  },
  scoreSub: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  resultsTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 18,
    color: theme.colors.text,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  stat: {
    flex: 1,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    color: theme.colors.text,
  },
  topicScoreItem: {
    marginTop: 12,
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  outlineHomeButton: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  outlineHomeText: {
    color: theme.colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterActivePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.blue,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.secondary,
    fontSize: 12,
  },
  correct: {
    borderColor: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  wrong: {
    borderColor: theme.colors.red,
    backgroundColor: theme.colors.redSoft,
  },
  explanation: {
    marginTop: 18,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
  },
  explanationText: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  explanationSource: {
    fontSize: 11,
    color: theme.colors.violet,
    fontWeight: '700',
    marginTop: 8,
  },
  whyWrongButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  whyWrongText: {
    color: theme.colors.violet,
    fontWeight: '700',
    fontSize: 14,
  },
});
