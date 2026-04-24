import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { searchService } from '../../services/searchService';
import { TutorCardResponse } from '../../types/tutor';
import { TutorCard } from '../../components/search/TutorCard';
import { AISearchBar } from '../../components/search/AISearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/Skeleton';
import { createRefreshControl } from '../../components/common/PullToRefresh';

export function TutorSearchScreen({ navigation }: any) {
  const [tutors, setTutors] = useState<TutorCardResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchService.searchTutors({ cursor: undefined, limit: 20 });
      setTutors(res.data.tutors);
      setCursor(res.data.next_cursor);
      setHasMore(res.data.has_more);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const handleAISearch = useCallback(async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await searchService.aiSearch({ query, limit: 20 });
      setTutors(res.data.tutors);
      setCursor(res.data.next_cursor);
      setHasMore(res.data.has_more);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loading) return;
    try {
      const res = await searchService.searchTutors({ cursor, limit: 20 });
      setTutors((prev) => [...prev, ...res.data.tutors]);
      setCursor(res.data.next_cursor);
      setHasMore(res.data.has_more);
    } catch {}
  }, [cursor, hasMore, loading]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Find Tutors</Text>
      <AISearchBar onSearch={handleSearch} onAISearch={handleAISearch} isLoading={loading} />

      {loading && !hasSearched ? (
        <View style={styles.loading}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={tutors}
          keyExtractor={(item) => item.account_id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TutorCard
              tutor={item}
              index={index}
              onPress={() => navigation.navigate('TutorProfile', { tutorId: item.account_id })}
            />
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            hasSearched ? (
              <EmptyState
                icon={<SearchIcon size={48} color={colors.text.muted} strokeWidth={1.5} />}
                title="No tutors found"
                description="Try different search criteria or use AI search"
              />
            ) : (
              <EmptyState
                icon={<SearchIcon size={48} color={colors.text.muted} strokeWidth={1.5} />}
                title="Search for tutors"
                description="Use the search bar above or AI search to find the perfect tutor"
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  title: { ...typography.h1, color: colors.text.heading, paddingHorizontal: spacing[5], marginTop: spacing[5], marginBottom: spacing[4] },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  loading: { paddingHorizontal: spacing[5] },
});
