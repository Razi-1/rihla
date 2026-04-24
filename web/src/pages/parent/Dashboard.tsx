import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Shield, UserPlus } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import { parentService } from '@/services/parentService';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { ParentDashboard } from '@/types/parent';
import styles from '../shared/DashboardPage.module.css';
import cardStyles from './ParentCard.module.css';

export default function Dashboard() {
  const [data, setData] = useState<ParentDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getDashboard().then((res) => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageTransition><div className={styles.page}><div className={styles.statsGrid}>{[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={90} borderRadius="var(--radius-md)" />)}</div></div></PageTransition>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.blue}`}><Users size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.children.length ?? 0}</div><div className={styles.statLabel}>Children</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.green}`}><Calendar size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.upcoming_sessions_total ?? 0}</div><div className={styles.statLabel}>Upcoming Sessions</div></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.orange}`}><Shield size={22} strokeWidth={1.5} /></div>
            <div><div className={styles.statValue}>{data?.pending_permissions ?? 0}</div><div className={styles.statLabel}>Pending Permissions</div></div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>My Children</h2>
            <Link to="/parent/link-child"><Button size="sm" icon={<UserPlus size={14} strokeWidth={1.5} />}>Link Child</Button></Link>
          </div>

          {data?.children.length === 0 ? (
            <EmptyState icon={Users} title="No children linked" description="Link your child's account to monitor their classes and manage permissions." action={<Link to="/parent/link-child"><Button>Link Child</Button></Link>} />
          ) : (
            <motion.div className={cardStyles.grid} variants={staggerContainer} initial="initial" animate="animate">
              {data?.children.map((child) => (
                <motion.div key={child.id} variants={staggerItem}>
                  <Link to={`/parent/children/${child.id}`} className={cardStyles.card}>
                    <Avatar src={child.profile_picture_url} firstName={child.first_name} lastName={child.last_name} size="lg" />
                    <div className={cardStyles.info}>
                      <h3>{child.first_name} {child.last_name}</h3>
                      <p>{child.email}</p>
                      <div className={cardStyles.stats}>
                        <Badge variant={child.status === 'active' ? 'success' : 'warning'}>{child.status}</Badge>
                        <span>{child.active_classes} classes</span>
                        <span>{child.upcoming_sessions} upcoming</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
