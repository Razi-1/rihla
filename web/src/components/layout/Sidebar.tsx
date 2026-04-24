import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageCircle,
  Settings,
  User,
  BookOpen,
  PlusCircle,
  Users,
  UserPlus,
  HelpCircle,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/utils/formatters';
import type { AccountType } from '@/types/common';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const iconProps = { size: 20, strokeWidth: 1.5 };

const navByRole: Record<AccountType, NavItem[]> = {
  student: [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard {...iconProps} /> },
    { label: 'Find Tutors', path: '/student/search', icon: <Search {...iconProps} /> },
    { label: 'My Invites', path: '/student/invites', icon: <BookOpen {...iconProps} /> },
    { label: 'Calendar', path: '/calendar', icon: <Calendar {...iconProps} /> },
    { label: 'Messages', path: '/chat', icon: <MessageCircle {...iconProps} /> },
    { label: 'My Profile', path: '/student/profile', icon: <User {...iconProps} /> },
  ],
  tutor: [
    { label: 'Dashboard', path: '/tutor/dashboard', icon: <LayoutDashboard {...iconProps} /> },
    { label: 'Create Class', path: '/tutor/create-class', icon: <PlusCircle {...iconProps} /> },
    { label: 'Calendar', path: '/calendar', icon: <Calendar {...iconProps} /> },
    { label: 'Messages', path: '/chat', icon: <MessageCircle {...iconProps} /> },
    { label: 'Edit Profile', path: '/tutor/edit-profile', icon: <User {...iconProps} /> },
    { label: 'Preview Profile', path: '/tutor/preview', icon: <GraduationCap {...iconProps} /> },
  ],
  parent: [
    { label: 'Dashboard', path: '/parent/dashboard', icon: <LayoutDashboard {...iconProps} /> },
    { label: 'My Children', path: '/parent/dashboard', icon: <Users {...iconProps} /> },
    { label: 'Link Child', path: '/parent/link-child', icon: <UserPlus {...iconProps} /> },
    { label: 'Calendar', path: '/calendar', icon: <Calendar {...iconProps} /> },
    { label: 'Messages', path: '/chat', icon: <MessageCircle {...iconProps} /> },
    { label: 'My Profile', path: '/parent/profile', icon: <User {...iconProps} /> },
  ],
};

export default function Sidebar() {
  const account = useAuthStore((s) => s.account);
  const { logout } = useAuth();
  const location = useLocation();

  if (!account) return null;

  const items = navByRole[account.account_type];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>R</div>
        <span className={styles.logoText}>Rihla</span>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/calendar' && item.path !== '/chat' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              {isActive && (
                <motion.div
                  className={styles.activeIndicator}
                  layoutId="sidebar-indicator"
                  transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                />
              )}
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <NavLink to="/settings" className={styles.navItem}>
          <span className={styles.navIcon}><Settings {...iconProps} /></span>
          <span className={styles.navLabel}>Settings</span>
        </NavLink>
        <NavLink to="/help" className={styles.navItem}>
          <span className={styles.navIcon}><HelpCircle {...iconProps} /></span>
          <span className={styles.navLabel}>Help</span>
        </NavLink>
        <button onClick={logout} className={styles.navItem}>
          <span className={styles.navIcon}><LogOut {...iconProps} /></span>
          <span className={styles.navLabel}>Log Out</span>
        </button>

        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {account.profile_picture_url ? (
              <img src={account.profile_picture_url} alt="" />
            ) : (
              getInitials(account.first_name, account.last_name)
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {account.first_name} {account.last_name}
            </span>
            <span className={styles.userRole}>{account.account_type}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
