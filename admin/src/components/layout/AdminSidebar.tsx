import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Star,
  ScrollText,
  BookOpen,
  ShieldCheck,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import styles from './AdminSidebar.module.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Users, label: 'Accounts' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/team', icon: ShieldCheck, label: 'Admin Team' },
  { to: '/profile', icon: UserCog, label: 'My Profile' },
];

export function AdminSidebar() {
  const { account, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      const { default: api } = await import('@/lib/axios');
      await api.post('/auth/logout');
    } catch (err) {
      console.error('[AdminSidebar] Backend logout failed:', err);
    }
    logout();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>R</div>
        <div className={styles.brandText}>
          <span className={styles.brandName}>Rihla</span>
          <span className={styles.brandLabel}>Admin Panel</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <item.icon size={18} strokeWidth={1.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.adminInfo}>
          <div className={styles.avatar}>
            {account?.first_name?.[0]}
            {account?.last_name?.[0]}
          </div>
          <div className={styles.adminDetails}>
            <span className={styles.adminName}>
              {account?.first_name} {account?.last_name}
            </span>
            <span className={styles.adminRole}>Administrator</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Sign out">
          <LogOut size={16} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  );
}
