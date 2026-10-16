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
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Sparkles,
} from 'lucide-react-native';
import { theme } from '@/lib/theme';

export default function Login() {
  const [email, setEmail] = useState('aina.rahman@student.edu.my');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Please provide both your student email and password.');
      return;
    }
    setError('');
    router.replace('/(tabs)/home');
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
                }}
                placeholder="you@student.edu.my"
                placeholderTextColor={theme.colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={s.input}
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
                }}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry={!showPassword}
                style={s.input}
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
            <Pressable style={s.loginButton} onPress={handleLogin}>
              <Text style={s.loginButtonText}>Sign In</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </Pressable>

            {/* Quick Demo Access */}
            <Pressable
              style={s.demoButton}
              onPress={() => {
                setEmail('aina.rahman@student.edu.my');
                setPassword('password123');
                router.replace('/(tabs)/home');
              }}
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
    marginBottom: 28,
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
