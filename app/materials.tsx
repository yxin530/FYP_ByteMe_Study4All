import { useEffect, useMemo, useState } from 'react';
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
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { theme } from '@/lib/theme';
import { materialsApi, type MaterialItem as BackendMaterial } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

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
  raw?: BackendMaterial;
};

const initialFallbackFiles: MaterialItem[] = [
  {
    id: 'mat-demo-1',
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
    id: 'mat-demo-2',
    name: 'Chapter 4 – Functions & Graphs.pdf',
    subject: 'Mathematics',
    type: 'PDF',
    size: '3.1 MB',
    status: 'Ready for AI',
    pages: 32,
    uploadedDate: '3 Oct 2026',
    summary: [
      'Domain, range, and composite functions',
      'Inverse function determination and symmetry',
    ],
  },
  {
    id: 'mat-demo-3',
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
];

function mapBackendToItem(m: BackendMaterial): MaterialItem {
  const typeName = (m.material_type || 'PDF').toUpperCase();
  const summaryPoints = m.extracted_text
    ? m.extracted_text
        .split(/\r?\n/)
        .map((s) => s.trim().replace(/^[-•*#\d.]+\s*/, ''))
        .filter((s) => s.length >= 15 && s.length <= 160)
        .slice(0, 4)
    : [];

  let displayStatus: 'Ready for AI' | 'AI processing…' | 'Upload failed' = 'Ready for AI';
  if (m.processing_status === 'processing' || m.processing_status === 'pending') {
    displayStatus = 'AI processing…';
  } else if (m.processing_status === 'failed') {
    displayStatus = 'Upload failed';
  }

  const dateStr = m.created_at
    ? new Date(m.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const estimatedWords = m.extracted_text ? m.extracted_text.split(/\s+/).length : 0;
  const estimatedSize = m.extracted_text
    ? `${(m.extracted_text.length / 1024).toFixed(1)} KB`
    : '1.5 MB';

  return {
    id: m.id,
    name: m.title,
    subject: m.subject_id || 'General',
    type: typeName,
    size: estimatedSize,
    status: displayStatus,
    pages: Math.max(1, Math.round(estimatedWords / 250)),
    uploadedDate: dateStr,
    summary:
      summaryPoints.length > 0
        ? summaryPoints
        : ['Material indexed and verified for grounded learning.'],
    raw: m,
  };
}

export default function MaterialsScreen() {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mode, setMode] = useState<Mode>('library');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<MaterialItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMaterials = async () => {
    if (!isAuthenticated) {
      setFiles(initialFallbackFiles);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await materialsApi.list();
      if (list && list.length > 0) {
        setFiles(list.map(mapBackendToItem));
      } else {
        setFiles([]);
      }
    } catch {
      // Fallback gracefully to demo files in offline/development mode
      setFiles(initialFallbackFiles);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMaterials();
  };

  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    for (const f of files) {
      if (f.subject) subjects.add(f.subject);
    }
    return ['All', ...Array.from(subjects)];
  }, [files]);

  const visibleFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesFilter = filter === 'All' || file.subject === filter;
      const matchesQuery = `${file.name} ${file.subject}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [files, filter, query]);

  const handleUploadComplete = (newMaterial: MaterialItem) => {
    setFiles((prev) => [newMaterial, ...prev]);
    setSelected(newMaterial);
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await materialsApi.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setMode('library');
    } catch (err: any) {
      Alert.alert('Delete failed', err?.message || 'Unable to delete material.');
    }
  };

  if (mode === 'details' && selected) {
    return (
      <Details
        file={selected}
        back={() => setMode('library')}
        onDelete={() => handleDeleteMaterial(selected.id)}
      />
    );
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
        errorMessage={errorMessage}
        close={() => setMode('library')}
        onSuccess={handleUploadComplete}
        setMode={setMode}
        setProgress={setUploadProgress}
        setErrorMessage={setErrorMessage}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
          {availableSubjects.map((item) => (
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

        {loading && !refreshing ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.blue} />
            <Text style={{ marginTop: 12, color: theme.colors.secondary, fontSize: 13 }}>
              Loading learning materials…
            </Text>
          </View>
        ) : visibleFiles.length === 0 ? (
          <EmptyView openUpload={() => setMode('upload')} />
        ) : (
          <View style={styles.sectionsList}>
            {visibleFiles.map((file) => (
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
                    {file.subject} · {file.type} · {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                  </Text>
                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.statusBadge,
                        file.status.includes('processing')
                          ? styles.statusProcessing
                          : file.status.includes('failed')
                          ? styles.statusFailed
                          : styles.statusReady,
                      ]}
                    >
                      ● {file.status}
                    </Text>
                    {file.raw?.version_hash ? (
                      <Text style={styles.hashBadge}>
                        #{file.raw.version_hash.slice(0, 8)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <MoreVertical size={18} color={theme.colors.muted} />
              </Pressable>
            ))}
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
  onDelete,
}: {
  file: MaterialItem;
  back: () => void;
  onDelete: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!file.raw?.storage_path) {
      Alert.alert('Download', 'This material only exists as embedded study text.');
      return;
    }
    try {
      setDownloading(true);
      const res = await materialsApi.getDownloadUrl(file.id);
      Alert.alert('Signed URL Generated', `Secure download link:\n${res.downloadUrl.slice(0, 75)}…`);
    } catch (err: any) {
      Alert.alert('Download Error', err?.message || 'Could not get download URL.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={back} style={styles.headerButton}>
          <ChevronLeft size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Material Details</Text>
        <Pressable
          onPress={() => {
            Alert.alert(
              'Delete Material',
              `Are you sure you want to delete "${file.name}"? This removes it from your AI knowledge base.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ],
            );
          }}
          style={styles.headerButton}
        >
          <Trash2 size={20} color={theme.colors.red} />
        </Pressable>
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
          {file.raw?.version_hash ? (
            <Text style={styles.detailVersionText}>
              Version SHA-256: {file.raw.version_hash.slice(0, 16)}…
            </Text>
          ) : null}
        </View>

        {/* Metadata info */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Subject</Text>
            <Text style={styles.metaVal}>{file.subject}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>File Size / Words</Text>
            <Text style={styles.metaVal}>{file.size}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Estimated Length</Text>
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

          {file.raw?.storage_path ? (
            <Pressable
              style={[styles.secondaryButton, { marginTop: 4 }]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={theme.colors.blue} />
              ) : (
                <>
                  <Upload size={18} color={theme.colors.blue} />
                  <Text style={styles.secondaryButtonText}>Download Original via Signed URL</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function UploadFlow({
  mode,
  progress,
  errorMessage,
  close,
  onSuccess,
  setMode,
  setProgress,
  setErrorMessage,
}: {
  mode: Mode;
  progress: number;
  errorMessage: string;
  close: () => void;
  onSuccess: (item: MaterialItem) => void;
  setMode: (m: Mode) => void;
  setProgress: (p: number) => void;
  setErrorMessage: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [fileType, setFileType] = useState<'pdf' | 'doc' | 'text' | 'image'>('pdf');
  const [content, setContent] = useState('');

  const handleStartUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Required field', 'Please provide a document title.');
      return;
    }

    try {
      setMode('progress');
      setProgress(25);

      // 1. Create material on backend
      const created = await materialsApi.create({
        title: title.trim(),
        fileType,
        subject,
        content: content.trim() || undefined,
      });

      setProgress(65);

      // 2. Trigger format-specific extraction & processing
      const processed = await materialsApi.process(created.id);
      setProgress(100);

      const item = mapBackendToItem(processed);
      onSuccess(item);
      setMode('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Material processing failed.');
      setMode('failed');
    }
  };

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
              "{title || 'Your material'}" has been uploaded, parsed and grounded for your AI Tutor.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                close();
                router.push('/(tabs)/tutor');
              }}
            >
              <Sparkles size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Ask AI Tutor about this file</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                close();
                router.push('/learn');
              }}
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
        ) : mode === 'failed' ? (
          <View style={styles.uploadStateCenter}>
            <View style={[styles.successCircle, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={40} color={theme.colors.red} />
            </View>
            <Text style={styles.stateTitle}>Upload Failed</Text>
            <Text style={styles.stateSubtitle}>{errorMessage || 'An error occurred during extraction.'}</Text>
            <Pressable style={styles.primaryButton} onPress={() => setMode('upload')}>
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.dropZone}>
              <Upload size={32} color={theme.colors.blue} />
              <Text style={styles.dropZoneTitle}>Select files or enter notes</Text>
              <Text style={styles.dropZoneSubtitle}>
                Supports PDF, DOC, Text, Image
              </Text>
            </View>

            <Text style={styles.fieldLabel}>Document Title *</Text>
            <View style={styles.fieldInputWrap}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Chapter 3 – Quadratics.pdf"
                placeholderTextColor={theme.colors.muted}
                style={styles.fieldInput}
              />
            </View>

            <Text style={styles.fieldLabel}>Subject</Text>
            <View style={styles.typeRow}>
              {['Mathematics', 'Programming', 'Statistics', 'General'].map((sub) => (
                <Pressable
                  key={sub}
                  style={[
                    styles.typeChip,
                    subject === sub && styles.typeChipActive,
                  ]}
                  onPress={() => setSubject(sub)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      subject === sub && styles.typeChipTextActive,
                    ]}
                  >
                    {sub}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Format Type</Text>
            <View style={styles.typeRow}>
              {(['pdf', 'doc', 'text', 'image'] as const).map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.typeChip,
                    fileType === t && styles.typeChipActive,
                  ]}
                  onPress={() => setFileType(t)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      fileType === t && styles.typeChipTextActive,
                    ]}
                  >
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notes / Extracted Text Content</Text>
            <View style={[styles.fieldInputWrap, { height: 110, paddingVertical: 8 }]}>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Paste key notes, formula definitions, or lecture excerpts here for AI grounding…"
                placeholderTextColor={theme.colors.muted}
                multiline
                style={[styles.fieldInput, { textAlignVertical: 'top' }]}
              />
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

            <Pressable style={styles.primaryButton} onPress={handleStartUpload}>
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeChipActive: {
    backgroundColor: theme.colors.blueLight,
    borderColor: theme.colors.blue,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  typeChipTextActive: {
    color: theme.colors.blue,
    fontWeight: '700',
  },
  sectionsList: {
    gap: 12,
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
    alignItems: 'center',
    gap: 8,
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
  statusFailed: {
    color: theme.colors.red,
    backgroundColor: '#FEE2E2',
  },
  hashBadge: {
    fontSize: 10,
    color: theme.colors.muted,
    fontFamily: 'monospace',
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
  detailVersionText: {
    marginTop: 4,
    fontSize: 11,
    color: theme.colors.muted,
    fontFamily: 'monospace',
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
