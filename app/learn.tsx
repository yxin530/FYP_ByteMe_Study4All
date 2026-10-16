import { useState } from 'react';
import {
  ActivityIndicator,
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
  ChevronLeft,
  FileText,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Target,
  Volume2,
} from 'lucide-react-native';
import { agentApi } from '@/lib/api';
import { theme } from '@/lib/theme';

const sampleTopics = [
  '5-minute podcast on factorising quadratics',
  'Summary of quadratic formula & discriminant',
  'Real-world examples of parabolic trajectories',
  'Quick refresher on solving x² - 3x - 4 = 0',
];

const voices = [
  { id: 'rachel', name: 'Rachel', style: 'Warm & clear' },
  { id: 'james', name: 'James', style: 'Deep academic' },
  { id: 'aria', name: 'Aria', style: 'Energetic tutor' },
];

export default function LearnScreen() {
  const [request, setRequest] = useState(
    'Create a concise audio podcast lesson explaining how to solve quadratic equations by factorising and using the formula.'
  );
  const [selectedVoice, setSelectedVoice] = useState('rachel');
  const [speed, setSpeed] = useState('1.0x');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38); // percentage 0..100
  const [transcript, setTranscript] = useState(
    `Welcome to Study4All Audio Bites. Today we're breaking down Chapter 3: Quadratic Equations.

First, remember the standard form: a x squared plus b x plus c equals zero.

When factorising, our goal is to find two numbers that multiply to give c and add together to give b. For example, in x squared minus 3x minus 4 equals zero, we look for two numbers whose product is minus 4 and sum is minus 3. Those numbers are minus 4 and positive 1.

Setting each bracket to zero gives our solutions: x equals 4 or x equals minus 1.

If a quadratic cannot easily be factorised, that's when we reach for our trusty quadratic formula: x equals negative b, plus or minus the square root of b squared minus 4ac, all divided by 2a.

Keep practicing, and try the quick quiz right after this lesson!`
  );
  const [loading, setLoading] = useState(false);
  const [sourceMaterial] = useState('Chapter 3 – Quadratics.pdf (p. 8–14)');

  async function handleGenerateLesson() {
    if (!request.trim()) return;
    setLoading(true);
    try {
      const result = await agentApi.createAudioTranscript(request.trim(), ['mat-1']);
      if (result?.transcript) {
        setTranscript(result.transcript);
      }
    } catch {
      // Keep grounded default if offline/mock
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Audio Lesson Studio</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Source Grounding Banner */}
        <View style={styles.sourceBanner}>
          <FileText size={16} color={theme.colors.violet} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sourceLabel}>GROUNDED SOURCE MATERIAL</Text>
            <Text style={styles.sourceText}>{sourceMaterial}</Text>
          </View>
          <Pressable onPress={() => router.push('/materials')}>
            <Text style={styles.changeLink}>Change</Text>
          </Pressable>
        </View>

        {/* Audio Player Card */}
        <View style={styles.playerCard}>
          <View style={styles.playerTop}>
            <View style={styles.podcastIconWrap}>
              <Headphones size={26} color={theme.colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>Factorising & Quadratics Masterclass</Text>
              <Text style={styles.lessonMeta}>
                AI Voice: {voices.find((v) => v.id === selectedVoice)?.name} · 02:45 total
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFilled, { width: `${progress}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>01:03</Text>
              <Text style={styles.timeText}>02:45</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <Pressable
              style={styles.speedPill}
              onPress={() =>
                setSpeed((s) => (s === '1.0x' ? '1.25x' : s === '1.25x' ? '1.5x' : '1.0x'))
              }
            >
              <Text style={styles.speedText}>{speed}</Text>
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={() => setProgress((p) => Math.max(0, p - 10))}
            >
              <RotateCcw size={20} color={theme.colors.text} />
              <Text style={styles.skipLabel}>10s</Text>
            </Pressable>

            <Pressable
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause size={24} color="#FFFFFF" />
              ) : (
                <Play size={24} color="#FFFFFF" style={{ marginLeft: 3 }} />
              )}
            </Pressable>

            <Pressable
              style={styles.skipButton}
              onPress={() => setProgress((p) => Math.min(100, p + 10))}
            >
              <RotateCw size={20} color={theme.colors.text} />
              <Text style={styles.skipLabel}>10s</Text>
            </Pressable>

            <Pressable
              style={styles.quizMiniButton}
              onPress={() => router.push('/quiz')}
              accessibilityLabel="Quiz on this"
            >
              <Target size={18} color={theme.colors.blue} />
            </Pressable>
          </View>
        </View>

        {/* AI Voice Selector */}
        <Text style={styles.sectionTitle}>Select Voice</Text>
        <View style={styles.voiceRow}>
          {voices.map((v) => (
            <Pressable
              key={v.id}
              style={[
                styles.voiceCard,
                selectedVoice === v.id && styles.voiceCardSelected,
              ]}
              onPress={() => setSelectedVoice(v.id)}
            >
              <View style={styles.voiceCardHeader}>
                <Volume2
                  size={16}
                  color={selectedVoice === v.id ? theme.colors.blue : theme.colors.secondary}
                />
                {selectedVoice === v.id ? (
                  <Check size={14} color={theme.colors.blue} />
                ) : null}
              </View>
              <Text style={styles.voiceName}>{v.name}</Text>
              <Text style={styles.voiceStyle}>{v.style}</Text>
            </Pressable>
          ))}
        </View>

        {/* Transcript Section */}
        <View style={styles.transcriptCard}>
          <View style={styles.transcriptHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color={theme.colors.violet} />
              <Text style={styles.transcriptTitle}>Grounded Transcript</Text>
            </View>
            <Text style={styles.transcriptBadge}>Citations Verified</Text>
          </View>
          <Text style={styles.transcriptBody}>{transcript}</Text>
        </View>

        {/* Custom Prompt Box */}
        <Text style={styles.sectionTitle}>Create Another Audio Lesson</Text>
        <View style={styles.composerCard}>
          <TextInput
            multiline
            value={request}
            onChangeText={setRequest}
            placeholder="E.g. Summarize the discriminant rules in 3 minutes..."
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            {sampleTopics.map((topic) => (
              <Pressable
                key={topic}
                style={styles.presetChip}
                onPress={() => setRequest(topic)}
              >
                <Text style={styles.presetText}>{topic}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={styles.generateButton}
            onPress={handleGenerateLesson}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Headphones size={18} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generate Lesson Audio</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Action Link Footer */}
        <View style={styles.actionFooter}>
          <Pressable
            style={styles.footerLinkButton}
            onPress={() => router.push('/quiz')}
          >
            <Target size={18} color={theme.colors.blue} />
            <Text style={styles.footerLinkText}>Take Quiz on this Topic</Text>
          </Pressable>
          <Pressable
            style={styles.footerLinkButton}
            onPress={() => router.push('/(tabs)/tutor')}
          >
            <Bot size={18} color={theme.colors.violet} />
            <Text style={[styles.footerLinkText, { color: theme.colors.violet }]}>
              Ask Tutor Follow-up
            </Text>
          </Pressable>
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
  headerButton: {
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
  sourceBanner: {
    backgroundColor: theme.colors.violetSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sourceLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.violet,
    letterSpacing: 0.8,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  changeLink: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.violet,
  },
  playerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
    marginBottom: 20,
    ...theme.shadows.card,
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  podcastIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: theme.colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  lessonMeta: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 3,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFilled: {
    height: '100%',
    backgroundColor: theme.colors.amber,
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.muted,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  speedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  skipButton: {
    alignItems: 'center',
    padding: 6,
  },
  skipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.secondary,
    marginTop: 2,
  },
  playButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  quizMiniButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  voiceRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  voiceCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  voiceCardSelected: {
    borderColor: theme.colors.blue,
    backgroundColor: theme.colors.blueLight,
  },
  voiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  voiceStyle: {
    fontSize: 11,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  transcriptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  transcriptBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.full,
  },
  transcriptBody: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 21,
  },
  composerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 20,
    ...theme.shadows.sm,
  },
  input: {
    minHeight: 80,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    padding: 12,
    fontSize: 13,
    color: theme.colors.text,
    textAlignVertical: 'top',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetText: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  generateButton: {
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  actionFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  footerLinkButton: {
    flex: 1,
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.blue,
  },
});
