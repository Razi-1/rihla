import React from 'react';
import { StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { radius, shadow } from '../../theme/spacing';

interface AnimatedCardProps {
  children: React.ReactNode;
  index?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export function AnimatedCard({ children, index = 0, onPress, style }: AnimatedCardProps) {
  const content = (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: 'timing',
        duration: 350,
        delay: index * 80,
      }}
      style={[styles.card, shadow.md, style]}
    >
      {children}
    </MotiView>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: 16,
  },
});
