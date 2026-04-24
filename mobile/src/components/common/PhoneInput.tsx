import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onChangeCountryCode: (code: string) => void;
  onChangePhoneNumber: (number: string) => void;
  error?: string;
  label?: string;
}

export function PhoneInput({
  countryCode,
  phoneNumber,
  onChangeCountryCode,
  onChangePhoneNumber,
  error,
  label,
}: PhoneInputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.codeInput, error && styles.inputError]}
          value={countryCode}
          onChangeText={onChangeCountryCode}
          placeholder="+94"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
          maxLength={5}
        />
        <TextInput
          style={[styles.phoneInput, error && styles.inputError]}
          value={phoneNumber}
          onChangeText={onChangePhoneNumber}
          placeholder="Phone number"
          placeholderTextColor={colors.text.muted}
          keyboardType="phone-pad"
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.labelMd,
    color: colors.text.heading,
    marginBottom: spacing[2],
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    ...typography.bodyMd,
    color: colors.text.body,
    backgroundColor: colors.surface.low,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: 72,
    textAlign: 'center',
  },
  phoneInput: {
    ...typography.bodyMd,
    color: colors.text.body,
    backgroundColor: colors.surface.low,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flex: 1,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  error: {
    ...typography.bodySm,
    color: colors.semantic.error,
    marginTop: spacing[1],
  },
});
