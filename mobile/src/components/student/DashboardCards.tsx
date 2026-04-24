import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalendarDays, BookOpen, Clock, Bell } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing, shadow } from '../../theme/spacing';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  index: number;
  onPress?: () => void;
}

function StatCard({ icon, label, value, color, index, onPress }: StatCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 350, delay: index * 100 }}
    >
      <TouchableOpacity onPress={onPress} style={[styles.statCard, shadow.sm]} activeOpacity={0.9}>
        <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

interface DashboardCardsProps {
  stats: {
    nextSession?: string;
    activeClasses: number;
    pendingInvites: number;
    unreadNotifications: number;
  };
  onPressNextSession?: () => void;
  onPressClasses?: () => void;
  onPressInvites?: () => void;
  onPressNotifications?: () => void;
}

export function DashboardCards({ stats, onPressNextSession, onPressClasses, onPressInvites, onPressNotifications }: DashboardCardsProps) {
  return (
    <View style={styles.grid}>
      <StatCard
        icon={<Clock size={22} color={colors.primary.blue} strokeWidth={1.5} />}
        label="Next Session"
        value={stats.nextSession || 'None'}
        color={colors.primary.blue}
        index={0}
        onPress={onPressNextSession}
      />
      <StatCard
        icon={<BookOpen size={22} color={colors.semantic.success} strokeWidth={1.5} />}
        label="Active Classes"
        value={stats.activeClasses}
        color={colors.semantic.success}
        index={1}
        onPress={onPressClasses}
      />
      <StatCard
        icon={<CalendarDays size={22} color={colors.semantic.warning} strokeWidth={1.5} />}
        label="Pending Invites"
        value={stats.pendingInvites}
        color={colors.semantic.warning}
        index={2}
        onPress={onPressInvites}
      />
      <StatCard
        icon={<Bell size={22} color={colors.primary.accent} strokeWidth={1.5} />}
        label="Notifications"
        value={stats.unreadNotifications}
        color={colors.primary.accent}
        index={3}
        onPress={onPressNotifications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[6],
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: spacing[4],
    flexGrow: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  statValue: {
    ...typography.h2,
    color: colors.text.heading,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
});
