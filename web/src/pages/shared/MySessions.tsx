import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, Clock, Users, MapPin } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { studentService } from '@/services/studentService';
import { tutorService } from '@/services/tutorService';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { SESSION_TYPES, SESSION_MODES } from '@/utils/constants';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { Session } from '@/types/session';
import styles from './MySessions.module.css';

export default function MySessions() {
  const account = useAuthStore((s) => s.account);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        if (account?.account_type === 'student') {
          const res = await studentService.getClasses();
          setSessions(Array.isArray(res.data.data) ? res.data.data : res.data as unknown as Session[]);
        } else if (account?.account_type === 'tutor') {
          const res = await tutorService.getClasses();
          setSessions(Array.isArray(res.data.data) ? res.data.data : res.data as unknown as Session[]);
        }
      } catch (err) {
        console.error('[MySessions] Failed to load:', err);
      }
      setLoading(false);
    };
    fetchSessions();
  }, [account]);

  const now = new Date().toISOString();
  const filtered = sessions.filter((s) => {
    if (filter === 'upcoming') return s.end_time >= now;
    if (filter === 'past') return s.end_time < now;
    return true;
  });

  const filterStyle = (f: typeof filter) => ({
    padding: '0.5rem 1rem',
    border: 'none',
    background: filter === f
      ? 'linear-gradient(135deg, var(--color-primary-blue), var(--color-accent-blue))'
      : 'var(--color-surface-low)',
    color: filter === f ? '#fff' : 'var(--color-text-body)',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer' as const,
    fontSize: 'var(--text-body-sm)',
    fontWeight: 500,
    transition: 'all var(--transition-fast)',
  });

  if (loading) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={120} borderRadius="var(--radius-md)" />)}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>My Sessions</h1>
          <div className={styles.filters}>
            <button style={filterStyle('all')} onClick={() => setFilter('all')}>All</button>
            <button style={filterStyle('upcoming')} onClick={() => setFilter('upcoming')}>Upcoming</button>
            <button style={filterStyle('past')} onClick={() => setFilter('past')}>Past</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No sessions found"
            description={filter === 'all' ? 'Your classes and booked sessions will appear here.' : `No ${filter} sessions.`}
          />
        ) : (
          <motion.div className={styles.list} variants={staggerContainer} initial="initial" animate="animate">
            {filtered.map((s) => {
              const hasVideo = s.mode !== 'physical' && s.jitsi_room_name;
              return (
                <motion.div key={s.id} className={styles.card} variants={staggerItem}>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <h3>{s.title}</h3>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Badge variant={s.status === 'active' ? 'success' : s.status === 'completed' ? 'default' : 'warning'}>
                          {s.status}
                        </Badge>
                        <Badge variant="info">
                          {SESSION_TYPES[s.session_type as keyof typeof SESSION_TYPES] ?? s.session_type}
                        </Badge>
                      </div>
                    </div>

                    <div className={styles.cardMeta}>
                      <span><Clock size={14} strokeWidth={1.5} /> {formatDateTime(s.start_time)} &middot; {formatDuration(s.duration_minutes)}</span>
                      <span><MapPin size={14} strokeWidth={1.5} /> {SESSION_MODES[s.mode as keyof typeof SESSION_MODES]}</span>
                      {s.tutor_name && account?.account_type === 'student' && (
                        <span><Users size={14} strokeWidth={1.5} /> {s.tutor_name}</span>
                      )}
                      {s.enrolled_count !== undefined && account?.account_type === 'tutor' && (
                        <span><Users size={14} strokeWidth={1.5} /> {s.enrolled_count} enrolled</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {hasVideo && (
                      <Link to={`/video/${s.jitsi_room_name}?session=${s.id}`} target="_blank">
                        <Button size="sm" icon={<Video size={14} strokeWidth={1.5} />}>
                          Join Call
                        </Button>
                      </Link>
                    )}
                    {account?.account_type === 'tutor' && (
                      <Link to={`/tutor/classes/${s.id}`}>
                        <Button size="sm" variant="secondary">Manage</Button>
                      </Link>
                    )}
                    {account?.account_type === 'student' && (
                      <Link to={`/student/classes/${s.id}`}>
                        <Button size="sm" variant="secondary">Details</Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
