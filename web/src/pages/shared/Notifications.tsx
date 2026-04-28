import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notificationService';
import { formatRelative } from '@/utils/formatters';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import styles from './Notifications.module.css';

export default function Notifications() {
  const { notifications, setNotifications, markRead, markAllRead } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService.list()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data ?? [];
        setNotifications(data);
      })
      .catch((err) => console.error('[Notifications] Failed to load:', err))
      .finally(() => setLoading(false));
  }, [setNotifications]);

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      markAllRead();
    } catch (err) {
      console.error('[Notifications] Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      markRead(id);
    } catch (err) {
      console.error('[Notifications] Failed to mark read:', err);
    }
  };

  if (loading) return <PageTransition><div /></PageTransition>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1>Notifications</h1>
          <Button variant="secondary" size="sm" onClick={handleMarkAll} icon={<Check size={14} strokeWidth={1.5} />}>Mark all read</Button>
        </div>

        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="All caught up" description="You have no notifications." />
        ) : (
          <motion.div className={styles.list} variants={staggerContainer} initial="initial" animate="animate">
            {notifications.map((n) => (
              <motion.button
                key={n.id}
                variants={staggerItem}
                className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
                onClick={() => handleMarkRead(n.id)}
              >
                <div className={styles.content}>
                  <span className={styles.title}>{n.title}</span>
                  <span className={styles.body}>{n.body}</span>
                  <span className={styles.time}>{formatRelative(n.created_at)}</span>
                </div>
                {!n.is_read && <div className={styles.dot} />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
