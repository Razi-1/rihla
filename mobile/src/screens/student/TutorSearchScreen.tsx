import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { searchService } from '../../services/searchService';
import { subjectService } from '../../services/subjectService';
import { TutorCardResponse } from '../../types/tutor';
import { SearchFilters } from '../../types/search';
import { TutorCard } from '../../components/search/TutorCard';
import { AISearchBar } from '../../components/search/AISearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/Skeleton';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface SubjectItem { id: string; name: string; }
interface LevelItem { id: string; name: string; }

function normalizeResults(raw: any): { tutors: TutorCardResponse[]; next_cursor: string | null; has_more: boolean } {
  const list = raw?.data ?? raw?.results ?? raw?.tutors ?? [];
  const mapped = list.map((t: any) => ({
    ...t,
    account_id: t.account_id || t.id,
  }));
  return {
    tutors: mapped,
    next_cursor: raw?.next_cursor ?? null,
    has_more: raw?.has_more ?? false,
  };
}

export function TutorSearchScreen({ navigation }: any) {
  const [tutors, setTutors] = useState<TutorCardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [levels, setLevels] = useState<LevelItem[]>([]);

  useEffect(() => {
    subjectService.getSubjects().then((r: any) => {
      const data = r.data?.data ?? r.data ?? [];
      setSubjects(data);
    }).catch(() => {});
    subjectService.getEducationLevels().then((r: any) => {
      const data = r.data?.data ?? r.data ?? [];
      setLevels(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchTutors(true);
  }, []);

  const fetchTutors = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = { ...filters, cursor: reset ? undefined : (cursor ?? undefined), limit: 20 };
      const res = await searchService.searchTutors(params);
      const body = (res.data as any)?.data ? (res.data as any) : { data: res.data };
      const { tutors: items, next_cursor, has_more: more } = normalizeResults(body);
      setTutors(reset ? items : [...tutors, ...items]);
      setCursor(next_cursor);
      setHasMore(more);
      setInitialLoaded(true);
    } catch {} finally {
      setLoading(false);
    }
  }, [filters, cursor, tutors]);

  const handleSearch = useCallback(async (_query: string) => {
    fetchTutors(true);
  }, [fetchTutors]);

  const handleAISearch = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const res = await searchService.aiSearch({ query, limit: 20 });
      const body = (res.data as any);
      const inner = body?.data ?? body;
      const { tutors: items, next_cursor, has_more: more } = normalizeResults(inner);
      setTutors(items);
      setCursor(next_cursor);
      setHasMore(more);
      setInitialLoaded(true);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loading) return;
    fetchTutors(false);
  }, [cursor, hasMore, loading, fetchTutors]);

  const applyFilters = () => {
    setShowFilters(false);
    fetchTutors(true);
  };

  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
    setTimeout(() => fetchTutors(true), 0);
  };

  const activeFilterCount = [filters.subject_id, filters.education_level_id, filters.mode, filters.gender, filters.max_rate].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Find Tutors</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <SlidersHorizontal size={20} color={colors.primary.blue} strokeWidth={1.5} />
          {activeFilterCount > 0 && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>}
        </TouchableOpacity>
      </View>
      <AISearchBar onSearch={handleSearch} onAISearch={handleAISearch} isLoading={loading} />

      {loading && !initialLoaded ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={(item) => item.account_id || (item as any).id || String(Math.random())}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TutorCard
              tutor={item}
              index={index}
              onPress={() => navigation.navigate('TutorProfile', { tutorId: item.account_id || (item as any).id })}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            initialLoaded ? (
              <EmptyState
                icon={<SearchIcon size={48} color={colors.text.muted} strokeWidth={1.5} />}
                title="No tutors found"
                description="Try different filters or use AI search"
              />
            ) : (
              <EmptyState
                icon={<SearchIcon size={48} color={colors.text.muted} strokeWidth={1.5} />}
                title="Search for tutors"
                description="Use the search bar or AI search to find the perfect tutor"
              />
            )
          }
        />
      )}

      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X size={24} color={colors.text.heading} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.filterContent}>
            <Text style={styles.filterLabel}>Mode</Text>
            <View style={styles.chipRow}>
              {[{ value: undefined, label: 'All' }, { value: 'online', label: 'Online' }, { value: 'physical', label: 'In-Person' }, { value: 'hybrid', label: 'Hybrid' }].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, filters.mode === opt.value && !!opt.value && styles.chipActive]}
                  onPress={() => setFilters((f) => ({ ...f, mode: opt.value as any }))}
                >
                  <Text style={[styles.chipText, filters.mode === opt.value && !!opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {[{ value: undefined, label: 'Any' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.chip, filters.gender === opt.value && !!opt.value && styles.chipActive]}
                  onPress={() => setFilters((f) => ({ ...f, gender: opt.value }))}
                >
                  <Text style={[styles.chipText, filters.gender === opt.value && !!opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Max Price (LKR)"
              placeholder="e.g. 3000"
              keyboardType="numeric"
              value={filters.max_rate?.toString() || ''}
              onChangeText={(v) => setFilters((f) => ({ ...f, max_rate: v ? Number(v) : undefined }))}
            />

            <View style={styles.filterActions}>
              <Button title="Apply Filters" onPress={applyFilters} fullWidth size="lg" />
              <Button title="Clear All" onPress={clearFilters} fullWidth size="md" variant="secondary" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginTop: spacing[5], marginBottom: spacing[4] },
  title: { ...typography.h1, color: colors.text.heading },
  filterButton: { flexDirection: 'row', alignItems: 'center', padding: spacing[2], backgroundColor: colors.primary.light, borderRadius: radius.full },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: colors.semantic.error, borderRadius: 10, width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  loading: { paddingHorizontal: spacing[5] },
  filterModal: { flex: 1, backgroundColor: colors.surface.base },
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.surface.high },
  filterTitle: { ...typography.h2, color: colors.text.heading },
  filterContent: { padding: spacing[5], gap: spacing[4] },
  filterLabel: { ...typography.labelMd, color: colors.text.heading, marginBottom: spacing[1] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, backgroundColor: colors.surface.high },
  chipActive: { backgroundColor: colors.primary.blue },
  chipText: { ...typography.labelSm, color: colors.text.body },
  chipTextActive: { color: '#fff' },
  filterActions: { gap: spacing[3], marginTop: spacing[4] },
});
