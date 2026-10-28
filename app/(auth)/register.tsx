import { useState } from 'react';
import {
  ActivityIndicator,
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
import { Link, router } from 'expo-router';
import {
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  Lock,
  Mail,
  User,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';
import { ApiClientError } from '@/lib/api';

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [level, setLevel] = useState('Undergraduate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        level,
      });
      router.replace('/(tabs)/home');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
          const firstIssue = err.details[0]?.message;
          setError(firstIssue || err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(err?.message || 'Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.page}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Pressable
            style={s.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Back to login"
            disabled={loading}
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </Pressable>

          <View style={s.card}>
            <View style={s.logoWrap}>
              <GraduationCap size={24} color="#FFFFFF" />
            </View>
            <Text style={s.title}>Create student account</Text>
            <Text style={s.sub}>
              Join Study4All to unlock source-grounded tutoring, adaptive quizzes and automated study rebalancing.
            </Text>

            {/* Full Name */}
            <Text style={s.label}>Full Name</Text>
            <View style={s.inputContainer}>
              <User size={18} color={theme.colors.muted} />
              <TextInput
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError('');
                }}
                placeholder="e.g. Aina Rahman"
                placeholderTextColor={theme.colors.muted}
                style={s.input}
                editable={!loading}
              />
            </View>

            {/* Email */}
            <Text style={s.label}>Student Email</Text>
            <View style={s.inputContainer}>
              <Mail size={18} color={theme.colors.muted} />
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                }}
                placeholder="aina@student.edu.my"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
                editable={!loading}
              />
            </View>

            {/* Study Level Chips */}
            <Text style={s.label}>Academic Level</Text>
            <View style={s.levelsRow}>
              {['Secondary', 'Pre-U / STPM', 'Undergraduate'].map((lvl) => (
                <Pressable
                  key={lvl}
                  style={[s.levelChip, level === lvl && s.levelChipActive]}
                  onPress={() => setLevel(lvl)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      s.levelChipText,
                      level === lvl && s.levelChipTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Password */}
            <Text style={s.label}>Password (minimum 6 characters)</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color={theme.colors.muted} />
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                }}
                placeholder="Create secure password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                style={s.input}
                editable={!loading}
              />
            </View>

            {/* Confirm Password */}
            <Text style={s.label}>Confirm Password</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color={theme.colors.muted} />
              <TextInput
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  setError('');
                }}
                placeholder="Re-enter password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                style={s.input}
                editable={!loading}
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            {/* Register CTA */}
            <Pressable
              style={[s.submitButton, loading && s.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={s.submitButtonText}>Create Account</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" style={s.loginLink}>
              Log in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sub: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginTop: 6,
    lineHeight: 19,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  inputContainer: {
    height: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
  },
  levelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  levelChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
  },
  levelChipActive: {
    backgroundColor: theme.colors.blueLight,
    borderColor: theme.colors.blue,
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  levelChipTextActive: {
    color: theme.colors.blue,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.red,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 16,
  },
  submitButton: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    ...theme.shadows.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.65,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
});
