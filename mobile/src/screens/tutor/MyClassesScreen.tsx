import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, BookOpen } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { tutorService } from '../../services/tutorService';
import { SessionResponse } from '../../types/session';
import { AnimatedCard } from '../../components/common/AnimatedCard';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { createRefreshControl } from '../../components/common/PullToRefresh';
import { formatDate, formatDuration } from '../../utils/formatters';
import { SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

export function MyClassesScreen({ navigation }: any) {
  const [classes, setClasses] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const fetchData = useCallback(async () => {
    try {
      const res = await tutorService.getMyClasses({ status: activeTab });
      setClasses((res.data as any).data || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Classes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateClass')} style={styles.addBtn}>
          <Plus size={24} color={colors.primary.blue} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['active', 'past'] as const).map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'active' ? 'Active' : 'Past'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={createRefreshControl({ refreshing, onRefresh: () => { setRefreshing(true); fetchData(); } })}
        renderItem={({ item, index }) => (
          <AnimatedCard index={index} onPress={() => navigation.navigate('ClassSpace', { sessionId: item.id })}>
            <Text style={styles.className}>{item.title}</Text>
            <Text style={styles.classMeta}>{formatDate(item.start_time)} - {formatDuration(item.duration_minutes)}</Text>
            <View style={styles.classBadges}>
              <Badge text={SESSION_TYPE_LABELS[item.session_type] || ''} />
              <Badge text={MODE_LABELS[item.mode] || ''} variant="neutral" />
              <Badge text={`${item.enrolled_count} enrolled`} variant="success" />
            </View>
          </AnimatedCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={<BookOpen size={48} color={colors.text.muted} strokeWidth={1.5} />}
            title={activeTab === 'active' ? 'No active classes' : 'No past classes'}
            description="Create a new class to get started"
            actionLabel="Create Class"
            onAction={() => navigation.navigate('CreateClass')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  title: { ...typography.h1, color: colors.text.heading },
  addBtn: { padding: spacing[2] },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing[5], marginTop: spacing[4], marginBottom: spacing[4], gap: spacing[2] },
  tab: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: 999, backgroundColor: colors.surface.high },
  tabActive: { backgroundColor: colors.primary.blue },
  tabText: { ...typography.labelMd, color: colors.text.body },
  tabTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8], gap: spacing[3] },
  className: { ...typography.titleSm, color: colors.text.heading },
  classMeta: { ...typography.bodySm, color: colors.text.muted, marginTop: 4 },
  classBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
});
