import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Plus, CalendarDays, Users, BookOpen, TrendingUp } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { tutorService } from '../../services/tutorService';
import { EmailVerificationBanner } from '../../components/auth/EmailVerificationBanner';
import { SkeletonCard } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';
import { CountBadge } from '../../components/common/Badge';
import { createRefreshControl } from '../../components/common/PullToRefresh';

export function TutorDashboardScreen({ navigation }: any) {
  const { firstName, isEmailVerified, isRestricted } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await tutorService.getDashboard();
      setDashboard(res.data.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={createRefreshControl({ refreshing, onRefresh: () => { setRefreshing(true); fetchData(); } })}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName || 'Tutor'}</Text>
            <Text style={styles.subtitle}>Manage your classes</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab', { screen: 'Notifications' })}>
            <Bell size={24} color={colors.text.heading} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        {!isEmailVerified && <EmailVerificationBanner />}
        {isRestricted && (
          <View style={styles.restricted}><Text style={styles.restrictedText}>Account restricted. Contact support.</Text></View>
        )}

        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <View style={styles.statsGrid}>
              {[
                { icon: CalendarDays, label: 'Today\'s Sessions', value: dashboard?.today_sessions || 0, color: colors.primary.blue },
                { icon: BookOpen, label: 'Active Classes', value: dashboard?.active_classes || 0, color: colors.semantic.success },
                { icon: Users, label: 'Total Students', value: dashboard?.total_students || 0, color: colors.primary.accent },
                { icon: TrendingUp, label: 'This Week', value: dashboard?.week_sessions || 0, color: colors.semantic.warning },
              ].map((stat, i) => (
                <MotiView key={i} from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 350, delay: i * 80 }}>
                  <View style={[styles.statCard, shadow.sm]}>
                    <stat.icon size={22} color={stat.color} strokeWidth={1.5} />
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                </MotiView>
              ))}
            </View>

            <Button
              title="Create New Class"
              onPress={() => navigation.navigate('ClassesTab', { screen: 'CreateClass' })}
              fullWidth
              size="lg"
              icon={<Plus size={20} color={colors.white} strokeWidth={1.5} />}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing[5], paddingBottom: spacing[10] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] },
  greeting: { ...typography.h1, color: colors.text.heading },
  subtitle: { ...typography.bodyMd, color: colors.text.muted, marginTop: 4 },
  restricted: { backgroundColor: colors.semantic.errorLight, padding: spacing[4], borderRadius: 12, marginBottom: spacing[4] },
  restrictedText: { ...typography.bodySm, color: colors.semantic.error },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[6] },
  statCard: { width: '47%', backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], flexGrow: 1 },
  statValue: { ...typography.h2, color: colors.text.heading, marginTop: spacing[2] },
  statLabel: { ...typography.bodySm, color: colors.text.muted, marginTop: 2 },
});
