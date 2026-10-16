import { useEffect } from 'react';
import { router } from 'expo-router';
import { GraduationCap, Sparkles } from 'lucide-react-native';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '@/lib/theme';

export default function Index() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable
      style={styles.page}
      onPress={() => router.replace('/(auth)/login')}
    >
      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <GraduationCap size={48} color={theme.colors.blue} strokeWidth={2} />
          <View style={styles.sparkleBadge}>
            <Sparkles size={14} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title}>Study4All</Text>
        <Text style={styles.subtitle}>AI-Powered Adaptive Learning Partner</Text>

        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          <Text style={styles.loadingText}>Initializing study workspace…</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ByteMe · SDG 4 Quality Education</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...theme.shadows.elevated,
  },
  sparkleBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 24,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    color: '#BFDBFE',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 48,
  },
  loadingText: {
    color: '#E0E7FF',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 36,
  },
  footerText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
