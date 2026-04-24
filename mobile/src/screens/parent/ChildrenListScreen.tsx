import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, UserPlus } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { parentService } from '../../services/parentService';
import { ChildSummaryResponse } from '../../types/parent';
import { ChildCard } from '../../components/parent/ChildCard';
import { Button } from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { createRefreshControl } from '../../components/common/PullToRefresh';

export function ChildrenListScreen({ navigation }: any) {
  const [children, setChildren] = useState<ChildSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await parentService.getChildren();
      setChildren(res.data.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchChildren(); }, [fetchChildren]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChildren();
  }, [fetchChildren]);

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
      <View style={styles.header}>
        <Text style={styles.title}>Children</Text>
        <Text style={styles.subtitle}>{children.length} linked account{children.length !== 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={createRefreshControl({ refreshing, onRefresh })}
      >
        {children.length > 0 ? (
          children.map((child, i) => (
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
            description="Link your child's account to view their learning activity."
            actionLabel="Link a Child"
            onAction={() => navigation.navigate('LinkChild')}
          />
        )}

        {children.length > 0 && (
          <Button
            title="Link Another Child"
            onPress={() => navigation.navigate('LinkChild')}
            variant="secondary"
            fullWidth
            icon={<UserPlus size={20} color={colors.text.heading} strokeWidth={1.5} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[4] },
  title: { ...typography.h1, color: colors.text.heading },
  subtitle: { ...typography.bodySm, color: colors.text.muted },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
});
