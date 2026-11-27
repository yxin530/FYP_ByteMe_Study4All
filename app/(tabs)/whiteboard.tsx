import { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, Bot, Check, ChevronLeft, Clock3, MessageCircle, PanelLeft, Paperclip, Plus, RefreshCw, Send, Sparkles, Trash2, UserPlus, Users, WandSparkles, X } from 'lucide-react-native';
import { ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';
import { materialsApi, studyApi, tutorApi, whiteboardApi, type MaterialItem, type WhiteboardDocument, type WhiteboardGroup, type WhiteboardMessage } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

type StudyGroup = { id: string; name: string; subject: string };
type ProposedEdit = Awaited<ReturnType<typeof whiteboardApi.proposeEdit>>;

export default function WhiteboardScreen() {
  const params = useLocalSearchParams<{
    studyGroupId?: string;
    studyGroupName?: string;
    studyGroupSubject?: string;
  }>();
  const { isAuthenticated, session, user } = useAuth();
  const isDemo = session?.access_token === 'demo-guest-token';
  const [groups, setGroups] = useState<WhiteboardGroup[]>([]);
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [active, setActive] = useState<WhiteboardGroup | null>(null);
  const [document, setDocument] = useState<WhiteboardDocument | null>(null);
  const [messages, setMessages] = useState<WhiteboardMessage[]>([]);
  const [demoMessagesByGroup, setDemoMessagesByGroup] = useState<Record<string, WhiteboardMessage[]>>({
    'demo-wb-1': [
      { id: 'demo-m1', group_id: 'demo-wb-1', user_id: 'peer-1', body: 'I added the discriminant formula to the shared notes!', created_at: new Date().toISOString() },
    ],
  });
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
  const [showChat, setShowChat] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStudyGroup, setActiveStudyGroup] = useState<StudyGroup | null>(null);

  useEffect(() => {
    if (!params.studyGroupId) return;
    const incoming: StudyGroup = {
      id: params.studyGroupId,
      name: params.studyGroupName || 'Study Group',
      subject: params.studyGroupSubject || 'General',
    };
    setStudyGroups((prev) =>
      prev.some((g) => g.id === incoming.id) ? prev : [incoming, ...prev]
    );
    setActive(null);
    setActiveStudyGroup(incoming);
    setStudyGroupTab('chat');
  }, [params.studyGroupId, params.studyGroupName, params.studyGroupSubject]);
  const [studyGroupTab, setStudyGroupTab] = useState<'chat' | 'materials' | 'quiz'>('chat');
  const [studyGroupMessages, setStudyGroupMessages] = useState<Array<{ id: string; sender: string; isMe: boolean; body: string }>>([
    { id: 'sg-m1', sender: 'Arjun Nair', isMe: false, body: 'Anyone free on Wednesday for chapter 3?' },
    { id: 'sg-m2', sender: 'You', isMe: true, body: 'Yes! I shared my Quadratics notes.' },
    { id: 'sg-m3', sender: 'Mei Ling', isMe: false, body: "Let's do the weekly quiz after." },
  ]);
  const [studyGroupDraft, setStudyGroupDraft] = useState('');
  const [weeklyQuizData, setWeeklyQuizData] = useState<{
    questions: Array<{ id: string; question: string; options: string[]; correctAnswer?: string }>;
    sourceTitle?: string;
  } | null>(null);
  const [weeklyQuizLoading, setWeeklyQuizLoading] = useState(false);
  const [weeklyQuizAnswers, setWeeklyQuizAnswers] = useState<Record<string, string>>({});
  const [weeklyQuizScore, setWeeklyQuizScore] = useState<{ score: number; total: number } | null>(null);
  const [wbAiMode, setWbAiMode] = useState<'ask' | 'edit'>('ask');
  const [wbAiMessages, setWbAiMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; sources?: string[] }>>([]);
  const [wbAiDraft, setWbAiDraft] = useState('');
  const [aiSessions, setAiSessions] = useState<Array<{ id: string; title: string; messages: Array<{ id: string; role: 'user' | 'assistant'; text: string }> }>>([
    {
      id: 'ai-session-1',
      title: 'Quadratic Equations Help',
      messages: [
        { id: 'u-init', role: 'user', text: 'Summarize my Chapter 3 notes' },
        { id: 'a-init', role: 'assistant', text: 'Chapter 3 covers Quadratic Equations (`ax^2 + bx + c = 0`), the discriminant (`b^2 - 4ac`), and factorisation.' },
      ],
    },
  ]);
  const [activeAiSessionId, setActiveAiSessionId] = useState<string>('ai-session-1');
  const [aiDraft, setAiDraft] = useState('');
  const [aiSending, setAiSending] = useState(false);
  const [conflictDraft, setConflictDraft] = useState<{ content: string; currentContent: string; currentRevision: number } | null>(null);

  const bubblePan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        bubblePan.extractOffset();
      },
      onPanResponderMove: Animated.event([null, { dx: bubblePan.x, dy: bubblePan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        bubblePan.flattenOffset();
      },
    }),
  ).current;

  const loadLists = useCallback(async () => {
    if (!isAuthenticated) { setLoading(false); return; }
    if (isDemo) {
      setGroups([
        { id: 'demo-wb-1', name: 'Chapter 3 Study Notes', created_by: user?.id || 'demo-student-user', created_at: new Date().toISOString() },
      ]);
      setStudyGroups([{ id: 'demo-sg-1', name: 'Math Exam Prep', subject: 'Mathematics' }]);
      setMaterials([
        {
          id: 'demo-mat-1',
          user_id: user?.id || 'demo-student-user',
          title: 'Chapter 3: Quadratic Equations',
          material_type: 'pdf',
          processing_status: 'ready',
          version_hash: 'demo-hash-1234',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setError('');
      setLoading(false);
      return;
    }
    try {
      const [groupResult, studyResult, materialResult] = await Promise.all([whiteboardApi.groups(), whiteboardApi.studyGroups(), materialsApi.list()]);
      setGroups(groupResult.groups);
      setStudyGroups(studyResult.groups);
      setMaterials(materialResult.filter((item) => item.processing_status === 'ready' && item.version_hash));
      setError('');
    } catch (e: any) { setError(e?.message ?? 'Could not load whiteboard groups.'); }
    finally { setLoading(false); }
  }, [isAuthenticated, isDemo, user?.id]);

  useEffect(() => { void loadLists(); }, [loadLists]);

  const openGroup = (group: WhiteboardGroup) => { setDocument(null); setTitle(''); setContent(''); setExpectedRevision(0); setDirty(false); setConflictDraft(null); setMessages([]); setMembers([]); setHistory([]); setAnswer(''); setAnswerSources([]); setSelectedMaterials([]); setProposal(null); setActive(group); };

  const refreshActive = useCallback(async (initial = false) => {
    if (!active) return;
    if (isDemo) {
      if (initial) {
        const isSampleWb = active.id === 'demo-wb-1';
        const demoDoc: WhiteboardDocument = {
          id: `doc-${active.id}`,
          group_id: active.id,
          title: isSampleWb ? 'Quadratic Equations Summary' : active.name,
          content: isSampleWb
            ? '# Quadratic Equations\n\n- Standard form: `ax^2 + bx + c = 0`\n- Discriminant: `b^2 - 4ac`\n- Two real roots when discriminant > 0'
            : '',
          revision: 1,
          updated_by: user?.id || 'demo-student-user',
          updated_at: new Date().toISOString(),
        };
        setDocument(demoDoc);
        setTitle(demoDoc.title);
        setContent(demoDoc.content);
        setExpectedRevision(1);
        setDirty(false);
        const baseMembers = [{ user_id: user?.id || 'demo-student-user', role: 'owner' }, { user_id: 'peer-1', role: 'member' }];
        const sgMembers = active.study_group_id
          ? [{ user_id: 'Arjun Nair', role: 'member' }, { user_id: 'Mei Ling', role: 'member' }]
          : [];
        setMembers([...baseMembers, ...sgMembers]);
        setMessages(demoMessagesByGroup[active.id] ?? []);
      }
      setError('');
      return;
    }
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

  const activeAiSession = aiSessions.find((s) => s.id === activeAiSessionId) ?? aiSessions[0];
  const aiMessages = activeAiSession?.messages ?? [];

  const startNewAiChat = () => {
    const newId = `ai-session-${Date.now()}`;
    setAiSessions((prev) => [{ id: newId, title: 'New AI Chat', messages: [] }, ...prev]);
    setActiveAiSessionId(newId);
  };

  const appendAiMessage = (sessionId: string, msg: { id: string; role: 'user' | 'assistant'; text: string }) => {
    setAiSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const updatedTitle = s.messages.length === 0 && msg.role === 'user' ? msg.text.slice(0, 32) : s.title;
        return { ...s, title: updatedTitle, messages: [...s.messages, msg] };
      }),
    );
  };

  const sendAiMessage = async (preset?: string) => {
    const text = (preset ?? aiDraft).trim();
    if (!text || aiSending) return;
    const targetSessionId = activeAiSessionId;
    setAiDraft('');
    const userMsg = { id: `u-${Date.now()}`, role: 'user' as const, text };
    appendAiMessage(targetSessionId, userMsg);
    setAiSending(true);
    try {
      if (isDemo) {
        const reply = `Here is a grounded explanation based on your uploaded materials:\n\n• **Key concept**: ${text}\n• **Tip**: Review Chapter 3: Quadratic Equations for worked examples.`;
        appendAiMessage(targetSessionId, { id: `a-${Date.now()}`, role: 'assistant', text: reply });
        return;
      }
      const readyIds = materials.map((m) => m.id);
      const res: any = await tutorApi.sendMessage({
        message: text,
        materialIds: readyIds,
      });
      const replyText = res?.reply ?? res?.answer ?? res?.explanation ?? 'I could not find a grounded answer in your materials.';
      appendAiMessage(targetSessionId, { id: `a-${Date.now()}`, role: 'assistant', text: replyText });
    } catch (e: any) {
      appendAiMessage(targetSessionId, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: e?.message ?? 'Unable to reach Study4All AI right now.',
      });
    } finally {
      setAiSending(false);
    }
  };

  const sendStudyGroupMsg = () => {
    const text = studyGroupDraft.trim();
    if (!text) return;
    setStudyGroupMessages((prev) => [...prev, { id: `sg-m-${Date.now()}`, sender: 'You', isMe: true, body: text }]);
    setStudyGroupDraft('');
  };

  const sendWbAi = async () => {
    const text = wbAiDraft.trim();
    if (!active || !text) return;
    if (!selectedMaterials.length) {
      Alert.alert('Select study material', 'Choose at least one ready material so the AI can stay grounded.');
      return;
    }
    setWbAiDraft('');
    setWbAiMessages((prev) => [...prev, { id: `wb-u-${Date.now()}`, role: 'user', text }]);

    if (wbAiMode === 'edit') {
      if (isDemo) {
        const nextText = `${content}\n\n## AI Proposed Addition\n- ${text}`;
        setProposal({
          title,
          proposedContent: nextText,
          expectedRevision,
          sourceReferences: [{ materialId: selectedMaterials[0], title: materials[0]?.title || 'Demo Material', materialVersionHash: 'demo-hash-1234' }],
        } as any);
        setProposedContent(nextText);
        setWbAiMessages((prev) => [
          ...prev,
          { id: `wb-a-${Date.now()}`, role: 'assistant', text: 'I drafted a proposed edit below. Review and accept it to apply to your notes.' },
        ]);
        return;
      }
      try {
        const result = await whiteboardApi.proposeEdit(active.id, text, selectedMaterials);
        setProposal(result);
        setProposedContent(result.proposedContent);
        setWbAiMessages((prev) => [
          ...prev,
          { id: `wb-a-${Date.now()}`, role: 'assistant', text: 'I drafted a proposed edit below. Review and accept it to apply to your notes.' },
        ]);
      } catch (e: any) {
        Alert.alert('Could not propose an edit', e?.message ?? 'The selected materials may not support this change.');
      }
      return;
    }

    if (isDemo) {
      setWbAiMessages((prev) => [
        ...prev,
        {
          id: `wb-a-${Date.now()}`,
          role: 'assistant',
          text: `Based on your selected notes: ${text} — remember to check the discriminant b^2 - 4ac.`,
          sources: ['Chapter 3: Quadratic Equations · demo-hash'],
        },
      ]);
      return;
    }
    try {
      const result = await whiteboardApi.ask(active.id, text, selectedMaterials);
      const sources = [...new Set(result.sourceReferences.map((source) => `${source.title} · ${source.materialVersionHash.slice(0, 10)}`))];
      setWbAiMessages((prev) => [...prev, { id: `wb-a-${Date.now()}`, role: 'assistant', text: result.answer, sources }]);
    } catch (e: any) {
      Alert.alert('Could not answer', e?.message ?? 'The selected materials may not support this question.');
    }
  };

  const sendChat = async () => {
    if (!active || !chatDraft.trim()) return;
    const text = chatDraft.trim();
    if (isDemo) {
      const newMsg: WhiteboardMessage = {
        id: `demo-m-${Date.now()}`,
        group_id: active.id,
        user_id: user?.id || 'demo-student-user',
        body: text,
        created_at: new Date().toISOString(),
      };
      setDemoMessagesByGroup((prev) => ({
        ...prev,
        [active.id]: [...(prev[active.id] ?? []), newMsg],
      }));
      setMessages((prev) => [...prev, newMsg]);
      setChatDraft('');
      return;
    }
    try { await whiteboardApi.sendMessage(active.id, text); setChatDraft(''); await refreshActive(); }
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

  const renderDrawer = () => (
    <Modal
      visible={drawerOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setDrawerOpen(false)}
    >
      <View style={styles.drawerOverlay}>
        <View style={styles.drawerPanel}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Chats & Groups</Text>
            <Pressable onPress={() => setDrawerOpen(false)} hitSlop={8}>
              <X size={20} color={theme.colors.secondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.drawerList}>
            <Text style={styles.drawerSection}>AI TUTOR CHAT HISTORY</Text>
            {aiSessions.map((sItem) => {
              const isSelected = !active && !activeStudyGroup && sItem.id === activeAiSessionId;
              return (
                <Pressable
                  key={sItem.id}
                  style={[styles.drawerItem, isSelected && styles.drawerItemActive]}
                  onPress={() => {
                    setActiveStudyGroup(null);
                    setActive(null);
                    setActiveAiSessionId(sItem.id);
                    setDrawerOpen(false);
                  }}
                >
                  <Bot size={18} color={theme.colors.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerItemTitle} numberOfLines={1}>{sItem.title}</Text>
                    <Text style={styles.muted}>{sItem.messages.length} messages</Text>
                  </View>
                </Pressable>
              );
            })}

            <Text style={styles.drawerSection}>STUDY GROUP CHATS</Text>
            {studyGroups.length === 0 ? (
              <Text style={styles.muted}>No study groups yet.</Text>
            ) : (
              studyGroups.map((sg) => (
                <Pressable
                  key={sg.id}
                  style={[styles.drawerItem, activeStudyGroup?.id === sg.id && styles.drawerItemActive]}
                  onPress={() => {
                    setActive(null);
                    setDrawerOpen(false);
                    setActiveStudyGroup(sg);
                    setStudyGroupTab('chat');
                  }}
                >
                  <MessageCircle size={18} color={theme.colors.violet} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerItemTitle}>{sg.name}</Text>
                    <Text style={styles.muted}>{sg.subject} · Group Chat</Text>
                  </View>
                </Pressable>
              ))
            )}

            <Text style={styles.drawerSection}>COLLABORATIVE WHITEBOARDS</Text>
            {groups.length === 0 ? (
              <Text style={styles.muted}>No whiteboards yet.</Text>
            ) : (
              groups.map((group) => (
                <Pressable
                  key={group.id}
                  style={[styles.drawerItem, active?.id === group.id && styles.drawerItemActive]}
                  onPress={() => {
                    setActiveStudyGroup(null);
                    setDrawerOpen(false);
                    openGroup(group);
                  }}
                >
                  <BookOpen size={18} color={theme.colors.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerItemTitle}>{group.name}</Text>
                    <Text style={styles.muted}>Shared notes & floating chat</Text>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
        <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
      </View>
    </Modal>
  );

  if (activeStudyGroup) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Study Group Header with sidebar icon */}
      <View style={styles.sgHeader}>
        <Pressable
          style={styles.iconButton}
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open chats and groups sidebar"
        >
          <PanelLeft size={20} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.sgTitle}>{activeStudyGroup.name}</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push('/study-features')}
          accessibilityLabel="Study group members"
        >
          <Users size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Segmented Tabs: Chat | Shared materials | Weekly quiz */}
      <View style={styles.sgSegmentWrap}>
        <View style={styles.sgSegmentBar}>
          {[
            { key: 'chat', label: 'Chat' },
            { key: 'materials', label: 'Shared materials' },
            { key: 'quiz', label: 'Weekly quiz' },
          ].map((tab) => {
            const selected = studyGroupTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.sgSegment, selected && styles.sgSegmentActive]}
                onPress={() => setStudyGroupTab(tab.key as 'chat' | 'materials' | 'quiz')}
              >
                <Text style={[styles.sgSegmentText, selected && styles.sgSegmentTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {studyGroupTab === 'chat' && (
        <>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sgChatList}>
            <View style={styles.sgWelcomeBanner}>
              <Sparkles size={15} color={theme.colors.blue} />
              <Text style={styles.sgWelcomeText}>
                You&apos;re connected! You can now text, share materials, or study together.
              </Text>
            </View>
            {studyGroupMessages.map((msg) => (
              <View key={msg.id} style={msg.isMe ? styles.sgMyRow : styles.sgOtherRow}>
                {!msg.isMe && <Text style={styles.sgSender}>{msg.sender}</Text>}
                <View style={msg.isMe ? styles.sgMyBubble : styles.sgOtherBubble}>
                  <Text style={msg.isMe ? styles.llmUserText : styles.llmAiText}>{msg.body}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.llmComposerWrap}>
            <View style={styles.llmComposer}>
              <Pressable
                onPress={() =>
                  Alert.alert('Attach & Upload', 'Choose what you want to upload:', [
                    { text: 'Document / PDF', onPress: () => router.push('/materials') },
                    { text: 'Image / Video', onPress: () => router.push('/materials') },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
                style={{ padding: 6 }}
              >
                <Paperclip size={18} color={theme.colors.secondary} />
              </Pressable>
              <TextInput
                value={studyGroupDraft}
                onChangeText={setStudyGroupDraft}
                style={styles.llmInput}
                placeholder="Message the group..."
                placeholderTextColor={theme.colors.muted}
              />
              <Pressable
                style={[styles.llmSendBtn, !studyGroupDraft.trim() && styles.disabled]}
                onPress={sendStudyGroupMsg}
                disabled={!studyGroupDraft.trim()}
              >
                <Send size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        </>
      )}

      {studyGroupTab === 'materials' && (
        <ScrollView contentContainerStyle={styles.page}>
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              const existing = groups.find((g) => g.study_group_id === activeStudyGroup.id);
              if (existing) {
                setActiveStudyGroup(null);
                openGroup(existing);
                return;
              }
              if (isDemo) {
                const newWb: WhiteboardGroup = {
                  id: `wb-${activeStudyGroup.id}-${Date.now()}`,
                  name: `${activeStudyGroup.name} Whiteboard`,
                  created_by: user?.id || 'demo-student-user',
                  study_group_id: activeStudyGroup.id,
                  created_at: new Date().toISOString(),
                };
                setGroups((prev) => [newWb, ...prev]);
                setActiveStudyGroup(null);
                openGroup(newWb);
                return;
              }
              try {
                const res = await whiteboardApi.createGroup({
                  name: `${activeStudyGroup.name} Whiteboard`,
                  studyGroupId: activeStudyGroup.id,
                });
                setGroups((prev) => [res.group, ...prev]);
                setActiveStudyGroup(null);
                openGroup(res.group);
              } catch (e: any) {
                Alert.alert('Could not open whiteboard', e?.message ?? 'Try again.');
              }
            }}
          >
            <BookOpen size={16} color="#FFFFFF" />
            <Text style={styles.primaryText}>Open Whiteboard</Text>
          </Pressable>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Shared Materials</Text>
            {materials.length === 0 ? (
              <Text style={styles.muted}>No shared materials yet.</Text>
            ) : (
              materials.map((m) => (
                <View key={m.id} style={styles.historyItem}>
                  <Text style={styles.historyTitle}>{m.title}</Text>
                  <Text style={styles.muted}>{m.material_type?.toUpperCase() || 'PDF'} · Ready</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {studyGroupTab === 'quiz' && (
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Weekly Group Quiz</Text>
            <Text style={styles.muted}>
              AI-generated quiz grounded in {activeStudyGroup.name}&apos;s shared materials ({activeStudyGroup.subject}).
            </Text>
            <Pressable
              style={styles.primaryButton}
              disabled={weeklyQuizLoading}
              onPress={async () => {
                setWeeklyQuizLoading(true);
                setWeeklyQuizAnswers({});
                setWeeklyQuizScore(null);
                if (isDemo) {
                  const matTitle = materials[0]?.title || `${activeStudyGroup.subject} Notes`;
                  setWeeklyQuizData({
                    sourceTitle: matTitle,
                    questions: [
                      {
                        id: 'wq-1',
                        question: `Based on ${matTitle}, what is the standard form of a quadratic equation?`,
                        options: ['ax² + bx + c = 0', 'ax + b = 0', 'a² + b² = c²', 'y = mx + c'],
                        correctAnswer: 'ax² + bx + c = 0',
                      },
                      {
                        id: 'wq-2',
                        question: `In ${matTitle}, what does the discriminant (b² - 4ac) < 0 indicate?`,
                        options: ['Two real roots', 'One repeated root', 'No real roots', 'Infinite roots'],
                        correctAnswer: 'No real roots',
                      },
                      {
                        id: 'wq-3',
                        question: 'Which method finds two numbers that multiply to c and add to b in x² + bx + c = 0?',
                        options: ['Factorisation', 'Integration', 'Differentiation', 'Long division'],
                        correctAnswer: 'Factorisation',
                      },
                    ],
                  });
                  setWeeklyQuizLoading(false);
                  return;
                }
                try {
                  const res: any = await studyApi.weeklyQuiz(activeStudyGroup.id, 5);
                  const questions = res?.questions ?? res?.quiz?.questions ?? [];
                  if (questions.length === 0) {
                    Alert.alert('No materials yet', 'Share or upload study materials in this group first so the AI can generate a grounded weekly quiz.');
                  } else {
                    setWeeklyQuizData({
                      questions,
                      sourceTitle: materials[0]?.title || activeStudyGroup.subject,
                    });
                  }
                } catch (e: any) {
                  Alert.alert('Weekly quiz error', e?.message ?? 'Could not generate weekly quiz from group materials.');
                } finally {
                  setWeeklyQuizLoading(false);
                }
              }}
            >
              {weeklyQuizLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Sparkles size={16} color="#FFFFFF" />
              )}
              <Text style={styles.primaryText}>
                {weeklyQuizData ? 'Regenerate Weekly Quiz' : 'Generate Weekly Quiz'}
              </Text>
            </Pressable>
          </View>

          {weeklyQuizData && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Grounded in: {weeklyQuizData.sourceTitle || activeStudyGroup.subject}
              </Text>
              {weeklyQuizData.questions.map((q, idx) => (
                <View key={q.id || idx} style={{ marginTop: 12, gap: 6 }}>
                  <Text style={styles.historyTitle}>{idx + 1}. {q.question}</Text>
                  {(q.options ?? []).map((opt) => {
                    const selected = weeklyQuizAnswers[q.id] === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setWeeklyQuizAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        style={[
                          styles.historyItem,
                          selected && { borderColor: theme.colors.blue, backgroundColor: theme.colors.blueLight },
                        ]}
                      >
                        <Text style={[styles.llmAiText, selected && { color: theme.colors.blue, fontWeight: '700' }]}>
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <Pressable
                style={[styles.primaryButton, { marginTop: 16 }]}
                onPress={() => {
                  const qs = weeklyQuizData.questions;
                  let correct = 0;
                  qs.forEach((q) => {
                    if (q.correctAnswer && weeklyQuizAnswers[q.id] === q.correctAnswer) {
                      correct += 1;
                    }
                  });
                  setWeeklyQuizScore({ score: correct, total: qs.length });
                }}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.primaryText}>Submit Weekly Quiz</Text>
              </Pressable>
              {weeklyQuizScore && (
                <View style={[styles.sgWelcomeBanner, { marginTop: 12 }]}>
                  <Sparkles size={15} color={theme.colors.blue} />
                  <Text style={styles.sgWelcomeText}>
                    Score: {weeklyQuizScore.score} / {weeklyQuizScore.total} ({Math.round((weeklyQuizScore.score / Math.max(1, weeklyQuizScore.total)) * 100)}%)
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
      {renderDrawer()}
    </SafeAreaView>
  );

  if (active) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => setDrawerOpen(true)} accessibilityLabel="Open chats and groups sidebar"><PanelLeft size={20} color={theme.colors.text} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>SHARED WHITEBOARD</Text><Text style={styles.title}>{active.name}</Text></View>
          <Pressable style={styles.iconButton} onPress={() => setShowAddMember((v) => !v)} accessibilityLabel="Add member"><UserPlus size={18} color={theme.colors.blue} /></Pressable>
          <Pressable style={styles.iconButton} onPress={() => void refreshActive()}><RefreshCw size={18} color={theme.colors.secondary} /></Pressable>
        </View>
        {showAddMember && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Member to Whiteboard</Text>
            <View style={styles.chatInputRow}>
              <TextInput
                value={newMemberId}
                onChangeText={setNewMemberId}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Enter member email or user ID..."
                placeholderTextColor={theme.colors.muted}
              />
              <Pressable
                style={styles.primaryButton}
                onPress={() => {
                  const id = newMemberId.trim();
                  if (!id) return;
                  setMembers((prev) => [...prev, { user_id: id, role: 'member' }]);
                  setNewMemberId('');
                  setShowAddMember(false);
                  Alert.alert('Member added', `${id} can now view and chat in this whiteboard.`);
                }}
              >
                <Text style={styles.primaryText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}
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

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <View style={styles.inline}>
              <Sparkles size={18} color={theme.colors.violet} />
              <Text style={styles.sectionTitle}>AI Notes Assistant</Text>
            </View>
            <View style={styles.modePills}>
              <Pressable
                style={[styles.modePill, wbAiMode === 'ask' && styles.modePillActive]}
                onPress={() => setWbAiMode('ask')}
              >
                <Text style={[styles.modePillText, wbAiMode === 'ask' && styles.modePillTextActive]}>Ask AI</Text>
              </Pressable>
              <Pressable
                style={[styles.modePill, wbAiMode === 'edit' && styles.modePillActive]}
                onPress={() => setWbAiMode('edit')}
              >
                <Text style={[styles.modePillText, wbAiMode === 'edit' && styles.modePillTextActive]}>Propose Edit</Text>
              </Pressable>
            </View>
          </View>
          <MaterialPicker materials={materials} selected={selectedMaterials} toggle={toggleMaterial} />
          {wbAiMessages.length > 0 && (
            <View style={styles.chatList}>
              {wbAiMessages.map((m) => (
                <View key={m.id} style={[styles.chatBubble, m.role === 'user' && styles.myBubble]}>
                  <Text style={styles.chatMeta}>{m.role === 'user' ? 'You' : 'Study4All AI'}</Text>
                  <Text style={styles.chatText}>{m.text}</Text>
                  {m.sources?.map((src) => (
                    <Text key={src} style={styles.sourceText}>Source · {src}</Text>
                  ))}
                </View>
              ))}
            </View>
          )}
          {proposal && (
            <View style={styles.proposalBox}>
              <Text style={styles.sectionTitle}>Review proposed changes</Text>
              <TextInput value={proposedContent} onChangeText={setProposedContent} style={styles.proposalEditor} multiline textAlignVertical="top" />
              <Text style={styles.muted}>Sources: {proposal.sourceReferences.map((source) => source.title).join(', ')}</Text>
              <View style={styles.buttonRow}>
                <Pressable style={styles.secondaryButton} onPress={() => setProposal(null)}><Text style={styles.secondaryText}>Discard</Text></Pressable>
                <Pressable style={styles.primaryButton} onPress={() => void acceptProposal()}><Check size={16} color="#fff" /><Text style={styles.primaryText}>Accept and apply</Text></Pressable>
              </View>
            </View>
          )}
          <View style={styles.chatInputRow}>
            <TextInput
              value={wbAiDraft}
              onChangeText={setWbAiDraft}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder={wbAiMode === 'ask' ? 'Ask AI about your notes…' : 'Describe how AI should edit your notes…'}
              placeholderTextColor={theme.colors.muted}
            />
            <Pressable onPress={() => void sendWbAi()} style={styles.sendButton}>
              <Send size={16} color="#fff" />
            </Pressable>
          </View>
        </View>

      </ScrollView>

      <Modal
        visible={showChat}
        animationType="slide"
        onRequestClose={() => setShowChat(false)}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
              <View style={[styles.inline, { flex: 1, marginRight: 12 }]}>
                <MessageCircle size={18} color={theme.colors.blue} />
                <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>
                  {active.name} · Group Chat
                </Text>
              </View>
              <Pressable
                onPress={() => setShowChat(false)}
                hitSlop={12}
                style={[styles.iconButton, { flexShrink: 0 }]}
                accessibilityLabel="Close group chat"
              >
                <X size={20} color={theme.colors.text} />
              </Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
              {messages.length ? (
                messages.map((message) => (
                  <View key={message.id} style={[styles.chatBubble, message.user_id === user?.id && styles.myBubble]}>
                    <Text style={styles.chatMeta}>
                      {message.user_id === user?.id ? 'You' : 'Group member'} ·{' '}
                      {new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.chatText}>{message.body}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.muted}>No messages yet. Start the conversation.</Text>
              )}
            </ScrollView>
            <View style={[styles.chatInputRow, { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <Pressable
                onPress={() =>
                  Alert.alert('Attach & Upload', 'Choose what you want to upload:', [
                    { text: 'Document / PDF', onPress: () => router.push('/materials') },
                    { text: 'Image / Video', onPress: () => router.push('/materials') },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
                style={{ padding: 6 }}
                accessibilityLabel="Attach file, image, video, or document"
              >
                <Paperclip size={18} color={theme.colors.secondary} />
              </Pressable>
              <TextInput
                value={chatDraft}
                onChangeText={setChatDraft}
                style={[styles.input, { flex: 1, marginBottom: 0, minHeight: 40, paddingVertical: 8 }]}
                placeholder="Message group..."
                placeholderTextColor={theme.colors.muted}
              />
              <Pressable onPress={() => void sendChat()} style={[styles.sendButton, { width: 40, height: 40 }]}>
                <Send size={16} color="#fff" />
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Draggable Floating Group Chat Bubble */}
      <Animated.View
        style={[
          styles.floatingWrap,
          { transform: [{ translateX: bubblePan.x }, { translateY: bubblePan.y }] },
        ]}
        {...panResponder.panHandlers}
      >

        <Pressable
          style={styles.floatingBubble}
          onPress={() => setShowChat((v) => !v)}
          accessibilityLabel="Toggle group chat"
        >
          <MessageCircle size={22} color="#FFFFFF" />
          {messages.length > 0 && (
            <View style={styles.bubbleBadge}>
              <Text style={styles.bubbleBadgeText}>{messages.length}</Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
      {renderDrawer()}
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top LLM-style Header */}
      <View style={styles.llmHeader}>
        <Pressable
          style={styles.iconButton}
          onPress={() => setDrawerOpen(true)}
          accessibilityLabel="Open group chats and whiteboards"
        >
          <PanelLeft size={20} color={theme.colors.text} />
        </Pressable>
        <View style={styles.llmTitleWrap}>
          <Bot size={18} color={theme.colors.blue} />
          <Text style={styles.llmTitle}>Study4All AI</Text>
        </View>
        <Pressable
          style={styles.iconButton}
          onPress={startNewAiChat}
          accessibilityLabel="New chat"
        >
          <Plus size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Main Conversational Area */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.llmMessages}
        keyboardShouldPersistTaps="handled"
      >
        {aiMessages.length === 0 ? (
          <View style={styles.llmEmpty}>
            <View style={styles.llmLogo}>
              <Sparkles size={28} color={theme.colors.blue} />
            </View>
            <Text style={styles.llmWelcome}>How can I help you study today?</Text>
            <Text style={styles.llmSub}>
              Ask questions grounded in your uploaded materials, or tap the top-left icon to open your group chats and whiteboards.
            </Text>
            <View style={styles.promptGrid}>
              {[
                'Summarize my Chapter 3 notes',
                'Explain the discriminant formula',
                'Quiz me on quadratic equations',
              ].map((prompt) => (
                <Pressable
                  key={prompt}
                  style={styles.promptChip}
                  onPress={() => void sendAiMessage(prompt)}
                >
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          aiMessages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.llmBubble,
                msg.role === 'user' ? styles.llmUserBubble : styles.llmAiBubble,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.llmAiBadge}>
                  <Bot size={13} color={theme.colors.blue} />
                  <Text style={styles.llmAiBadgeText}>Study4All AI</Text>
                </View>
              )}
              <Text style={msg.role === 'user' ? styles.llmUserText : styles.llmAiText}>
                {msg.text}
              </Text>
            </View>
          ))
        )}
        {aiSending && (
          <View style={[styles.llmBubble, styles.llmAiBubble]}>
            <ActivityIndicator size="small" color={theme.colors.blue} />
          </View>
        )}
      </ScrollView>

      {/* Bottom Composer */}
      <View style={styles.llmComposerWrap}>
        <View style={styles.llmComposer}>
          <Pressable
            onPress={() =>
              Alert.alert('Attach & Upload', 'Choose what you want to upload:', [
                { text: 'Document / PDF', onPress: () => router.push('/materials') },
                { text: 'Image / Video', onPress: () => router.push('/materials') },
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            style={{ padding: 6 }}
            accessibilityLabel="Attach file, image, video, or document"
          >
            <Paperclip size={18} color={theme.colors.secondary} />
          </Pressable>
          <TextInput
            value={aiDraft}
            onChangeText={setAiDraft}
            style={styles.llmInput}
            placeholder="Message Study4All AI..."
            placeholderTextColor={theme.colors.muted}
            multiline
          />
          <Pressable
            style={[styles.llmSendBtn, (!aiDraft.trim() || aiSending) && styles.disabled]}
            onPress={() => void sendAiMessage()}
            disabled={!aiDraft.trim() || aiSending}
          >
            <Send size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Top-Left Drawer Modal for Group Chats & Whiteboards */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Chats & Groups</Text>
              <Pressable onPress={() => setDrawerOpen(false)} hitSlop={8}>
                <X size={20} color={theme.colors.secondary} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.drawerList}>
              <Text style={styles.drawerSection}>AI TUTOR CHAT HISTORY</Text>
              {aiSessions.map((sItem) => {
                const isSelected = sItem.id === activeAiSessionId;
                return (
                  <Pressable
                    key={sItem.id}
                    style={[styles.drawerItem, isSelected && styles.drawerItemActive]}
                    onPress={() => {
                      setActiveAiSessionId(sItem.id);
                      setDrawerOpen(false);
                    }}
                  >
                    <Bot size={18} color={theme.colors.blue} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawerItemTitle} numberOfLines={1}>{sItem.title}</Text>
                      <Text style={styles.muted}>{sItem.messages.length} messages</Text>
                    </View>
                  </Pressable>
                );
              })}

              <Text style={styles.drawerSection}>STUDY GROUP CHATS</Text>
              {studyGroups.length === 0 ? (
                <Text style={styles.muted}>No study groups yet.</Text>
              ) : (
                studyGroups.map((sg) => (
                  <Pressable
                    key={sg.id}
                    style={styles.drawerItem}
                    onPress={() => {
                      setDrawerOpen(false);
                      setActiveStudyGroup(sg);
                      setStudyGroupTab('chat');
                    }}
                  >
                    <MessageCircle size={18} color={theme.colors.violet} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawerItemTitle}>{sg.name}</Text>
                      <Text style={styles.muted}>{sg.subject} · Group Chat</Text>
                    </View>
                  </Pressable>
                ))
              )}

              <Text style={styles.drawerSection}>COLLABORATIVE WHITEBOARDS</Text>
              {groups.length === 0 ? (
                <Text style={styles.muted}>No whiteboards yet.</Text>
              ) : (
                groups.map((group) => (
                  <Pressable
                    key={group.id}
                    style={styles.drawerItem}
                    onPress={() => {
                      setDrawerOpen(false);
                      openGroup(group);
                    }}
                  >
                    <BookOpen size={18} color={theme.colors.blue} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawerItemTitle}>{group.name}</Text>
                      <Text style={styles.muted}>Shared notes & floating chat</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
          <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );

  // Legacy list view kept unreachable unless needed
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}><MessageCircle size={22} color={theme.colors.blue} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>ALL-IN-ONE CHAT</Text>
            <Text style={styles.title}>Chats & Whiteboards</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => void loadLists()}><RefreshCw size={18} color={theme.colors.secondary} /></Pressable>
        </View>
        <Text style={styles.subtitle}>Tap any study group chat or collaborative whiteboard below to jump straight in.</Text>

        {studyGroups.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Study Group Chats</Text>
            {studyGroups.map((sg) => (
              <Pressable
                key={sg.id}
                style={styles.groupCard}
                onPress={() => router.push('/study-features')}
              >
                <View style={styles.groupOpen}>
                  <View style={[styles.groupIcon, { backgroundColor: theme.colors.violetSoft }]}>
                    <MessageCircle size={18} color={theme.colors.violet} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{sg.name}</Text>
                    <Text style={styles.muted}>{sg.subject} · Study Group Chat</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
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
  card: { backgroundColor: theme.colors.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: theme.colors.border, gap: 12 }, sectionHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, sectionTitle: { fontSize: 16, color: theme.colors.text, fontWeight: '700' }, muted: { color: theme.colors.muted, fontSize: 12, lineHeight: 17 }, statusRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: -8 }, statusText: { color: theme.colors.secondary, fontSize: 11 }, notice: { backgroundColor: theme.colors.amberSoft, color: theme.colors.amber, padding: 10, borderRadius: 10, fontSize: 12, lineHeight: 18 }, successNotice: { backgroundColor: theme.colors.greenSoft, color: theme.colors.green },
  input: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: theme.colors.text, fontSize: 14, minHeight: 44, marginTop: 2 }, label: { color: theme.colors.secondary, fontSize: 12, fontWeight: '700', marginTop: 4 }, primaryButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, backgroundColor: theme.colors.blue, borderRadius: 11 }, primaryText: { color: '#fff', fontWeight: '700', fontSize: 13 }, disabled: { opacity: 0.5 }, secondaryButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12, backgroundColor: theme.colors.violetSoft, borderWidth: 1, borderColor: theme.colors.violetBorder, borderRadius: 11 }, secondaryText: { color: theme.colors.violet, fontSize: 13, fontWeight: '700' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, maxWidth: 260 }, chipSelected: { borderColor: theme.colors.blue, backgroundColor: theme.colors.blueLight }, chipText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '600' }, chipTextSelected: { color: theme.colors.blueDark },
  empty: { alignItems: 'center', padding: 24, gap: 8, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border }, emptyTitle: { fontWeight: '700', color: theme.colors.text, fontSize: 14 }, groupCard: { backgroundColor: theme.colors.surface, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 5 }, groupOpen: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, deleteButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, groupIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.colors.blueLight, alignItems: 'center', justifyContent: 'center' }, groupName: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 3 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 }, smallAction: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 7 }, actionText: { color: theme.colors.blue, fontWeight: '700', fontSize: 11 }, titleInput: { fontSize: 18, color: theme.colors.text, fontWeight: '700', padding: 0 }, toolbar: { flexDirection: 'row', alignItems: 'center', gap: 7 }, tool: { backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10 }, toolText: { color: theme.colors.secondary, fontSize: 11, fontWeight: '700' }, editor: { minHeight: 230, backgroundColor: theme.colors.bg, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, color: theme.colors.text, fontSize: 15, lineHeight: 23 }, saveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, historyItem: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.colors.border, gap: 5 }, historyTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text }, historyContent: { color: theme.colors.secondary, fontSize: 12, lineHeight: 18 },
  materialPicker: { gap: 8, marginVertical: 2 }, materialEmpty: { color: theme.colors.amber, fontSize: 12, lineHeight: 18, backgroundColor: theme.colors.amberSoft, padding: 10, borderRadius: 9 }, answerBox: { padding: 12, borderRadius: 11, borderWidth: 1, borderColor: theme.colors.violetBorder, backgroundColor: '#FAF8FF', gap: 8 }, answerText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 }, sourceText: { color: theme.colors.violet, fontSize: 10, fontWeight: '600' }, proposalBox: { gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }, proposalEditor: { minHeight: 150, borderWidth: 1, borderColor: theme.colors.violetBorder, borderRadius: 10, padding: 10, color: theme.colors.text, backgroundColor: '#FAF8FF', fontSize: 13, lineHeight: 20 }, buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  chatList: { gap: 8, maxHeight: 260 }, chatBubble: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, padding: 12, alignSelf: 'flex-start', maxWidth: '88%' }, myBubble: { backgroundColor: theme.colors.blueLight, borderWidth: 1, borderColor: theme.colors.blueBorder, alignSelf: 'flex-end' }, chatMeta: { color: theme.colors.secondary, fontSize: 10, fontWeight: '600', marginBottom: 4 }, chatText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 }, chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, sendButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.blue },
  conflictBox: { backgroundColor: theme.colors.amberSoft, borderWidth: 1, borderColor: theme.colors.amberBorder, borderRadius: 12, padding: 12, gap: 8 }, conflictTitle: { fontWeight: '700', color: theme.colors.amber, fontSize: 13 },
  floatingWrap: { position: 'absolute', right: 18, bottom: 24, alignItems: 'flex-end', zIndex: 50 },
  floatingBubble: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.colors.blue, alignItems: 'center', justifyContent: 'center', ...theme.shadows.elevated },
  bubbleBadge: { position: 'absolute', top: -2, right: -2, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.violet, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  bubbleBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  floatingChatCard: { width: 290, maxHeight: 320, backgroundColor: theme.colors.surface, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 10, gap: 8, ...theme.shadows.elevated },
  floatingChatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  floatingChatList: { maxHeight: 185 },
  llmHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  llmTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  llmTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text },
  llmMessages: { padding: 16, gap: 12, flexGrow: 1 },
  llmEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  llmLogo: { width: 56, height: 56, borderRadius: 18, backgroundColor: theme.colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  llmWelcome: { fontSize: 20, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  llmSub: { fontSize: 13, color: theme.colors.secondary, textAlign: 'center', lineHeight: 19, maxWidth: 300 },
  promptGrid: { width: '100%', gap: 8, marginTop: 12 },
  promptChip: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14 },
  promptChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  llmBubble: { maxWidth: '88%', borderRadius: 16, padding: 13 },
  llmUserBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.blue },
  llmAiBubble: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#CBD5E1' },
  llmAiBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  llmAiBadgeText: { fontSize: 11, fontWeight: '700', color: theme.colors.blue },
  llmUserText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  llmAiText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  llmComposerWrap: { padding: 12, backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border },
  llmComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, backgroundColor: theme.colors.bg, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 12, paddingVertical: 6 },
  llmInput: { flex: 1, fontSize: 14, color: theme.colors.text, maxHeight: 100, paddingVertical: 6 },
  llmSendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.blue, alignItems: 'center', justifyContent: 'center' },
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  drawerPanel: { width: 290, backgroundColor: theme.colors.surface, paddingTop: 54, paddingHorizontal: 16, paddingBottom: 24, borderRightWidth: 1, borderRightColor: theme.colors.border },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  drawerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  drawerList: { gap: 8, paddingBottom: 24 },
  drawerSection: { fontSize: 11, fontWeight: '800', color: theme.colors.muted, marginTop: 12, marginBottom: 4, letterSpacing: 0.6 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
  drawerItemActive: { borderColor: theme.colors.blue, backgroundColor: theme.colors.blueLight },
  drawerItemTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  modePills: { flexDirection: 'row', gap: 6 },
  modePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.bg },
  modePillActive: { borderColor: theme.colors.violet, backgroundColor: theme.colors.violetSoft },
  modePillText: { fontSize: 11, fontWeight: '700', color: theme.colors.secondary },
  modePillTextActive: { color: theme.colors.violet },
  sgHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sgTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  sgSegmentWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.surface },
  sgSegmentBar: { flexDirection: 'row', backgroundColor: theme.colors.bg, borderRadius: 12, padding: 4 },
  sgSegment: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  sgSegmentActive: { backgroundColor: theme.colors.surface, ...theme.shadows.sm },
  sgSegmentText: { fontSize: 12, fontWeight: '600', color: theme.colors.secondary },
  sgSegmentTextActive: { color: theme.colors.text, fontWeight: '700' },
  sgChatList: { padding: 16, gap: 14 },
  sgOtherRow: { alignSelf: 'flex-start', maxWidth: '82%' },
  sgMyRow: { alignSelf: 'flex-end', maxWidth: '82%' },
  sgSender: { fontSize: 12, fontWeight: '700', color: theme.colors.secondary, marginBottom: 4, marginLeft: 4 },
  sgOtherBubble: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11 },
  sgMyBubble: { backgroundColor: theme.colors.blue, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11 },
  sgWelcomeBanner: { backgroundColor: theme.colors.blueLight, borderWidth: 1, borderColor: theme.colors.blueBorder, borderRadius: 14, padding: 12, gap: 8, alignItems: 'flex-start' },
  sgWelcomeText: { fontSize: 12, color: theme.colors.text, lineHeight: 17 },
  sgWbBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.blueBorder },
  sgWbBtnText: { fontSize: 12, fontWeight: '700', color: theme.colors.blue },
});
