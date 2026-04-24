import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, XCircle } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { AuthScreenProps } from '../../navigation/types';

export function VerifyEmailScreen({ route, navigation }: AuthScreenProps<'VerifyEmail'>) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const token = route.params?.token;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authService
      .verifyEmail({ token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {status === 'loading' && (
          <ActivityIndicator size="large" color={colors.primary.blue} />
        )}
        {status === 'success' && (
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} style={styles.center}>
            <CheckCircle size={72} color={colors.semantic.success} strokeWidth={1.5} />
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.body}>Your email has been successfully verified.</Text>
            <Button title="Continue" onPress={() => navigation.navigate('Login')} fullWidth size="lg" />
          </MotiView>
        )}
        {status === 'error' && (
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }} style={styles.center}>
            <XCircle size={72} color={colors.semantic.error} strokeWidth={1.5} />
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.body}>The verification link is invalid or has expired.</Text>
            <Button title="Back to Login" onPress={() => navigation.navigate('Login')} fullWidth size="lg" />
          </MotiView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[8] },
  center: { alignItems: 'center', gap: spacing[4], width: '100%' },
  title: { ...typography.h1, color: colors.text.heading },
  body: { ...typography.bodyMd, color: colors.text.muted, textAlign: 'center', marginBottom: spacing[4] },
});
