import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Bot,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Headphones,
  Library,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Volume2,
  X,
} from 'lucide-react-native';
import { tutorApi } from '@/lib/api';
import { theme } from '@/lib/theme';

type Screen = 'new' | 'thinking' | 'answer' | 'error' | 'practice';

const suggestions = [
  'Explain quadratic equations simply',
  'Quiz me on Python loops',
  'Summarise Chapter 3 – Quadratics.pdf',
  'What should I revise this week?',
];

export default function Tutor() {
  const [screen, setScreen] = useState<Screen>('new');
  const [contextOpen, setContextOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState('Chapter 3 – Quadratics.pdf');
  const [question, setQuestion] = useState('');
  const [copied, setCopied] = useState(false);

  const submit = async (value = draft) => {
    const message = value.trim();
    if (!message) return;
    setDraft('');
    setQuestion(message);
    if (message.toLowerCase().includes('practice') || message.toLowerCase().includes('quiz')) {
      setScreen('practice');
      return;
    }
    setScreen('thinking');
    await tutorApi.sendMessage({
      message,
      materialIds: ['quadratics-chapter-3'],
      context: selected,
    });
    setTimeout(() => setScreen('answer'), 700);
  };

  const newChat = () => {
    setScreen('new');
    setQuestion('');
    setDraft('');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={s.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.headerIconWrap}>
              <Bot size={22} color={theme.colors.violet} />
            </View>
            <View>
              <Text style={s.title}>AI Tutor</Text>
              <Text style={s.headerSub}>Strictly source-grounded answers</Text>
            </View>
          </View>
          <Pressable
            accessibilityLabel="Start a new tutor chat"
            onPress={newChat}
            style={s.newChatButton}
          >
            <Plus size={20} color={theme.colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Material Context Picker Bar */}
          <Pressable
            accessibilityLabel="Choose tutor context"
            style={[s.context, screen !== 'new' && s.contextActive]}
            onPress={() => setContextOpen(true)}
          >
            <FileText size={15} color={theme.colors.violet} />
            <Text style={s.contextText} numberOfLines={1}>
              {screen === 'new'
                ? 'Context: All uploaded subjects'
                : `Using: ${selected}`}
            </Text>
            <ChevronDown size={15} color={theme.colors.violet} />
          </Pressable>

          {screen === 'new' ? (
            <NewChat draft={draft} setDraft={setDraft} onSubmit={submit} />
          ) : (
            <Conversation
              screen={screen}
              question={question}
              copied={copied}
              onCopy={() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              onSubmit={submit}
              onRetry={() => {
                setScreen('thinking');
                setTimeout(() => setScreen('answer'), 700);
              }}
            />
          )}

          {screen !== 'new' && (
            <Composer draft={draft} setDraft={setDraft} submit={() => submit()} />
          )}
        </ScrollView>

        {contextOpen && (
          <ContextSheet
            selected={selected}
            setSelected={(value) => {
              setSelected(value);
              setContextOpen(false);
            }}
            close={() => setContextOpen(false)}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function NewChat({
  draft,
  setDraft,
  onSubmit,
}: {
  draft: string;
  setDraft: (value: string) => void;
  onSubmit: (value?: string) => void;
}) {
  return (
    <>
      <View style={s.hero}>
        <View style={s.sparkle}>
          <Sparkles size={32} color={theme.colors.violet} />
        </View>
        <Text style={s.greeting}>
          Hi Aina, what would you like{`\n`}to learn today?
        </Text>
        <Text style={s.description}>
          Every answer is strictly grounded in your uploaded materials and syllabus notes.
        </Text>
      </View>

      <Text style={s.overline}>SUGGESTED QUESTIONS</Text>
      <View style={s.suggestions}>
        {suggestions.map((item) => (
          <Pressable
            key={item}
            style={s.suggestion}
            onPress={() => onSubmit(item)}
          >
            <Sparkles size={14} color={theme.colors.violet} />
            <Text style={s.suggestionText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Composer draft={draft} setDraft={setDraft} submit={() => onSubmit()} />
    </>
  );
}

function Conversation({
  screen,
  question,
  copied,
  onCopy,
  onSubmit,
  onRetry,
}: {
  screen: Screen;
  question: string;
  copied: boolean;
  onCopy: () => void;
  onSubmit: (value?: string) => void;
  onRetry: () => void;
}) {
  if (screen === 'error') {
    return (
      <View>
        <Bubble text={question} />
        <View style={s.error}>
          <View style={s.errorIcon}>
            <X size={16} color="#fff" />
          </View>
          <Text style={s.errorTitle}>Couldn't reach the AI tutor</Text>
          <Text style={s.errorBody}>
            Your message wasn't sent. Check your internet connection and try again.
          </Text>
          <Pressable style={s.retry} onPress={onRetry}>
            <RefreshCw size={16} color="#fff" />
            <Text style={s.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (screen === 'thinking') {
    return (
      <View>
        <Bubble text={question} />
        <View style={s.thinkingCard}>
          <Sparkles size={18} color={theme.colors.violet} />
          <Text style={s.thinkingText}>Tutor is reading your notes and verifying sources…</Text>
        </View>
      </View>
    );
  }

  if (screen === 'practice') {
    return (
      <View>
        <Bubble text="Generate 5 practice questions" />
        <View style={s.answer}>
          <Text style={s.answerTitle}>Factorising Quadratics Quiz Prep</Text>
          <Text style={s.answerText}>
            Here are 5 practice questions extracted from Chapter 3, ordered by difficulty:
          </Text>
          {[
            'Q1 · Solve x² + 5x + 6 = 0',
            'Q2 · Solve x² − 7x + 10 = 0',
            'Q3 · Solve 2x² + 7x + 3 = 0',
          ].map((item) => (
            <View style={s.questionItem} key={item}>
              <Text style={s.questionItemText}>{item}</Text>
            </View>
          ))}
          <Text style={s.moreQuestionsText}>+ 2 more questions ready in interactive quiz mode</Text>
        </View>

        {/* Start as a quiz CTA -> routes to /quiz */}
        <Pressable style={s.primaryAction} onPress={() => router.push('/quiz')}>
          <Target size={18} color="#FFFFFF" />
          <Text style={s.primaryActionText}>Start Interactive Quiz (5 questions)</Text>
        </Pressable>
        <Text style={s.note}>Step-by-step scoring and explanations appear upon submission.</Text>
      </View>
    );
  }

  return (
    <View>
      <Bubble text={question} />
      <View style={s.answer}>
        <View style={s.answerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color={theme.colors.violet} />
            <Text style={s.answerTitle}>Solve by factorising</Text>
          </View>
          {/* Audio Lesson studio button */}
          <Pressable
            style={s.audioIconBtn}
            onPress={() => router.push('/learn')}
            accessibilityLabel="Listen as audio podcast"
          >
            <Headphones size={16} color={theme.colors.amber} />
            <Text style={s.audioIconText}>Listen</Text>
          </Pressable>
        </View>

        <Text style={s.answerText}>
          1. Find two numbers that multiply to −4 and add to −3: −4 and +1.
          {'\n\n'}
          2. Rewrite equation as (x − 4)(x + 1) = 0.
          {'\n\n'}
          3. Set each bracket to zero: x − 4 = 0 or x + 1 = 0.
        </Text>

        <View style={s.resultBox}>
          <Text style={s.result}>Final Answer: x = 4 or x = −1</Text>
        </View>

        <View style={s.sourceRow}>
          <FileText size={13} color={theme.colors.violet} />
          <Text style={s.source}>Citing: Chapter 3 – Quadratics.pdf (p. 12)</Text>
        </View>
      </View>

      {/* Action buttons under response */}
      <View style={s.actionsBar}>
        <Pressable style={s.actionPill} onPress={onCopy}>
          {copied ? <Check size={14} color={theme.colors.green} /> : <Copy size={14} color={theme.colors.secondary} />}
          <Text style={s.actionPillText}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>

        <Pressable
          style={s.actionPill}
          onPress={() => {
            onRetry();
          }}
        >
          <RefreshCw size={14} color={theme.colors.secondary} />
          <Text style={s.actionPillText}>Regenerate</Text>
        </Pressable>

        <Pressable
          style={[s.actionPill, { backgroundColor: theme.colors.amberSoft, borderColor: theme.colors.amberBorder }]}
          onPress={() => router.push('/learn')}
        >
          <Volume2 size={14} color={theme.colors.amber} />
          <Text style={[s.actionPillText, { color: theme.colors.amber }]}>Audio Podcast</Text>
        </Pressable>
      </View>

      <Text style={s.overline}>SUGGESTED NEXT STEPS</Text>
      <Pressable
        style={s.primaryAction}
        onPress={() => onSubmit('Generate 5 practice questions')}
      >
        <Sparkles size={16} color="#FFFFFF" />
        <Text style={s.primaryActionText}>Generate 5 practice questions</Text>
      </Pressable>

      <View style={s.nextSteps}>
        {[
          'Explain it another way',
          'Show a similar step-by-step example',
          'Give me a harder problem',
        ].map((item) => (
          <Pressable
            key={item}
            style={s.suggestion}
            onPress={() => onSubmit(item)}
          >
            <Sparkles size={14} color={theme.colors.violet} />
            <Text style={s.suggestionText}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Bubble({ text }: { text: string }) {
  return (
    <View style={s.bubble}>
      <Text style={s.bubbleText}>{text}</Text>
    </View>
  );
}

function Composer({
  draft,
  setDraft,
  submit,
}: {
  draft: string;
  setDraft: (value: string) => void;
  submit: () => void;
}) {
  return (
    <View style={s.composer}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={submit}
        placeholder="Ask a question from your notes…"
        placeholderTextColor={theme.colors.muted}
        style={s.input}
        returnKeyType="send"
      />
      <Pressable
        accessibilityLabel="Send question"
        onPress={submit}
        style={[s.sendBtn, !draft.trim() && s.sendBtnDisabled]}
        disabled={!draft.trim()}
      >
        <Send size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function ContextSheet({
  selected,
  setSelected,
  close,
}: {
  selected: string;
  setSelected: (value: string) => void;
  close: () => void;
}) {
  const options = [
    ['All my materials', '4 files across all subjects'],
    ['Chapter 3 – Quadratics.pdf', 'Mathematics · Ready for AI'],
    ['Python Basics – Week 4.pptx', 'Programming · Ready for AI'],
    ['Statistics Lecture 2 – Probability.pdf', 'Statistics · Ready for AI'],
  ];

  return (
    <View style={s.sheetBackdrop}>
      <Pressable style={s.dismiss} onPress={close} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>Select Source Context</Text>
          <Pressable onPress={() => { close(); router.push('/materials'); }}>
            <Text style={s.manageLink}>Manage</Text>
          </Pressable>
        </View>
        <Text style={s.sheetBody}>
          The AI Tutor will strictly ground its teaching to the selected note or deck.
        </Text>

        {options.map(([name, detail]) => (
          <Pressable
            key={name}
            style={[s.material, selected === name && s.materialSelected]}
            onPress={() => setSelected(name)}
          >
            <Library
              size={20}
              color={
                selected === name ? theme.colors.violet : theme.colors.secondary
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={s.materialName}>{name}</Text>
              <Text style={s.materialDetail}>{detail}</Text>
            </View>
            {selected === name ? (
              <Check size={20} color={theme.colors.violet} />
            ) : (
              <View style={s.radio} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  page: {
    flex: 1,
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
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSub: {
    fontSize: 11,
    color: theme.colors.secondary,
  },
  newChatButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  context: {
    alignSelf: 'flex-start',
    height: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  contextActive: {
    backgroundColor: theme.colors.violetSoft,
    borderColor: theme.colors.violetBorder,
  },
  contextText: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 240,
  },
  hero: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  sparkle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.violetSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  greeting: {
    textAlign: 'center',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.secondary,
    paddingHorizontal: 16,
  },
  overline: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '800',
    color: theme.colors.secondary,
  },
  suggestions: {
    gap: 8,
    marginBottom: 20,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  composer: {
    minHeight: 50,
    marginTop: 16,
    paddingLeft: 16,
    paddingRight: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  bubble: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginTop: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderBottomRightRadius: 4,
    backgroundColor: theme.colors.blue,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  thinkingCard: {
    alignSelf: 'flex-start',
    marginTop: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    backgroundColor: theme.colors.violetSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thinkingText: {
    color: theme.colors.violet,
    fontSize: 13,
    fontWeight: '600',
  },
  answer: {
    marginTop: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.card,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  answerTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: theme.colors.text,
  },
  audioIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.amberSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  audioIconText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.amber,
  },
  answerText: {
    color: theme.colors.text,
    lineHeight: 21,
    fontSize: 14,
  },
  resultBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.greenSoft,
  },
  result: {
    color: theme.colors.green,
    fontWeight: '700',
    fontSize: 13,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  source: {
    color: theme.colors.violet,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  primaryAction: {
    marginTop: 12,
    height: 46,
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
  questionItem: {
    padding: 12,
    marginTop: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
  },
  questionItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  moreQuestionsText: {
    marginTop: 10,
    fontSize: 12,
    color: theme.colors.secondary,
    fontStyle: 'italic',
  },
  note: {
    marginTop: 6,
    color: theme.colors.secondary,
    fontSize: 12,
  },
  nextSteps: {
    gap: 8,
    marginTop: 10,
  },
  error: {
    marginTop: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.redBorder,
    backgroundColor: theme.colors.redSoft,
  },
  errorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  errorBody: {
    marginTop: 4,
    color: theme.colors.secondary,
    lineHeight: 18,
    fontSize: 13,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.red,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.45)',
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
    ...theme.shadows.elevated,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.borderDark,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  manageLink: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.blue,
  },
  sheetBody: {
    marginTop: 4,
    color: theme.colors.secondary,
    fontSize: 13,
    marginBottom: 12,
  },
  material: {
    marginTop: 8,
    minHeight: 56,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  materialSelected: {
    borderColor: theme.colors.violet,
    borderWidth: 2,
    backgroundColor: theme.colors.violetSoft,
  },
  materialName: {
    fontWeight: '700',
    color: theme.colors.text,
    fontSize: 14,
  },
  materialDetail: {
    marginTop: 2,
    color: theme.colors.secondary,
    fontSize: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.muted,
  },
});
