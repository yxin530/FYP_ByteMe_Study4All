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
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/authContext';
import { ApiClientError } from '@/lib/api';

export default function Login() {
  const { login, loginDemo, sessionExpired, dismissSessionExpired } = useAuth();
  const [email, setEmail] = useState('aina.rahman@student.edu.my');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your student email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      dismissSessionExpired();
      await login({ email: email.trim(), password });
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
        setError(err?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    try {
      setLoading(true);
      setError('');
      dismissSessionExpired();
      await loginDemo();
      router.replace('/(tabs)/home');
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
          {/* Logo & Brand Header */}
          <View style={s.brandRow}>
            <View style={s.logoWrap}>
              <GraduationCap size={28} color="#FFFFFF" />
            </View>
            <View>
              <Text style={s.brandName}>Study4All</Text>
              <Text style={s.brandTagline}>AI-Powered Adaptive Learning</Text>
            </View>
          </View>

          {/* Session Expiry Banner */}
          {sessionExpired ? (
            <View style={s.expiryBanner}>
              <AlertCircle size={18} color={theme.colors.red} />
              <Text style={s.expiryText}>
                Your session has expired. Please sign in again to continue.
              </Text>
            </View>
          ) : null}

          <View style={s.welcomeCard}>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>
              Sign in to continue your personalized tutoring, adaptive quizzes and study schedules.
            </Text>

            {/* Email Field */}
            <Text style={s.label}>Student Email</Text>
            <View style={s.inputContainer}>
              <Mail size={18} color={theme.colors.muted} />
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setError('');
                  dismissSessionExpired();
                }}
                placeholder="you@student.edu.my"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
                editable={!loading}
              />
            </View>

            {/* Password Field */}
            <Text style={s.label}>Password</Text>
            <View style={s.inputContainer}>
              <Lock size={18} color={theme.colors.muted} />
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setError('');
                  dismissSessionExpired();
                }}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry={!showPassword}
                style={s.input}
                editable={!loading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel="Toggle password visibility"
              >
                {showPassword ? (
                  <EyeOff size={18} color={theme.colors.muted} />
                ) : (
                  <Eye size={18} color={theme.colors.muted} />
                )}
              </Pressable>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <View style={s.forgotRow}>
              <Link href="/(auth)/forgot" style={s.forgotLink}>
                Forgot password?
              </Link>
            </View>

            {/* Login Button */}
            <Pressable
              style={[s.loginButton, loading && s.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={s.loginButtonText}>Sign In</Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            {/* Quick Demo Access */}
            <Pressable
              style={[s.demoButton, loading && s.disabledButton]}
              onPress={handleDemoAccess}
              disabled={loading}
            >
              <Sparkles size={16} color={theme.colors.violet} />
              <Text style={s.demoButtonText}>Quick Demo Student Access</Text>
            </Pressable>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>New to Study4All? </Text>
            <Link href="/(auth)/register" style={s.registerLink}>
              Create an account
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
    paddingTop: 32,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  brandTagline: {
    fontSize: 12,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  expiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  expiryText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.red,
    fontWeight: '600',
    lineHeight: 18,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  title: {
    fontSize: 24,
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
  error: {
    color: theme.colors.red,
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 12,
    marginBottom: 20,
  },
  forgotLink: {
    color: theme.colors.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.sm,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  demoButton: {
    height: 44,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.violetSoft,
    borderWidth: 1,
    borderColor: theme.colors.violetBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  demoButtonText: {
    color: theme.colors.violet,
    fontWeight: '700',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.65,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    color: theme.colors.secondary,
    fontSize: 14,
  },
  registerLink: {
    color: theme.colors.blue,
    fontWeight: '700',
    fontSize: 14,
  },
});
