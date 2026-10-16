import { useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  FileText,
  Headphones,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  Upload,
  X,
} from 'lucide-react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';

type Mode = 'library' | 'upload' | 'progress' | 'success' | 'failed' | 'details';

export type MaterialItem = {
  id: string;
  name: string;
  subject: string;
  type: string;
  size: string;
  status: 'Ready for AI' | 'AI processing…' | 'Upload failed';
  pages: number;
  uploadedDate: string;
  summary: string[];
};

const initialFiles: MaterialItem[] = [
  {
    id: 'mat-1',
    name: 'Chapter 3 – Quadratics.pdf',
    subject: 'Mathematics',
    type: 'PDF',
    size: '2.4 MB',
    status: 'Ready for AI',
    pages: 24,
    uploadedDate: '2 Oct 2026',
    summary: [
      'Standard form of a quadratic equation: ax² + bx + c = 0',
      'Solving by factorising and by the quadratic formula',
      'Interpreting roots and vertex on parabolic graphs',
    ],
  },
  {
    id: 'mat-2',
    name: 'Chapter 4 – Functions & Graphs.pdf',
    subject: 'Mathematics',
    type: 'PDF',
    size: '3.1 MB',
    status: 'AI processing…',
    pages: 32,
    uploadedDate: '3 Oct 2026',
    summary: [
      'Domain, range, and composite functions',
      'Inverse function determination and symmetry',
    ],
  },
  {
    id: 'mat-3',
    name: 'Python Basics – Week 4.pptx',
    subject: 'Programming',
    type: 'PPTX',
    size: '5.1 MB',
    status: 'Ready for AI',
    pages: 18,
    uploadedDate: '28 Sep 2026',
    summary: [
      'For loops, while loops, and range iteration',
      'Recursive function patterns and base termination cases',
    ],
  },
  {
    id: 'mat-4',
    name: 'Statistics Lecture 2 – Probability.pdf',
    subject: 'Statistics',
    type: 'PDF',
    size: '1.8 MB',
    status: 'Ready for AI',
    pages: 15,
    uploadedDate: '30 Sep 2026',
    summary: [
      'Independent vs mutually exclusive events',
      'Bayes theorem applications in sample spaces',
    ],
  },
];

