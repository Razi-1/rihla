import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import TutorCard from '@/components/search/TutorCard';
import FilterPanel from '@/components/search/FilterPanel';
import LoadMoreButton from '@/components/common/LoadMoreButton';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { SkeletonCard } from '@/components/common/Skeleton';
import { searchService, type SearchFilters } from '@/services/searchService';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { TutorCard as TutorCardType } from '@/types/tutor';
import styles from '../public/TutorSearchPublic.module.css';

export default function TutorSearch() {
  const [tutors, setTutors] = useState<TutorCardType[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState('');

  const fetchTutors = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const res = await searchService.searchTutors({
        ...filters,
        cursor: reset ? undefined : (cursor ?? undefined),
      });
      setTutors(reset ? res.data.data : [...tutors, ...res.data.data]);
      setHasMore(res.data.has_more);
      setCursor(res.data.next_cursor);
    } catch { /* ignore */ }
    setLoading(false);
  }, [filters, cursor, tutors]);

  useEffect(() => {
    fetchTutors(true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAISearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiInterpretation('');
    try {
      const res = await searchService.aiSearch(aiQuery);
      setTutors(res.data.data.results);
      setAiInterpretation(res.data.data.interpreted_query);
      setHasMore(false);
    } catch { /* ignore */ }
    setAiLoading(false);
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="AI Search"
                placeholder="e.g. I need a female math tutor for O-Levels, online, under 3000 LKR"
                icon={<Sparkles size={16} strokeWidth={1.5} />}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
            </div>
            <Button onClick={handleAISearch} loading={aiLoading} icon={<Search size={16} strokeWidth={1.5} />}>
              Search
            </Button>
          </div>
          {aiInterpretation && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)', fontStyle: 'italic' }}
            >
              Interpreted: {aiInterpretation}
            </motion.p>
          )}
        </div>

        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <FilterPanel filters={filters} onChange={setFilters} />
          </aside>
          <div className={styles.results}>
            {loading && tutors.length === 0 ? (
              <div className={styles.grid}>
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : tutors.length === 0 ? (
              <EmptyState icon={Search} title="No tutors found" description="Try adjusting your filters or search." />
            ) : (
              <>
                <motion.div className={styles.grid} variants={staggerContainer} initial="initial" animate="animate">
                  {tutors.map((t) => (
                    <motion.div key={t.id} variants={staggerItem}>
                      <TutorCard tutor={t} linkPrefix="/student/tutors" />
                    </motion.div>
                  ))}
                </motion.div>
                <LoadMoreButton onClick={() => fetchTutors()} loading={loading} hasMore={hasMore} />
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
