import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import styles from './AdminShell.module.css';

export function AdminShell() {
  return (
    <div className={styles.shell}>
      <AdminSidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
