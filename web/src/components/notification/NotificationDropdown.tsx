import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notificationService';
import { formatRelative } from '@/utils/formatters';
import { modalVariants } from '@/hooks/useAnimations';
import styles from './NotificationDropdown.module.css';

interface Props {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
  const { notifications, setNotifications, markRead, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationService.list().then((res) => setNotifications(res.data.data));
  }, [setNotifications]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    markAllRead();
  };

  const handleClick = async (n: typeof notifications[0]) => {
    if (!n.is_read) {
      await notificationService.markRead(n.id);
      markRead(n.id);
    }
    if (n.related_entity_type && n.related_entity_id) {
      navigate(`/${n.related_entity_type}/${n.related_entity_id}`);
    }
    onClose();
  };

  return (
    <motion.div
      ref={ref}
      className={styles.dropdown}
      variants={modalVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className={styles.header}>
        <h3>Notifications</h3>
        <button onClick={handleMarkAllRead} className={styles.markAllBtn}>
          <Check size={14} strokeWidth={1.5} /> Mark all read
        </button>
      </div>
      <div className={styles.list}>
        {notifications.length === 0 ? (
          <div className={styles.empty}>
            <Bell size={24} strokeWidth={1.5} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <button
              key={n.id}
              className={`${styles.item} ${!n.is_read ? styles.unread : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className={styles.itemContent}>
                <span className={styles.itemTitle}>{n.title}</span>
                <span className={styles.itemBody}>{n.body}</span>
                <span className={styles.itemTime}>{formatRelative(n.created_at)}</span>
              </div>
              {!n.is_read && <div className={styles.dot} />}
            </button>
          ))
        )}
      </div>
      <button className={styles.viewAll} onClick={() => { navigate('/notifications'); onClose(); }}>
        View all notifications
      </button>
    </motion.div>
  );
}
