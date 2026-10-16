import { useState } from 'react';
import {
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
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  Mail,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';

export default function Forgot() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    if (!email.trim()) {
      setError('Please enter your student email address.');
      return;
    }
    setError('');
    setSubmitted(true);
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
          {/* Back button */}
          <Pressable
            style={s.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Back to login"
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </Pressable>

          <View style={s.card}>
            <View style={s.logoWrap}>
              <KeyRound size={24} color="#FFFFFF" />
            </View>

            {submitted ? (
              <View style={s.successBox}>
                <CheckCircle2 size={48} color={theme.colors.green} />
                <Text style={s.successTitle}>Reset link sent!</Text>
                <Text style={s.successBody}>
                  We've sent password reset instructions to{' '}
                  <Text style={{ fontWeight: '700', color: theme.colors.text }}>
                    {email}
                  </Text>
                  . Please check your inbox and follow the link.
                </Text>

                <Pressable
                  style={s.submitButton}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={s.submitButtonText}>Return to Login</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={s.title}>Reset your password</Text>
                <Text style={s.sub}>
                  Enter the email address associated with your student account and we'll send you a password recovery link.
                </Text>

                <Text style={s.label}>Student Email</Text>
                <View style={s.inputContainer}>
                  <Mail size={18} color={theme.colors.muted} />
                  <TextInput
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      setError('');
                    }}
                    placeholder="you@student.edu.my"
                    placeholderTextColor={theme.colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={s.input}
                  />
                </View>

                {error ? <Text style={s.error}>{error}</Text> : null}

                <Pressable style={s.submitButton} onPress={handleReset}>
                  <Text style={s.submitButtonText}>Send Recovery Link</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </Pressable>
              </>
            )}
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Remember your password? </Text>
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
    marginBottom: 20,
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
    marginBottom: 16,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
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
  error: {
    color: theme.colors.red,
    fontSize: 12,
    marginTop: 8,
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
  successBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 14,
  },
  successBody: {
    textAlign: 'center',
    color: theme.colors.secondary,
    lineHeight: 20,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 12,
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