export default function MaterialsScreen() {
  const [files, setFiles] = useState<MaterialItem[]>(initialFiles);
  const [mode, setMode] = useState<Mode>('library');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<MaterialItem>(initialFiles[0]);
  const [uploadProgress, setUploadProgress] = useState(64);

  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesFilter = filter === 'All' || file.subject === filter;
      const matchesQuery = `${file.name} ${file.subject}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [files, filter, query]);

  if (mode === 'details') {
    return <Details file={selected} back={() => setMode('library')} />;
  }

  if (
    mode === 'upload' ||
    mode === 'progress' ||
    mode === 'success' ||
    mode === 'failed'
  ) {
    return (
      <UploadFlow
        mode={mode}
        progress={uploadProgress}
        setProgress={setUploadProgress}
        close={() => setMode('library')}
        upload={() => {
          setUploadProgress(40);
          setMode('progress');
          setTimeout(() => {
            setUploadProgress(100);
            setMode('success');
          }, 1200);
        }}
        retry={() => {
          setUploadProgress(50);
          setMode('progress');
          setTimeout(() => setMode('success'), 1000);
        }}
      />
    );
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
        <Text style={styles.headerTitle}>Learning Materials</Text>
        <Pressable
          onPress={() => setMode('upload')}
          style={styles.headerActionButton}
          accessibilityLabel="Upload material"
        >
          <Plus size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={theme.colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, slides, subjects…"
            placeholderTextColor={theme.colors.muted}
            style={styles.searchInput}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
              <X size={16} color={theme.colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {['All', 'Mathematics', 'Programming', 'Statistics'].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.filterPill,
                filter === item && styles.filterPillActive,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {visibleFiles.length === 0 ? (
          <EmptyView openUpload={() => setMode('upload')} />
        ) : (
          <View style={styles.sectionsList}>
            {['Mathematics', 'Programming', 'Statistics'].map((subject) => {
              const group = visibleFiles.filter((f) => f.subject === subject);
              if (!group.length) return null;
              return (
                <View key={subject} style={styles.subjectGroup}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{subject}</Text>
                    <Text style={styles.groupCount}>
                      {group.length} {group.length === 1 ? 'file' : 'files'}
                    </Text>
                  </View>
                  {group.map((file) => (
                    <Pressable
                      key={file.id}
                      style={styles.fileCard}
                      onPress={() => {
                        setSelected(file);
                        setMode('details');
                      }}
                    >
                      <View style={styles.fileIconWrap}>
                        <FileText size={24} color={theme.colors.blue} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fileName}>{file.name}</Text>
                        <Text style={styles.fileMeta}>
                          {file.type} · {file.size} · {file.pages} pages
                        </Text>
                        <View style={styles.statusRow}>
                          <Text
                            style={[
                              styles.statusBadge,
                              file.status.includes('processing')
                                ? styles.statusProcessing
                                : styles.statusReady,
                            ]}
                          >
                            ● {file.status}
                          </Text>
                        </View>
                      </View>
                      <MoreVertical size={18} color={theme.colors.muted} />
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyView({ openUpload }: { openUpload: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <BookOpen size={40} color={theme.colors.blue} />
      </View>
      <Text style={styles.emptyTitle}>No materials found</Text>
      <Text style={styles.emptyBody}>
        Upload lecture notes, lecture slides, or exam sheets so your AI study assistant can teach you from them.
      </Text>
      <Pressable style={styles.primaryButton} onPress={openUpload}>
        <Plus size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Upload Material</Text>
      </Pressable>
    </View>
  );
}

function Details({
  file,
  back,
}: {
  file: MaterialItem;
  back: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={back} style={styles.headerButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Material Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHero}>
          <View style={styles.detailIconCircle}>
            <FileText size={48} color={theme.colors.blue} />
          </View>
          <Text style={styles.detailFileName}>{file.name}</Text>
          <Text style={styles.detailStatus}>● {file.status}</Text>
        </View>

        {/* Metadata info */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Subject</Text>
            <Text style={styles.metaVal}>{file.subject}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>File Size</Text>
            <Text style={styles.metaVal}>{file.size}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Length</Text>
            <Text style={styles.metaVal}>{file.pages} pages</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Uploaded</Text>
            <Text style={styles.metaVal}>{file.uploadedDate}</Text>
          </View>
        </View>

        {/* AI Grounded Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Sparkles size={16} color={theme.colors.violet} />
            <Text style={styles.summaryHeading}>AI GROUNDED SUMMARY</Text>
          </View>
          {file.summary.map((point) => (
            <View key={point} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>

        {/* Action CTAs */}
        <View style={styles.detailActions}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(tabs)/tutor')}
          >
            <Sparkles size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Ask AI Tutor about this</Text>
          </Pressable>

          <Pressable
            style={styles.podcastButton}
            onPress={() => router.push('/learn')}
          >
            <Headphones size={18} color={theme.colors.amber} />
            <Text style={styles.podcastButtonText}>Listen to Audio Podcast</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/quiz')}
          >
            <Target size={18} color={theme.colors.blue} />
            <Text style={styles.secondaryButtonText}>Generate Quiz from this</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadFlow({
  mode,
  progress,
  setProgress,
  close,
  upload,
  retry,
}: {
  mode: Mode;
  progress: number;
  setProgress: (val: number) => void;
  close: () => void;
  upload: () => void;
  retry: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={close} style={styles.headerButton}>
          <X size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Upload Material</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {mode === 'success' ? (
          <View style={styles.uploadStateCenter}>
            <View style={styles.successCircle}>
              <Check size={40} color={theme.colors.green} />
            </View>
            <Text style={styles.stateTitle}>Material Ready!</Text>
            <Text style={styles.stateSubtitle}>
              Chapter 3 – Quadratics.pdf has been uploaded, parsed and grounded for your AI Tutor.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/tutor')}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ask AI Tutor about this file</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/learn')}
            >
              <Headphones size={18} color={theme.colors.amber} />
              <Text style={styles.podcastButtonText}>Generate Audio Lesson</Text>
            </Pressable>
          </View>
        ) : mode === 'progress' ? (
          <View style={styles.uploadStateCenter}>
            <View style={styles.progressCircleWrap}>
              <RefreshCw size={36} color={theme.colors.blue} />
            </View>
            <Text style={styles.stateTitle}>Processing Material…</Text>
            <Text style={styles.stateSubtitle}>
              Reading text, extracting formula notations and preparing AI vectors.
            </Text>

            <View style={styles.progressBarWrap}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}% completed</Text>

            <Pressable style={styles.cancelLink} onPress={close}>
              <Text style={styles.cancelLinkText}>Run in background</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Pressable style={styles.dropZone} onPress={upload}>
              <Upload size={32} color={theme.colors.blue} />
              <Text style={styles.dropZoneTitle}>Select files or drop notes</Text>
              <Text style={styles.dropZoneSubtitle}>
                Supports PDF, DOCX, PPTX, JPG, PNG (Max 20 MB)
              </Text>
            </Pressable>

            <Text style={styles.fieldLabel}>Document Title</Text>
            <View style={styles.fieldInputWrap}>
              <TextInput
                defaultValue="Chapter 3 – Quadratics.pdf"
                style={styles.fieldInput}
              />
            </View>

            <Text style={styles.fieldLabel}>Subject</Text>
            <View style={styles.fieldSelect}>
              <Text style={styles.fieldSelectValue}>Mathematics</Text>
              <ChevronDown size={18} color={theme.colors.secondary} />
            </View>

            <View style={styles.aiToggleBox}>
              <Sparkles size={18} color={theme.colors.violet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiToggleTitle}>Enable for AI Tutor & Quizzes</Text>
                <Text style={styles.aiToggleSubtitle}>
                  Index text so questions and flashcards ground strictly to this material
                </Text>
              </View>
              <View style={styles.toggleActiveCircle}>
                <Check size={14} color="#FFFFFF" />
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={upload}>
              <Upload size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Upload & Process</Text>
            </Pressable>
          </View>
        )}
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
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.blue,
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
  searchBar: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 14,
    ...theme.shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  sectionsList: {
    gap: 16,
  },
  subjectGroup: {
    marginBottom: 10,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  groupCount: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  fileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    ...theme.shadows.card,
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  fileMeta: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  statusReady: {
    color: theme.colors.green,
    backgroundColor: theme.colors.greenSoft,
  },
  statusProcessing: {
    color: theme.colors.amber,
    backgroundColor: theme.colors.amberSoft,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
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
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    lineHeight: 20,
    fontSize: 14,
    marginBottom: 20,
  },
  primaryButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 10,
    ...theme.shadows.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
  podcastButton: {
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.amberSoft,
    borderWidth: 1,
    borderColor: theme.colors.amberBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  podcastButtonText: {
    color: theme.colors.amber,
    fontWeight: '700',
    fontSize: 14,
  },
  detailHero: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  detailIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailFileName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  detailStatus: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.green,
  },
  metaBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  summaryCard: {
    backgroundColor: theme.colors.violetSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  summaryHeading: {
    color: theme.colors.violet,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  bulletDot: {
    color: theme.colors.violet,
    fontSize: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  detailActions: {
    gap: 4,
    marginTop: 8,
  },
  dropZone: {
    height: 140,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.blue,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  dropZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dropZoneSubtitle: {
    fontSize: 12,
    color: theme.colors.secondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  fieldInputWrap: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginBottom: 16,
  },
  fieldInput: {
    fontSize: 14,
    color: theme.colors.text,
  },
  fieldSelect: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  fieldSelectValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  aiToggleBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  aiToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  aiToggleSubtitle: {
    fontSize: 12,
    color: theme.colors.secondary,
    marginTop: 2,
  },
  toggleActiveCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadStateCenter: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressCircleWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: theme.colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressBarWrap: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.blue,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.blue,
    marginBottom: 24,
  },
  cancelLink: {
    padding: 10,
  },
  cancelLinkText: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontWeight: '600',
  },
});
