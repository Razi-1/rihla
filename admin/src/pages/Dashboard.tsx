import { Users, GraduationCap, UserCheck, CalendarDays, Star, ShieldBan } from 'lucide-react';
import { format } from 'date-fns';
import { useApi } from '@/hooks/useApi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getDashboardStats } from '@/services/dashboardService';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { StatCard } from '@/components/common/StatCard';
import { Badge } from '@/components/common/Badge';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  usePageTitle('Dashboard');
  const { data: stats, loading } = useApi(getDashboardStats);

  if (loading || !stats) {
    return (
      <>
        <AdminHeader title="Dashboard" subtitle="Platform overview" />
        <div className={styles.content}>
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="Platform overview" />
      <div className={styles.content}>
        <div className={styles.grid}>
          <StatCard label="Total Students" value={stats.total_students} icon={GraduationCap} accent="blue" />
          <StatCard label="Total Tutors" value={stats.total_tutors} icon={UserCheck} accent="green" />
          <StatCard label="Total Parents" value={stats.total_parents} icon={Users} accent="blue" />
          <StatCard label="Total Sessions" value={stats.total_sessions} icon={CalendarDays} accent="orange" />
          <StatCard label="Pending Reviews" value={stats.pending_reviews} icon={Star} accent="orange" />
          <StatCard label="Restricted Accounts" value={stats.restricted_accounts} icon={ShieldBan} accent="red" />
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Audit Activity</h2>
          <div className={styles.auditList}>
            {stats.recent_audit_entries.length === 0 ? (
              <p className={styles.emptyText}>No recent activity</p>
            ) : (
              stats.recent_audit_entries.slice(0, 10).map((entry) => (
                <div key={entry.id} className={styles.auditItem}>
                  <div className={styles.auditLeft}>
                    <Badge variant={entry.outcome === 'success' ? 'success' : 'error'}>
                      {entry.action_type}
                    </Badge>
                    <span className={styles.auditReason}>{entry.reason}</span>
                  </div>
                  <span className={styles.auditDate}>
                    {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
