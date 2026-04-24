import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../../utils/validators';
import { authService } from '../../services/authService';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AccountTypeSelector } from '../../components/auth/AccountTypeSelector';
import { AuthScreenProps } from '../../navigation/types';
import { AccountType } from '../../types/common';

export function PasswordRecoveryScreen({ navigation }: AuthScreenProps<'PasswordRecovery'>) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '', account_type: 'student' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (!selectedType) return;
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword({ ...data, account_type: selectedType });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {sent ? (
            <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} style={styles.sentContainer}>
              <CheckCircle size={64} color={colors.semantic.success} strokeWidth={1.5} />
              <Text style={styles.sentTitle}>Email Sent</Text>
              <Text style={styles.sentBody}>Check your inbox for password reset instructions.</Text>
              <Button title="Back to Login" onPress={() => navigation.navigate('Login')} fullWidth />
            </MotiView>
          ) : (
            <View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email and account type to receive a reset link.</Text>
              <AccountTypeSelector selected={selectedType} onSelect={setSelectedType} />
              {selectedType && (
                <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
                  <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
                    <Input label="Email" value={value} onChangeText={onChange} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
                  )} />
                  {error && <Text style={styles.error}>{error}</Text>}
                  <Button title="Send Reset Link" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
                </MotiView>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  flex: { flex: 1 },
  back: { padding: spacing[5] },
  content: { flexGrow: 1, paddingHorizontal: spacing[6], paddingBottom: spacing[8] },
  title: { ...typography.h1, color: colors.text.heading, marginBottom: spacing[2] },
  subtitle: { ...typography.bodyMd, color: colors.text.muted, marginBottom: spacing[6] },
  error: { ...typography.bodySm, color: colors.semantic.error, textAlign: 'center', marginBottom: spacing[4] },
  sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  sentTitle: { ...typography.h2, color: colors.text.heading },
  sentBody: { ...typography.bodyMd, color: colors.text.muted, textAlign: 'center' },
});
