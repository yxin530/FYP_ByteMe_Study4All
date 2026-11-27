import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Compass,
  Flame,
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';
import { materialsApi, profileApi, studyApi, type LearningProfile, type MaterialItem } from '@/lib/api';

type Section = 'rescue' | 'quest' | 'groups';

const DEMO_MATERIALS: MaterialItem[] = [
  {
    id: 'demo-mat-1',
    user_id: 'demo-student-user',
    title: 'Chapter 3: Quadratic Equations',
    material_type: 'pdf',
    processing_status: 'ready',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-mat-2',
    user_id: 'demo-student-user',
    title: 'Python Loops & Functions',
    material_type: 'pdf',
    processing_status: 'ready',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function StudyFeaturesScreen() {
  const { session, user } = useAuth();
  const isDemo = session?.access_token === 'demo-guest-token';

  const [section, setSection] = useState<Section>('rescue');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Study Rescue state
  const [examDate, setExamDate] = useState('2026-12-10');
  const [rescueSubject, setRescueSubject] = useState('Mathematics');
  const [availableMinutes, setAvailableMinutes] = useState('90');
  const [rescuePlan, setRescuePlan] = useState<any>(null);

  // Learning Quest state
  const [questSubject, setQuestSubject] = useState('Mathematics');
  const [questResult, setQuestResult] = useState<any>(null);

  // Study Groups & Match state
  const [displayName, setDisplayName] = useState(user?.name || 'Aina Rahman');
  const [discoverable, setDiscoverable] = useState(true);
  const [matchSubject, setMatchSubject] = useState('Mathematics');
  const [matches, setMatches] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('Math Exam Prep');
  const [activeGroup, setActiveGroup] = useState<{ id: string; name: string; subject: string } | null>(
    isDemo ? { id: 'demo-group-1', name: 'Math Exam Prep', subject: 'Mathematics' } : null,
  );
  const [messages, setMessages] = useState<Array<{ id: string; user_id: string; body: string; created_at: string }>>(
    isDemo
      ? [
          {
            id: 'm1',
            user_id: 'peer-1',
            body: 'Hey everyone! Ready to review Chapter 3 quadratics?',
            created_at: new Date().toISOString(),
          },
        ]
      : [],
  );
  const [chatDraft, setChatDraft] = useState('');

  useEffect(() => {
    if (isDemo) {
      setMaterials(DEMO_MATERIALS);
      setSelectedMaterialIds([DEMO_MATERIALS[0].id]);
      return;
    }
    materialsApi
      .list()
      .then((items) => {
        const ready = items.filter((m) => m.processing_status === 'ready');
        setMaterials(ready);
        if (ready.length > 0) setSelectedMaterialIds([ready[0].id]);
      })
      .catch(() => setMaterials([]));
    profileApi.get().then(setProfile).catch(() => setProfile(null));
  }, [isDemo]);

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleGenerateRescue = async () => {
    if (selectedMaterialIds.length === 0) {
      Alert.alert('Select material', 'Please select at least one ready material.');
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        const selectedNames = materials
          .filter((m) => selectedMaterialIds.includes(m.id))
          .map((m) => m.title)
          .join(', ');
        setRescuePlan({
          status: 'generated',
          examDate,
          availableMinutes: Number(availableMinutes) || 90,
          assumptions: [
            `Grounded in: ${selectedNames}`,
            'Performance focus: Quadratic factorisation & discriminant (recent quiz score: 54%)',
          ],
          tasks: [
            {
              title: 'Block 1: Discriminant & Roots Concept Repair',
              detail: 'Re-read Section 3.2 of your notes and write 3 summary rules for b^2 - 4ac.',
              durationMinutes: 30,
              priority: 'high',
            },
            {
              title: 'Block 2: Targeted Weak-Topic Drills',
              detail: 'Solve 5 factorisation & completing-the-square problems without notes, then check step-by-step.',
              durationMinutes: 35,
              priority: 'high',
            },
            {
              title: 'Block 3: Timed Mini-Quiz Checkpoint',
              detail: 'Complete a 5-question adaptive quiz targeting your weak topics to verify >= 75% mastery.',
              durationMinutes: 25,
              priority: 'medium',
            },
          ],
        });
        return;
      }
      const res = await studyApi.rescue({
        examDate,
        subjects: [{ subject: rescueSubject.trim() || 'General', materialIds: selectedMaterialIds }],
        availableMinutes: Number(availableMinutes) || 60,
      });
      setRescuePlan(res);
    } catch (e: any) {
      Alert.alert('Rescue plan error', e?.message ?? 'Could not generate rescue plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuest = async () => {
    if (selectedMaterialIds.length === 0) {
      Alert.alert('Select material', 'Please select at least one ready material.');
      return;
    }
    setLoading(true);
    try {
      if (isDemo) {
        const selectedNames = materials
          .filter((m) => selectedMaterialIds.includes(m.id))
          .map((m) => m.title)
          .join(', ');
        setQuestResult({
          title: 'Quadratic Mastery Quest',
          xpReward: 150,
          performanceNote: `Tailored to your ${profile?.streakDays ? `${profile.streakDays}-day streak` : 'recent quiz performance'} & ${selectedNames}`,
          milestones: [
            '1. Concept Recall: Summarize vertex form & discriminant rules from Chapter 3 in 3 bullet points.',
            '2. Guided Practice: Solve 3 factorisation questions and verify each step with Study4All AI.',
            '3. Mastery Boss Check: Score at least 80% on a 5-question grounded quiz.',
          ],
        });
        return;
      }
      const res = await studyApi.quest({
        subject: questSubject.trim() || 'General',
        materialIds: selectedMaterialIds,
      });
      setQuestResult(res);
    } catch (e: any) {
      Alert.alert('Quest error', e?.message ?? 'Could not generate learning quest.');
    } finally {
      setLoading(false);
    }
  };

  const handleFindMatches = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        const demoMatches = [
          { user_id: 'peer-1', display_name: 'Farah Aziz', learning_subjects: [matchSubject || 'Mathematics'], availability: ['Evenings'] },
          { user_id: 'peer-2', display_name: 'Daniel Lim', learning_subjects: [matchSubject || 'Mathematics', 'Programming'], availability: ['Weekends'] },
        ];
        setMatches(demoMatches);
        setActiveGroup({
          id: `demo-group-${Date.now()}`,
          name: `${matchSubject || 'Mathematics'} Study Group`,
          subject: matchSubject || 'Mathematics',
        });
        return;
      }
      await studyApi.saveProfile({
        displayName: displayName.trim() || 'Student',
        learningSubjects: [matchSubject.trim() || 'Mathematics'],
        teachingSubjects: [],
        availability: ['Evenings'],
        discoverable,
      });
      const res: any = await studyApi.findMatch(matchSubject.trim() || 'Mathematics');
      const found = res?.matches ?? [];
      setMatches(found);
      if (found.length > 0) {
        const memberIds = found.map((m: any) => m.user_id).filter(Boolean);
        const grpRes: any = await studyApi.createGroup({
          name: `${matchSubject.trim() || 'Study'} Match Group`,
          subject: matchSubject.trim() || 'Mathematics',
          memberIds,
        });
        if (grpRes?.group) {
          setActiveGroup(grpRes.group);
        }
      }
    } catch (e: any) {
      Alert.alert('Match error', e?.message ?? 'Could not find study matches.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      if (isDemo) {
        setActiveGroup({ id: `demo-group-${Date.now()}`, name: groupName.trim(), subject: matchSubject });
        setMessages([
          { id: 'm-new', user_id: user?.id || 'demo-student-user', body: 'Group created in demo mode!', created_at: new Date().toISOString() },
        ]);
        return;
      }
      const res: any = await studyApi.createGroup({
        name: groupName.trim(),
        subject: matchSubject.trim() || 'Mathematics',
      });
      const group = res?.group ?? res;
      if (group?.id) {
        setActiveGroup(group);
        const msgRes = await studyApi.messages(group.id);
        setMessages(msgRes.messages ?? []);
      }
    } catch (e: any) {
      Alert.alert('Group error', e?.message ?? 'Could not create study group.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeGroup || !chatDraft.trim()) return;
    const text = chatDraft.trim();
    setChatDraft('');
    if (isDemo) {
      setMessages((prev) => [
        ...prev,
        { id: `demo-msg-${Date.now()}`, user_id: user?.id || 'demo-student-user', body: text, created_at: new Date().toISOString() },
      ]);
      return;
    }
    try {
      await studyApi.sendMessage(activeGroup.id, text);
      const msgRes = await studyApi.messages(activeGroup.id);
      setMessages(msgRes.messages ?? []);
    } catch (e: any) {
      Alert.alert('Message error', e?.message ?? 'Could not send message.');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} accessibilityLabel="Go back">
          <ArrowLeft size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Study Hub</Text>
          <Text style={s.headerSub}>Rescue Plans, Quests & Study Groups</Text>
        </View>
      </View>

      {/* Section Switcher */}
      <View style={s.tabsRow}>
        {[
          { key: 'rescue', label: 'Study Rescue', icon: Flame },
          { key: 'quest', label: 'Quests', icon: Compass },
          { key: 'groups', label: 'Groups', icon: Users },
        ].map((tab) => {
          const active = section === tab.key;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.key}
              style={[s.tabPill, active && s.tabPillActive]}
              onPress={() => setSection(tab.key as Section)}
            >
              <Icon size={15} color={active ? '#FFFFFF' : theme.colors.secondary} />
              <Text style={[s.tabText, active && s.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {section !== 'groups' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Select Grounded Materials</Text>
            {materials.length === 0 ? (
              <Text style={s.muted}>No ready materials found. Upload materials first.</Text>
            ) : (
              materials.map((m) => {
                const selected = selectedMaterialIds.includes(m.id);
                return (
                  <Pressable
                    key={m.id}
                    style={[s.matRow, selected && s.matRowSelected]}
                    onPress={() => toggleMaterial(m.id)}
                  >
                    <Text style={[s.matTitle, selected && s.matTitleSelected]}>{m.title}</Text>
                    <Text style={s.matSub}>{m.material_type?.toUpperCase() || 'MATERIAL'}</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        )}

        {section === 'rescue' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Exam Study Rescue</Text>
            <Text style={s.label}>Subject</Text>
            <TextInput style={s.input} value={rescueSubject} onChangeText={setRescueSubject} />
            <Text style={s.label}>Exam Date (YYYY-MM-DD)</Text>
            <TextInput style={s.input} value={examDate} onChangeText={setExamDate} />
            <Text style={s.label}>Available Minutes</Text>
            <TextInput
              style={s.input}
              value={availableMinutes}
              onChangeText={setAvailableMinutes}
              keyboardType="numeric"
            />
            <Pressable style={s.primaryBtn} onPress={handleGenerateRescue} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={s.primaryBtnText}>Generate Rescue Plan</Text>
                </>
              )}
            </Pressable>

            {rescuePlan && (
              <View style={s.resultBox}>
                <Text style={s.resultTitle}>Your Rescue Plan ({rescuePlan.availableMinutes ?? availableMinutes} mins)</Text>
                {(rescuePlan.assumptions ?? []).map((a: string, idx: number) => (
                  <Text key={`a-${idx}`} style={s.matSub}>{a}</Text>
                ))}
                {(rescuePlan.tasks ?? []).map((t: any, idx: number) => (
                  <View key={idx} style={{ marginTop: 4 }}>
                    <Text style={[s.resultItem, { fontWeight: '700' }]}>
                      • {t.title} ({t.durationMinutes} min)
                    </Text>
                    {t.detail ? <Text style={s.matSub}>{t.detail}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {section === 'quest' && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Learning Quest</Text>
            <Text style={s.label}>Subject</Text>
            <TextInput style={s.input} value={questSubject} onChangeText={setQuestSubject} />
            <Pressable style={s.primaryBtn} onPress={handleGenerateQuest} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Compass size={16} color="#FFFFFF" />
                  <Text style={s.primaryBtnText}>Start Material Quest</Text>
                </>
              )}
            </Pressable>

            {questResult && (
              <View style={s.resultBox}>
                <Text style={s.resultTitle}>{questResult.title || 'Active Quest'}</Text>
                {questResult.xpReward ? (
                  <Text style={s.xpBadge}>+{questResult.xpReward} XP</Text>
                ) : null}
                {questResult.performanceNote ? (
                  <Text style={s.matSub}>{questResult.performanceNote}</Text>
                ) : null}
                {(questResult.milestones ?? []).map((m: string, idx: number) => (
                  <Text key={idx} style={s.resultItem}>
                    {m}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {section === 'groups' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Peer Matching</Text>
              <Text style={s.label}>Display Name</Text>
              <TextInput style={s.input} value={displayName} onChangeText={setDisplayName} />
              <Text style={s.label}>Subject</Text>
              <TextInput style={s.input} value={matchSubject} onChangeText={setMatchSubject} />
              <View style={s.switchRow}>
                <Text style={s.label}>Discoverable for matching</Text>
                <Switch value={discoverable} onValueChange={setDiscoverable} />
              </View>
              <Pressable style={s.primaryBtn} onPress={handleFindMatches} disabled={loading}>
                <Users size={16} color="#FFFFFF" />
                <Text style={s.primaryBtnText}>Find Study Peers</Text>
              </Pressable>

              {matches.map((m, idx) => (
                <View key={m.user_id || idx} style={s.matchItem}>
                  <Text style={s.matTitle}>{m.display_name || 'Study Peer'}</Text>
                  <Text style={s.matSub}>
                    {(m.learning_subjects || []).join(', ')} · {(m.availability || []).join(', ')}
                  </Text>
                </View>
              ))}

              {matches.length > 0 && activeGroup && (
                <View style={[s.resultBox, { marginTop: 12 }]}>
                  <Text style={s.resultTitle}>Group Chat Created Automatically</Text>
                  <Text style={s.matSub}>
                    {activeGroup.name} ({activeGroup.subject}) is ready in your Chat tab.
                  </Text>
                  <Pressable
                    style={[s.primaryBtn, { marginTop: 10 }]}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/whiteboard',
                        params: {
                          studyGroupId: activeGroup.id,
                          studyGroupName: activeGroup.name,
                          studyGroupSubject: activeGroup.subject,
                        },
                      })
                    }
                  >
                    <MessageSquare size={16} color="#FFFFFF" />
                    <Text style={s.primaryBtnText}>Open Group Chat</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  headerSub: { fontSize: 12, color: theme.colors.secondary },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabPillActive: {
    backgroundColor: theme.colors.blue,
    borderColor: theme.colors.blue,
  },
  tabText: { fontSize: 12, fontWeight: '700', color: theme.colors.secondary },
  tabTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.secondary, marginBottom: 4, marginTop: 8 },
  input: {
    height: 44,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  primaryBtn: {
    height: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  muted: { fontSize: 13, color: theme.colors.muted },
  matRow: {
    padding: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  matRowSelected: {
    borderColor: theme.colors.blue,
    backgroundColor: theme.colors.blueLight,
  },
  matTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text },
  matTitleSelected: { color: theme.colors.blue },
  matSub: { fontSize: 12, color: theme.colors.secondary, marginTop: 2 },
  resultBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    gap: 6,
  },
  resultTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.violet },
  resultItem: { fontSize: 13, color: theme.colors.text, lineHeight: 19 },
  xpBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.amberSoft,
    color: theme.colors.amber,
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  matchItem: {
    marginTop: 10,
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  groupBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.blue,
    marginBottom: 10,
  },
  chatList: { gap: 8, marginBottom: 12 },
  chatBubble: {
    padding: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chatText: { fontSize: 13, color: theme.colors.text },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
