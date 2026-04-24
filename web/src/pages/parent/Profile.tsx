import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import { useAuthStore } from '@/store/authStore';
import styles from '../student/Profile.module.css';

export default function Profile() {
  const account = useAuthStore((s) => s.account);

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Avatar src={account?.profile_picture_url ?? null} firstName={account?.first_name ?? ''} lastName={account?.last_name ?? ''} size="xl" />
            <div>
              <h2>{account?.first_name} {account?.last_name}</h2>
              <p className={styles.email}>{account?.email}</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-label-md)', marginTop: 'var(--space-1)' }}>Parent Account</p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
