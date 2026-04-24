import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import NotificationDropdown from '@/components/notification/NotificationDropdown';
import { useState } from 'react';
import { notificationBounce } from '@/hooks/useAnimations';
import styles from './Header.module.css';

const pageTitles: Record<string, string> = {
  '/student/dashboard': 'Dashboard',
  '/student/search': 'Find Tutors',
  '/student/invites': 'Class Invites',
  '/student/profile': 'My Profile',
  '/tutor/dashboard': 'Dashboard',
  '/tutor/create-class': 'Create Class',
  '/tutor/edit-profile': 'Edit Profile',
  '/tutor/preview': 'Profile Preview',
  '/parent/dashboard': 'Dashboard',
  '/parent/link-child': 'Link Child',
  '/parent/profile': 'My Profile',
  '/calendar': 'Calendar',
  '/chat': 'Messages',
  '/settings': 'Settings',
  '/notifications': 'Notifications',
  '/help': 'Help & Support',
};

export default function Header() {
  const location = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const account = useAuthStore((s) => s.account);
  const [showNotifications, setShowNotifications] = useState(false);

  const title = pageTitles[location.pathname] ?? '';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {account && !account.is_email_verified && (
          <div className={styles.verifyBanner}>
            Please verify your email to unlock all features
          </div>
        )}
      </div>

      <div className={styles.right}>
        <div className={styles.notificationWrapper}>
          <button
            className={styles.bellButton}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <motion.span
                className={styles.badge}
                variants={notificationBounce}
                initial="initial"
                animate="animate"
                key={unreadCount}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
