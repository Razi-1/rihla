import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, BookOpen, Calendar, Clock, PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { tutorService } from '@/services/tutorService';
import { formatDateTime } from '@/utils/formatters';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { TutorDashboard } from '@/types/tutor';
import styles from '../shared/DashboardPage.module.css';

export default function Dashboard() {
  const [data, setData] = useState<TutorDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorService.getDashboard().then((res) => setData(res.data.data)).catch((err) => console.error('[TutorDashboard] Failed to load:', err)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageTransition><div className={styles.page}><div className={styles.statsGrid}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={90} borderRadius="var(--radius-md)" />)}</div></div></PageTransition>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.blue}`}><Calendar size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.upcoming_sessions ?? 0}</div><div className={styles.statLabel}>Upcoming</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.green}`}><Users size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.active_students ?? 0}</div><div className={styles.statLabel}>Active Students</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.orange}`}><BookOpen size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.total_classes ?? 0}</div><div className={styles.statLabel}>Total Classes</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.purple}`}><CheckCircle size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.profile_completeness ?? 0}%</div><div className={styles.statLabel}>Profile</div></div>
          </div>
        </div>

        <div className={styles.sectionGrid}>
          <div>
            {data?.next_session && (
              <div className={styles.nextSession}>
                <h3>{data.next_session.title}</h3>
                <p><Clock size={14} strokeWidth={1.5} /> {formatDateTime(data.next_session.start_time)}</p>
              </div>
            )}

            {data?.completion_steps && data.completion_steps.some((s) => !s.completed) && (
              <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
                <h2>Complete Your Profile</h2>
                <motion.div variants={staggerContainer} initial="initial" animate="animate" style={{ marginTop: 'var(--space-4)' }}>
                  {data.completion_steps.map((step) => (
                    <motion.div key={step.key} variants={staggerItem} className={styles.listItem}>
                      {step.completed ? <CheckCircle size={16} strokeWidth={1.5} color="var(--color-success)" /> : <AlertCircle size={16} strokeWidth={1.5} color="var(--color-warning)" />}
                      <span className={styles.listItemTitle} style={{ color: step.completed ? 'var(--color-text-muted)' : 'var(--color-text-heading)' }}>{step.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Link to="/tutor/create-class"><Button fullWidth icon={<PlusCircle size={16} strokeWidth={1.5} />}>Create Class</Button></Link>
              <Link to="/tutor/edit-profile"><Button variant="secondary" fullWidth>Edit Profile</Button></Link>
              <Link to="/tutor/preview"><Button variant="secondary" fullWidth>Preview Profile</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
