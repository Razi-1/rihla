import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>Rihla</span>
          <p className={styles.tagline}>AI-powered tutoring platform</p>
        </div>
        <div className={styles.links}>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/help">Help & Support</Link>
        </div>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} Rihla. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
