import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import TutorCard from '@/components/search/TutorCard';
import FilterPanel from '@/components/search/FilterPanel';
import LoadMoreButton from '@/components/common/LoadMoreButton';
import EmptyState from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { searchService, type SearchFilters } from '@/services/searchService';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { TutorCard as TutorCardType } from '@/types/tutor';
import styles from './TutorSearchPublic.module.css';

export default function TutorSearchPublic() {
  const [tutors, setTutors] = useState<TutorCardType[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchTutors = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const res = await searchService.searchTutors({
        ...filters,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      const newTutors = res.data.data;
      setTutors(reset ? newTutors : [...tutors, ...newTutors]);
      setHasMore(res.data.has_more);
      setCursor(res.data.next_cursor);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filters, cursor, tutors]);

  useEffect(() => {
    fetchTutors(true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Find Tutors</h1>
          <p>Browse verified tutors or use filters to narrow your search</p>
        </div>
        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <FilterPanel filters={filters} onChange={setFilters} />
          </aside>
          <div className={styles.results}>
            {loading && tutors.length === 0 ? (
              <div className={styles.grid}>
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : tutors.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No tutors found"
                description="Try adjusting your filters or search with different criteria."
              />
            ) : (
              <>
                <motion.div
                  className={styles.grid}
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {tutors.map((t) => (
                    <motion.div key={t.id} variants={staggerItem}>
                      <TutorCard tutor={t} />
                    </motion.div>
                  ))}
                </motion.div>
                <LoadMoreButton
                  onClick={() => fetchTutors()}
                  loading={loading}
                  hasMore={hasMore}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
