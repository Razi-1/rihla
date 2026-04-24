import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, AlertTriangle } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { parentService } from '../../services/parentService';
import { ParentDashboardResponse } from '../../types/parent';
import { ChildCard } from '../../components/parent/ChildCard';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { createRefreshControl } from '../../components/common/PullToRefresh';

export function ParentDashboardScreen({ navigation }: any) {
  const { firstName } = useAuthStore();
  const [dashboard, setDashboard] = useState<ParentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await parentService.getDashboard();
      setDashboard(res.data.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing[5] }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={createRefreshControl({ refreshing, onRefresh })}
      >
        <MotiView from={{ opacity: 0, translateY: -10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 300 }}>
          <Text style={styles.greeting}>Hello, {firstName}</Text>
          <Text style={styles.subtitle}>Your children's learning overview</Text>
        </MotiView>

        {dashboard && dashboard.pending_permissions > 0 && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 350, delay: 100 }}
            style={[styles.alertCard, shadow.sm]}
          >
            <AlertTriangle size={22} color={colors.semantic.warning} strokeWidth={1.5} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{dashboard.pending_permissions} pending permission{dashboard.pending_permissions !== 1 ? 's' : ''}</Text>
              <Text style={styles.alertDesc}>Tutors are requesting access to your children</Text>
            </View>
          </MotiView>
        )}

        <Text style={styles.sectionTitle}>Children</Text>
        {dashboard && dashboard.children.length > 0 ? (
          dashboard.children.map((child, i) => (
            <ChildCard
              key={child.student_id}
              child={child}
              index={i}
              onPress={() => navigation.navigate('ChildOverview', { studentId: child.student_id })}
            />
          ))
        ) : (
          <EmptyState
            icon={<Users size={48} color={colors.text.muted} strokeWidth={1.5} />}
            title="No children linked"
            description="Link your child's account to monitor their learning progress."
            actionLabel="Link a Child"
            onAction={() => navigation.navigate('ChildrenTab', { screen: 'LinkChild' })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing[5], paddingBottom: spacing[10] },
  greeting: { ...typography.h1, color: colors.text.heading },
  subtitle: { ...typography.bodyMd, color: colors.text.muted, marginBottom: spacing[6] },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: 'rgba(247, 144, 9, 0.08)', borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[6] },
  alertInfo: { flex: 1 },
  alertTitle: { ...typography.labelMd, color: colors.text.heading },
  alertDesc: { ...typography.bodySm, color: colors.text.muted },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[4] },
});
