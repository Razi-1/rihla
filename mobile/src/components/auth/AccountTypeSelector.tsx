import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GraduationCap, BookOpen, Users } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing, shadow } from '../../theme/spacing';
import { AccountType } from '../../types/common';

interface AccountTypeSelectorProps {
  selected: AccountType | null;
  onSelect: (type: AccountType) => void;
}

const types = [
  { value: 'student' as AccountType, label: 'Student', icon: GraduationCap, desc: 'Find tutors and learn' },
  { value: 'tutor' as AccountType, label: 'Tutor', icon: BookOpen, desc: 'Teach and manage classes' },
  { value: 'parent' as AccountType, label: 'Parent', icon: Users, desc: 'Monitor your children' },
];

export function AccountTypeSelector({ selected, onSelect }: AccountTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>I am a...</Text>
      <View style={styles.options}>
        {types.map((type, index) => {
          const Icon = type.icon;
          const isSelected = selected === type.value;
          return (
            <MotiView
              key={type.value}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 350, delay: index * 100 }}
            >
              <TouchableOpacity
                onPress={() => onSelect(type.value)}
                style={[styles.option, isSelected && styles.optionSelected, shadow.sm]}
                activeOpacity={0.9}
              >
                <View style={[styles.iconContainer, isSelected && styles.iconSelected]}>
                  <Icon
                    size={28}
                    color={isSelected ? colors.white : colors.primary.blue}
                    strokeWidth={1.5}
                  />
                </View>
                <Text style={[styles.label, isSelected && styles.labelSelected]}>
                  {type.label}
                </Text>
                <Text style={styles.desc}>{type.desc}</Text>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[6],
  },
  title: {
    ...typography.h2,
    color: colors.text.heading,
    marginBottom: spacing[5],
  },
  options: {
    gap: spacing[3],
  },
  option: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: spacing[5],
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: colors.primary.light,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  iconSelected: {
    backgroundColor: colors.primary.blue,
  },
  label: {
    ...typography.titleSm,
    color: colors.text.heading,
    marginBottom: spacing[1],
  },
  labelSelected: {
    color: colors.primary.navy,
  },
  desc: {
    ...typography.bodySm,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
