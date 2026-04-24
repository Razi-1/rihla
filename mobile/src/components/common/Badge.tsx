import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius } from '../../theme/spacing';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const BADGE_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: colors.primary.light, text: colors.primary.accent },
  success: { bg: colors.semantic.successLight, text: colors.semantic.success },
  warning: { bg: colors.semantic.warningLight, text: colors.semantic.warning },
  error: { bg: colors.semantic.errorLight, text: colors.semantic.error },
  neutral: { bg: colors.surface.high, text: colors.text.body },
};

export function Badge({ text, variant = 'primary', style }: BadgeProps) {
  const scheme = BADGE_COLORS[variant];
  return (
    <View style={[styles.container, { backgroundColor: scheme.bg }, style]}>
      <Text style={[styles.text, { color: scheme.text }]}>{text}</Text>
    </View>
  );
}

interface CountBadgeProps {
  count: number;
  style?: ViewStyle;
}

export function CountBadge({ count, style }: CountBadgeProps) {
  if (count <= 0) return null;
  return (
    <View style={[styles.countBadge, style]}>
      <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...typography.labelSm,
  },
  countBadge: {
    backgroundColor: colors.semantic.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    ...typography.labelSm,
    color: colors.white,
    fontSize: 10,
  },
});
