import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { agentApi } from '@/lib/api';

export default function LearnScreen() {
  const [request, setRequest] = useState('');
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestLesson() {
    if (!request.trim()) return;
    setLoading(true);
    try {
      const result = await agentApi.createAudioTranscript(request.trim(), []);
      setTranscript(result.transcript);
    } catch (error) {
      setTranscript(error instanceof Error ? error.message : 'Unable to create a lesson.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ask from your material</Text>
      <Text style={styles.help}>The agent will only use material that you provide.</Text>
      <TextInput
        multiline
        value={request}
        onChangeText={setRequest}
        placeholder="Example: Create a short podcast about recursion"
        style={styles.input}
      />
      <Pressable style={styles.button} onPress={requestLesson} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create transcript</Text>}
      </Pressable>
      {!!transcript && <Text style={styles.result}>{transcript}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' },
  title: { color: '#0F172A', fontSize: 26, fontWeight: '800' },
  help: { marginTop: 8, color: '#64748B', lineHeight: 21 },
  input: { minHeight: 130, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', textAlignVertical: 'top', color: '#0F172A' },
  button: { alignItems: 'center', marginTop: 16, padding: 15, borderRadius: 14, backgroundColor: '#2563EB' },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  result: { marginTop: 24, color: '#1E293B', fontSize: 16, lineHeight: 24 },
});
