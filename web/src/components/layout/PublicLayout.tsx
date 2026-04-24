import { Outlet, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Footer from './Footer';
import styles from './PublicLayout.module.css';

export default function PublicLayout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>R</div>
            <span>Rihla</span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/tutors" className={styles.navLink}>
              <Search size={16} strokeWidth={1.5} />
              Find Tutors
            </Link>
            <Link to="/login" className={styles.navLink}>Log In</Link>
            <Link to="/register" className={styles.registerBtn}>Get Started</Link>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
