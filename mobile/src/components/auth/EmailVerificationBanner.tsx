import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Mail, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';
import { authService } from '../../services/authService';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export function EmailVerificationBanner({ onDismiss }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await authService.resendVerification();
      setSent(true);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.content}>
        <Mail size={20} color={colors.semantic.warning} strokeWidth={1.5} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.body}>
            {sent
              ? 'Verification email sent! Check your inbox.'
              : 'Please verify your email to access all features.'}
          </Text>
          {!sent && (
            <TouchableOpacity onPress={handleResend} disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.primary.blue} />
              ) : (
                <Text style={styles.link}>Resend verification email</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.close}>
          <X size={16} color={colors.text.muted} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.semantic.warningLight,
    borderRadius: radius.md,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.labelMd,
    color: colors.text.heading,
    marginBottom: 2,
  },
  body: {
    ...typography.bodySm,
    color: colors.text.body,
    marginBottom: spacing[2],
  },
  link: {
    ...typography.labelSm,
    color: colors.primary.blue,
  },
  close: {
    padding: 4,
  },
});
