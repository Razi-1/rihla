import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Mail, Clock, Search, Users } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { studentService } from '@/services/studentService';
import { formatDateTime } from '@/utils/formatters';
import { SESSION_TYPES } from '@/utils/constants';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { StudentDashboard } from '@/types/student';
import styles from '../shared/DashboardPage.module.css';

export default function Dashboard() {
  const [data, setData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getDashboard()
      .then((res) => setData(res.data.data))
      .catch((err) => console.error('[StudentDashboard] Failed to load:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className={styles.page}>
          <div className={styles.statsGrid}>
            {[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={90} borderRadius="var(--radius-md)" />)}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.blue}`}><Calendar size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.upcoming_sessions ?? 0}</div><div className={styles.statLabel}>Upcoming Sessions</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.green}`}><BookOpen size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.active_classes ?? 0}</div><div className={styles.statLabel}>Active Classes</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.orange}`}><Mail size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.pending_invites ?? 0}</div><div className={styles.statLabel}>Pending Invites</div></div>
          </div>
        </div>

        <div className={styles.sectionGrid}>
          <div>
            {data?.next_session && (
              <div className={styles.nextSession}>
                <h3>{data.next_session.title}</h3>
                <p><Clock size={14} strokeWidth={1.5} /> {formatDateTime(data.next_session.start_time)}</p>
                <p>with {data.next_session.tutor_name}</p>
              </div>
            )}

            {data?.active_classes_list && data.active_classes_list.length > 0 && (
              <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
                <div className={styles.sectionHeader}>
                  <h2>Active Classes</h2>
                </div>
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  {data.active_classes_list.map((cls) => (
                    <motion.div key={cls.id} variants={staggerItem} className={styles.listItem}>
                      <Users size={16} strokeWidth={1.5} color="var(--color-primary-blue)" />
                      <div className={styles.listItemContent}>
                        <div className={styles.listItemTitle}>{cls.title}</div>
                        <div className={styles.listItemSub}>
                          with {cls.tutor_name} &middot; {SESSION_TYPES[cls.session_type as keyof typeof SESSION_TYPES] ?? cls.session_type}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {data?.recent_invites && data.recent_invites.length > 0 && (
              <div className={styles.section} style={{ marginTop: 'var(--space-6)' }}>
                <div className={styles.sectionHeader}>
                  <h2>Recent Invites</h2>
                  <Link to="/student/invites"><Button variant="ghost" size="sm">View All</Button></Link>
                </div>
                <motion.div variants={staggerContainer} initial="initial" animate="animate">
                  {data.recent_invites.map((inv) => (
                    <motion.div key={inv.id} variants={staggerItem} className={styles.listItem}>
                      <Mail size={16} strokeWidth={1.5} color="var(--color-primary-blue)" />
                      <div className={styles.listItemContent}>
                        <div className={styles.listItemTitle}>{inv.session_title}</div>
                        <div className={styles.listItemSub}>{inv.tutor_name} &middot; {formatDateTime(inv.start_time)}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Link to="/student/search"><Button variant="primary" fullWidth icon={<Search size={16} strokeWidth={1.5} />}>Find Tutors</Button></Link>
              <Link to="/calendar"><Button variant="secondary" fullWidth icon={<Calendar size={16} strokeWidth={1.5} />}>View Calendar</Button></Link>
              <Link to="/chat"><Button variant="secondary" fullWidth icon={<Mail size={16} strokeWidth={1.5} />}>Messages</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
