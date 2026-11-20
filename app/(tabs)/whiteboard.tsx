import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, ChevronLeft, Clock3, MessageCircle, Plus, RefreshCw, Send, Sparkles, Trash2, Users, WandSparkles } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { materialsApi, whiteboardApi, type MaterialItem, type WhiteboardDocument, type WhiteboardGroup, type WhiteboardMessage } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

type StudyGroup = { id: string; name: string; subject: string };
type ProposedEdit = Awaited<ReturnType<typeof whiteboardApi.proposeEdit>>;

export default function WhiteboardScreen() {
  const { isAuthenticated, user } = useAuth();
  const [groups, setGroups] = useState<WhiteboardGroup[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [active, setActive] = useState<WhiteboardGroup | null>(null);
  const [document, setDocument] = useState<WhiteboardDocument | null>(null);
  const [messages, setMessages] = useState<WhiteboardMessage[]>([]);
  const [members, setMembers] = useState<Array<{ user_id: string; role: string }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; revision: number; content: string; edited_by: string; created_at: string }>>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expectedRevision, setExpectedRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [groupName, setGroupName] = useState('');
  const [memberIdsText, setMemberIdsText] = useState('');
  const [studyGroupId, setStudyGroupId] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [question, setQuestion] = useState('');
  const [editInstruction, setEditInstruction] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [answer, setAnswer] = useState('');
  const [answerSources, setAnswerSources] = useState<string[]>([]);
  const [proposal, setProposal] = useState<ProposedEdit | null>(null);
  const [proposedContent, setProposedContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [conflictDraft, setConflictDraft] = useState<{ content: string; currentContent: string; currentRevision: number } | null>(null);

  const loadLists = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    try {
      const [groupResult, studyResult, materialResult] = await Promise.all([whiteboardApi.groups(), whiteboardApi.studyGroups(), materialsApi.list()]);
      setGroups(groupResult.groups);
      setStudyGroups(studyResult.groups);
      setMaterials(materialResult.filter((item) => item.processing_status === 'ready' && item.version_hash));
      setError('');
    } catch (e: any) { setError(e?.message ?? 'Could not load whiteboard groups.'); }
    finally { setLoading(false); }
  }, [isAuthenticated]);

  useEffect(() => { void loadLists(); }, [loadLists]);

  const openGroup = (group: WhiteboardGroup) => { setDocument(null); setTitle(''); setContent(''); setExpectedRevision(0); setDirty(false); setConflictDraft(null); setMessages([]); setMembers([]); setHistory([]); setAnswer(''); setAnswerSources([]); setSelectedMaterials([]); setProposal(null); setActive(group); };

  const refreshActive = useCallback(async (initial = false) => {
    if (!active) return;
    try {
      const data = await whiteboardApi.get(active.id);
      setMessages(data.messages);
      setMembers(data.members);
      if (!dirty || initial) {
        setDocument(data.document);
        setTitle(data.document.title);
        setContent(data.document.content);
        setExpectedRevision(data.document.revision);
        setDirty(false);
      } else if (data.document.revision !== expectedRevision) {
        setDocument(data.document);
      }
      setError('');
    } catch (e: any) { setError(e?.message ?? 'Could not sync this whiteboard.'); }
  }, [active, dirty, expectedRevision]);

  useEffect(() => {
    if (!active) return;
    void refreshActive(true);
  }, [active?.id]);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => { void refreshActive(); }, 3000);
    return () => clearInterval(timer);
  }, [active, refreshActive]);

  const toggleMaterial = (id: string) => setSelectedMaterials((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const createGroup = async () => {
    if (!groupName.trim()) { Alert.alert('Group name required', 'Add a name for this shared workspace.'); return; }
    const memberIds = memberIdsText.split(/[\s,;]+/).map((value) => value.trim()).filter(Boolean);
    try {
      const result = await whiteboardApi.createGroup({ name: groupName.trim(), memberIds, ...(studyGroupId ? { studyGroupId } : {}) });
      setGroupName(''); setMemberIdsText(''); setStudyGroupId('');
      setGroups((current) => [result.group, ...current]);
      openGroup(result.group);
    } catch (e: any) { Alert.alert('Could not create group', e?.message ?? 'Please check the member IDs and try again.'); }
  };

  const save = async () => {
    if (!active || !document || saving) return;
    setSaving(true);
    try {
      const result = await whiteboardApi.save(active.id, { title: title.trim() || 'Shared notes', content, expectedRevision });
      setDocument(result.document); setExpectedRevision(result.document.revision); setTitle(result.document.title); setDirty(false); setError('Saved and synced.');
    } catch (e: any) {
      if (e?.code === 'WHITEBOARD_REVISION_CONFLICT') {
        const details = e?.details as { currentRevision?: number; currentContent?: string } | undefined;
        if (typeof details?.currentRevision === 'number') setConflictDraft({ content, currentContent: details.currentContent ?? '', currentRevision: details.currentRevision });
        setError('A collaborator saved a newer version. Your unsaved text is preserved here. Merge it with the latest notes to continue.');
      }
      else setError(e?.message ?? 'Save failed. Your text is still on this screen.');
    } finally { setSaving(false); }
  };

  const sendChat = async () => {
    if (!active || !chatDraft.trim()) return;
    try { await whiteboardApi.sendMessage(active.id, chatDraft.trim()); setChatDraft(''); await refreshActive(); }
    catch (e: any) { Alert.alert('Message not sent', e?.message ?? 'Try again.'); }
  };

  const loadHistory = async () => {
    if (!active) return;
    try { const result = await whiteboardApi.history(active.id); setHistory(result.revisions); setShowHistory((value) => !value); }
    catch (e: any) { Alert.alert('History unavailable', e?.message ?? 'Try again.'); }
  };

  const ask = async () => {
    if (!active || !question.trim()) return;
    if (!selectedMaterials.length) { Alert.alert('Select study material', 'Choose at least one ready material so the answer can be grounded and cited.'); return; }
    try { const result = await whiteboardApi.ask(active.id, question.trim(), selectedMaterials); setAnswer(result.answer); setAnswerSources([...new Set(result.sourceReferences.map((source) => `${source.title} · ${source.materialVersionHash.slice(0, 10)}`))]); }
    catch (e: any) { Alert.alert('Could not answer', e?.message ?? 'The selected materials may not support this question.'); }
  };

  const propose = async () => {
    if (!active || !editInstruction.trim()) return;
    if (!selectedMaterials.length) { Alert.alert('Select study material', 'Choose at least one ready material for a grounded edit.'); return; }
    try { const result = await whiteboardApi.proposeEdit(active.id, editInstruction.trim(), selectedMaterials); setProposal(result); setProposedContent(result.proposedContent); }
    catch (e: any) { Alert.alert('Could not propose an edit', e?.message ?? 'The selected materials may not support this change.'); }
  };

  const acceptProposal = async () => {
    if (!active || !proposal) return;
    try {
      const result = await whiteboardApi.acceptEdit(active.id, { title: proposal.title, content: proposedContent, expectedRevision: proposal.expectedRevision, sourceReferences: proposal.sourceReferences.map(({ materialId, materialVersionHash }) => ({ materialId, materialVersionHash })) });
      setProposal(null); setDocument(result.document); setTitle(result.document.title); setContent(result.document.content); setExpectedRevision(result.document.revision); setDirty(false); setAnswerSources([...new Set(result.sourceReferences.map((source) => `${source.title} · ${source.materialVersionHash.slice(0, 10)}`))]);
    } catch (e: any) { Alert.alert('Edit was not applied', e?.message ?? 'Review the latest note and try again.'); }
  };

  const confirmDelete = (group: WhiteboardGroup) => Alert.alert('Delete shared workspace?', 'This removes its notes, chat, members, and revision history for everyone in the group.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete workspace', style: 'destructive', onPress: () => { void whiteboardApi.deleteGroup(group.id).then(() => { setGroups((current) => current.filter((item) => item.id !== group.id)); if (active?.id === group.id) setActive(null); }).catch((e: any) => Alert.alert('Could not delete workspace', e?.message ?? 'Only the owner can delete this workspace.')); } }]);

  const insertFormat = (before: string, after = '') => { setContent((current) => `${current}${current && !current.endsWith('\n') ? '\n' : ''}${before}${after}`); setDirty(true); };

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator color={theme.colors.blue} /><Text style={styles.muted}>Loading shared workspaces…</Text></View></SafeAreaView>;

  if (active) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => { if (dirty) Alert.alert('Unsaved notes', 'Leave this note and keep the unsaved changes only on this screen?', [{ text: 'Stay', style: 'cancel' }, { text: 'Leave', style: 'destructive', onPress: () => { setActive(null); setDocument(null); setTitle(''); setContent(''); setDirty(false); } }]); else { setActive(null); setDocument(null); setTitle(''); setContent(''); } }}><ChevronLeft size={20} color={theme.colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>SHARED WHITEBOARD</Text><Text style={styles.title}>{active.name}</Text></View>
          <Pressable style={styles.iconButton} onPress={() => void refreshActive()}><RefreshCw size={18} color={theme.colors.secondary} /></Pressable>
        </View>
        <View style={styles.statusRow}><Users size={15} color={theme.colors.blue} /><Text style={styles.statusText}>{members.length} members · revision {document?.revision ?? 0} · syncing every 3 seconds</Text></View>
        {!!error && <Text style={[styles.notice, error.includes('Saved') ? styles.successNotice : null]}>{error}</Text>}
        {conflictDraft && <View style={styles.conflictBox}><Text style={styles.conflictTitle}>Resolve the newer version</Text><Text style={styles.muted}>Your saved draft remains in the editor. This keeps the other member’s version and adds your draft below it.</Text><Pressable style={styles.secondaryButton} onPress={() => { setContent(`${conflictDraft.currentContent}${conflictDraft.currentContent ? '\n\n--- Merged draft ---\n' : ''}${conflictDraft.content}`); setExpectedRevision(conflictDraft.currentRevision); setDirty(true); setConflictDraft(null); }}><Text style={styles.secondaryText}>Merge my draft after latest notes</Text></Pressable></View>}

        <View style={styles.card}>
          <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>Collaborative notes</Text><Text style={styles.muted}>Changes save as recoverable revisions.</Text></View><Pressable style={styles.smallAction} onPress={() => void loadHistory()}><Clock3 size={15} color={theme.colors.blue} /><Text style={styles.actionText}>History</Text></Pressable></View>
          <TextInput value={title} onChangeText={(value) => { setTitle(value); setDirty(true); }} placeholder="Note title" placeholderTextColor={theme.colors.muted} style={styles.titleInput} />
          <View style={styles.toolbar}><Pressable onPress={() => insertFormat('# ')} style={styles.tool}><Text style={styles.toolText}>H1</Text></Pressable><Pressable onPress={() => insertFormat('## ')} style={styles.tool}><Text style={styles.toolText}>H2</Text></Pressable><Pressable onPress={() => insertFormat('- ')} style={styles.tool}><Text style={styles.toolText}>• List</Text></Pressable><Pressable onPress={() => insertFormat('**bold text**')} style={styles.tool}><Text style={styles.toolText}>Bold</Text></Pressable></View>
          <TextInput value={content} onChangeText={(value) => { setContent(value); setDirty(true); }} placeholder="Start writing shared notes…" placeholderTextColor={theme.colors.muted} style={styles.editor} multiline textAlignVertical="top" />
          <View style={styles.saveRow}><Text style={styles.muted}>{dirty ? 'Unsaved changes' : 'Up to date'}</Text><Pressable disabled={saving || !dirty} style={[styles.primaryButton, (!dirty || saving) && styles.disabled]} onPress={() => void save()}>{saving ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#fff" />}<Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save notes'}</Text></Pressable></View>
        </View>

        {showHistory && <View style={styles.card}><Text style={styles.sectionTitle}>Edit history</Text>{history.length ? history.map((item) => <View key={item.id} style={styles.historyItem}><Text style={styles.historyTitle}>Revision {item.revision}</Text><Text style={styles.muted}>{new Date(item.created_at).toLocaleString()} · {item.edited_by === user?.id ? 'You' : 'Collaborator'}</Text><Text numberOfLines={3} style={styles.historyContent}>{item.content || 'Empty note'}</Text><Pressable style={styles.smallAction} onPress={() => { if (dirty) { Alert.alert('Unsaved changes', 'Save or discard the current draft before restoring a revision.'); return; } setContent(item.content); setDirty(true); }}><Text style={styles.actionText}>Load into editor</Text></Pressable></View>) : <Text style={styles.muted}>No saved revisions yet.</Text>}</View>}

        <View style={styles.card}><View style={styles.sectionHead}><View style={styles.inline}><Sparkles size={18} color={theme.colors.violet} /><Text style={styles.sectionTitle}>Ask AI about your notes</Text></View></View><Text style={styles.muted}>Answers use selected ready materials and show their source versions.</Text><MaterialPicker materials={materials} selected={selectedMaterials} toggle={toggleMaterial} /><TextInput value={question} onChangeText={setQuestion} style={styles.input} placeholder="Ask about the selected material…" placeholderTextColor={theme.colors.muted} multiline /><Pressable style={styles.primaryButton} onPress={() => void ask()}><Sparkles size={16} color="#fff" /><Text style={styles.primaryText}>Ask grounded question</Text></Pressable>{!!answer && <View style={styles.answerBox}><Text style={styles.answerText}>{answer}</Text>{answerSources.map((source) => <Text key={source} style={styles.sourceText}>Source · {source}</Text>)}</View>}</View>

        <View style={styles.card}><View style={styles.inline}><WandSparkles size={18} color={theme.colors.violet} /><Text style={styles.sectionTitle}>Propose a note edit</Text></View><Text style={styles.muted}>AI edits stay in review until you accept them.</Text><TextInput value={editInstruction} onChangeText={setEditInstruction} style={styles.input} placeholder="e.g. Organize the notes into a short outline" placeholderTextColor={theme.colors.muted} multiline /><Pressable style={styles.secondaryButton} onPress={() => void propose()}><WandSparkles size={16} color={theme.colors.violet} /><Text style={styles.secondaryText}>Create proposed edit</Text></Pressable>{proposal && <View style={styles.proposalBox}><Text style={styles.sectionTitle}>Review proposed changes</Text><TextInput value={proposedContent} onChangeText={setProposedContent} style={styles.proposalEditor} multiline textAlignVertical="top" /><Text style={styles.muted}>Sources: {proposal.sourceReferences.map((source) => source.title).join(', ')}</Text><View style={styles.buttonRow}><Pressable style={styles.secondaryButton} onPress={() => setProposal(null)}><Text style={styles.secondaryText}>Discard</Text></Pressable><Pressable style={styles.primaryButton} onPress={() => void acceptProposal()}><Check size={16} color="#fff" /><Text style={styles.primaryText}>Accept and apply</Text></Pressable></View></View>}</View>

        <View style={styles.card}><Pressable style={styles.sectionHead} onPress={() => setShowChat((value) => !value)}><View style={styles.inline}><MessageCircle size={18} color={theme.colors.blue} /><Text style={styles.sectionTitle}>Group chat</Text></View><Text style={styles.actionText}>{showChat ? 'Hide' : 'Show'}</Text></Pressable>{showChat && <><View style={styles.chatList}>{messages.length ? messages.map((message) => <View key={message.id} style={[styles.chatBubble, message.user_id === user?.id && styles.myBubble]}><Text style={styles.chatMeta}>{message.user_id === user?.id ? 'You' : 'Group member'} · {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text><Text style={styles.chatText}>{message.body}</Text></View>) : <Text style={styles.muted}>No messages yet. Start the group conversation.</Text>}</View><View style={styles.chatInputRow}><TextInput value={chatDraft} onChangeText={setChatDraft} style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Message the group" placeholderTextColor={theme.colors.muted} /><Pressable onPress={() => void sendChat()} style={styles.sendButton}><Send size={17} color="#fff" /></Pressable></View></>}</View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}><View style={styles.headerIcon}><BookOpen size={22} color={theme.colors.blue} /></View><View style={{ flex: 1 }}><Text style={styles.eyebrow}>STUDY TOGETHER</Text><Text style={styles.title}>Whiteboard</Text></View><Pressable style={styles.iconButton} onPress={() => void loadLists()}><RefreshCw size={18} color={theme.colors.secondary} /></Pressable></View>
        <Text style={styles.subtitle}>Make notes together, discuss them in group chat, and ask grounded questions from your study materials.</Text>
        {!!error && <Text style={styles.notice}>{error}</Text>}
        <View style={styles.card}><Text style={styles.sectionTitle}>Create a group workspace</Text><Text style={styles.muted}>Add user IDs separated by commas, or attach a study group you already belong to.</Text><TextInput value={groupName} onChangeText={setGroupName} style={styles.input} placeholder="Group name" placeholderTextColor={theme.colors.muted} />
          {!!studyGroups.length && <><Text style={styles.label}>Use an existing study group</Text><View style={styles.chipWrap}><Pressable style={[styles.chip, !studyGroupId && styles.chipSelected]} onPress={() => setStudyGroupId('')}><Text style={[styles.chipText, !studyGroupId && styles.chipTextSelected]}>New group</Text></Pressable>{studyGroups.map((group) => <Pressable key={group.id} style={[styles.chip, studyGroupId === group.id && styles.chipSelected]} onPress={() => setStudyGroupId(studyGroupId === group.id ? '' : group.id)}><Text style={[styles.chipText, studyGroupId === group.id && styles.chipTextSelected]}>{group.name}</Text></Pressable>)}</View></>}
          {!studyGroupId && <TextInput value={memberIdsText} onChangeText={setMemberIdsText} style={styles.input} placeholder="Invite member user IDs (comma separated)" placeholderTextColor={theme.colors.muted} autoCapitalize="none" />}
          <Pressable style={styles.primaryButton} onPress={() => void createGroup()}><Plus size={17} color="#fff" /><Text style={styles.primaryText}>Create shared workspace</Text></Pressable>
        </View>
        <Text style={styles.sectionTitle}>Your workspaces</Text>
        {!groups.length ? <View style={styles.empty}><Users size={26} color={theme.colors.muted} /><Text style={styles.emptyTitle}>No shared workspaces yet</Text><Text style={styles.muted}>Create a workspace above or connect one to a study group.</Text></View> : groups.map((group) => <View key={group.id} style={styles.groupCard}><Pressable style={styles.groupOpen} onPress={() => { openGroup(group); setError(''); }}><View style={styles.groupIcon}><Users size={18} color={theme.colors.blue} /></View><View style={{ flex: 1 }}><Text style={styles.groupName}>{group.name}</Text><Text style={styles.muted}>{group.study_group_id ? 'Connected study group' : 'Independent group chat'} · Open notes and chat</Text></View><ChevronLeft size={18} color={theme.colors.muted} style={{ transform: [{ rotate: '180deg' }] }} /></Pressable>{group.created_by === user?.id && <Pressable style={styles.deleteButton} onPress={() => confirmDelete(group)} accessibilityLabel={`Delete ${group.name}`}><Trash2 size={17} color={theme.colors.red} /></Pressable>}</View>)}
      </ScrollView>
    </SafeAreaView>
  );
}

function MaterialPicker({ materials, selected, toggle }: { materials: MaterialItem[]; selected: string[]; toggle: (id: string) => void }) {
  if (!materials.length) return <Text style={styles.materialEmpty}>No ready materials available. Upload and process materials before asking grounded questions.</Text>;
  return <View style={styles.materialPicker}><Text style={styles.label}>Select authorized study material</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipWrap}>{materials.map((material) => <Pressable key={material.id} style={[styles.chip, selected.includes(material.id) && styles.chipSelected]} onPress={() => toggle(material.id)}><Text style={[styles.chipText, selected.includes(material.id) && styles.chipTextSelected]}>{selected.includes(material.id) ? '✓ ' : ''}{material.title}</Text></Pressable>)}</ScrollView></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg }, page: { padding: 18, paddingBottom: 40, gap: 14 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 }, headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  eyebrow: { fontSize: 10, color: theme.colors.blue, fontWeight: '800', letterSpacing: 1.2 }, title: { color: theme.colors.text, fontSize: 23, lineHeight: 29, fontWeight: '800' }, subtitle: { color: theme.colors.secondary, fontSize: 14, lineHeight: 21, marginTop: -8 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 12 }, sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sectionTitle: { fontSize: 16, color: theme.colors.text, fontWeight: '700' }, muted: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 }, statusRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: -8 }, statusText: { color: theme.colors.secondary, fontSize: 11 }, notice: { backgroundColor: theme.colors.amberSoft, color: theme.colors.amber, padding: 10, borderRadius: 10, fontSize: 12, lineHeight: 18 }, successNotice: { backgroundColor: theme.colors.greenSoft, color: theme.colors.green },
  input: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: theme.colors.text, fontSize: 14, minHeight: 44, marginTop: 2 }, label: { color: theme.colors.secondary, fontSize: 12, fontWeight: '700', marginTop: 4 }, primaryButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, backgroundColor: theme.colors.blue, borderRadius: 11 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 }, disabled: { opacity: 0.5 }, secondaryButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, backgroundColor: theme.colors.violetSoft, borderWidth: 1, borderColor: theme.colors.violetBorder, borderRadius: 11 }, secondaryText: { color: theme.colors.violet, fontSize: 13, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, maxWidth: 260 }, chipSelected: { borderColor: theme.colors.blue, backgroundColor: theme.colors.blueLight }, chipText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '600' }, chipTextSelected: { color: theme.colors.blueDark },
  empty: { alignItems: 'center', padding: 24, gap: 8, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border }, emptyTitle: { fontWeight: '700', color: theme.colors.text, fontSize: 14 }, groupCard: { backgroundColor: theme.colors.surface, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }, groupOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, deleteButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, groupIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.blueLight, alignItems: 'center', justifyContent: 'center' }, groupName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 3 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 }, smallAction: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 7 }, actionText: { color: theme.colors.blue, fontWeight: '700', fontSize: 11 }, titleInput: { fontSize: 18, color: theme.colors.text, fontWeight: '700', padding: 0 }, toolbar: { flexDirection: 'row', alignItems: 'center', gap: 7 }, tool: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 }, toolText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '700' }, editor: { minHeight: 230, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, color: theme.colors.text, fontSize: 15, lineHeight: 23 }, saveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, historyItem: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 5 }, historyTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text }, historyContent: { color: theme.colors.secondary, fontSize: 12, lineHeight: 18 },
  materialPicker: { gap: 8, marginVertical: 2 }, materialEmpty: { color: theme.colors.amber, fontSize: 12, lineHeight: 18, backgroundColor: theme.colors.amberSoft, padding: 10, borderRadius: 9 }, answerBox: { padding: 12, borderRadius: 11, borderWidth: 1, borderColor: theme.colors.violetBorder, backgroundColor: '#FAF8FF', gap: 8 }, answerText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 }, sourceText: { color: theme.colors.violet, fontSize: 10, fontWeight: '600' }, proposalBox: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }, proposalEditor: { minHeight: 150, borderWidth: 1, borderColor: theme.colors.violetBorder, borderRadius: 10, padding: 10, color: theme.colors.text, backgroundColor: '#FAF8FF', fontSize: 13, lineHeight: 20 }, buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  chatList: { gap: 8, maxHeight: 260 }, chatBubble: { backgroundColor: theme.colors.bg, borderRadius: 12, padding: 10, alignSelf: 'flex-start', maxWidth: '92%' }, myBubble: { backgroundColor: theme.colors.blueLight, alignSelf: 'flex-end' }, chatMeta: { color: theme.colors.muted, fontSize: 10, marginBottom: 4 }, chatText: { color: theme.colors.text, fontSize: 13, lineHeight: 18 }, chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sendButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.blue },
  conflictBox: { backgroundColor: theme.colors.amberSoft, borderWidth: 1, borderColor: theme.colors.amberBorder, borderRadius: 12, padding: 12, gap: 8 }, conflictTitle: { fontWeight: '700', color: theme.colors.amber, fontSize: 13 },
});
