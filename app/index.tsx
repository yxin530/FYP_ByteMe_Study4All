import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ByteMe</Text>
      <Text style={styles.title}>AI Study4All</Text>
      <Text style={styles.subtitle}>
        Personalized learning from your own materials.
      </Text>

      <Pressable style={styles.button} onPress={() => router.push('/learn')}>
        <Text style={styles.buttonText}>Start learning</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#F8FAFC' },
  eyebrow: { marginBottom: 8, color: '#64748B', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  title: { color: '#0F172A', fontSize: 36, fontWeight: '800' },
  subtitle: { maxWidth: 320, marginTop: 12, color: '#475569', fontSize: 17, lineHeight: 25 },
  button: { alignSelf: 'flex-start', marginTop: 28, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: '#2563EB' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
