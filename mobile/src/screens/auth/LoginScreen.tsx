import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { loginSchema, LoginFormData } from '../../utils/validators';
import { useAuth } from '../../hooks/useAuth';
import { AccountType } from '../../types/common';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AccountTypeSelector } from '../../components/auth/AccountTypeSelector';
import { AuthScreenProps } from '../../navigation/types';

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login, isLoading, error, setError } = useAuth();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', account_type: 'student' },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (!selectedType) return;
    setError(null);
    try {
      await login({ ...data, account_type: selectedType });
    } catch {
      // error is set by the hook
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <Text style={styles.brand}>Rihla</Text>
            <Text style={styles.subtitle}>Welcome back</Text>
          </MotiView>

          <AccountTypeSelector selected={selectedType} onSelect={setSelectedType} />

          {selectedType && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 400 }}
            >
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    isPassword
                    autoComplete="password"
                  />
                )}
              />

              {error && <Text style={styles.error}>{error}</Text>}

              <Button
                title="Sign In"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                fullWidth
                size="lg"
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('PasswordRecovery')}
                style={styles.link}
              >
                <Text style={styles.linkText}>Forgot your password?</Text>
              </TouchableOpacity>

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface.base,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[10],
    paddingBottom: spacing[8],
  },
  brand: {
    ...typography.displayLg,
    color: colors.primary.navy,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.text.muted,
    marginBottom: spacing[8],
  },
  error: {
    ...typography.bodySm,
    color: colors.semantic.error,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  link: {
    alignSelf: 'center',
    marginTop: spacing[5],
    padding: spacing[2],
  },
  linkText: {
    ...typography.labelMd,
    color: colors.primary.blue,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[6],
  },
  registerText: {
    ...typography.bodyMd,
    color: colors.text.muted,
  },
  registerLink: {
    ...typography.labelMd,
    color: colors.primary.blue,
  },
});
