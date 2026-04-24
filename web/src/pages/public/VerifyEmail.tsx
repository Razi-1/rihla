import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { authService } from '@/services/authService';
import PageTransition from '@/components/common/PageTransition';
import styles from './AuthPage.module.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    authService.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.centerCard}>
          {status === 'loading' && (
            <div className={styles.statusContent}>
              <Loader2 size={48} strokeWidth={1.5} className={styles.spinner} />
              <h2>Verifying your email...</h2>
            </div>
          )}
          {status === 'success' && (
            <div className={styles.statusContent}>
              <CheckCircle size={48} strokeWidth={1.5} color="var(--color-success)" />
              <h2>Email Verified</h2>
              <p>Your email has been successfully verified. You can now access all features.</p>
              <Link to="/login" className={styles.linkBtn}>Go to Login</Link>
            </div>
          )}
          {status === 'error' && (
            <div className={styles.statusContent}>
              <XCircle size={48} strokeWidth={1.5} color="var(--color-error)" />
              <h2>Verification Failed</h2>
              <p>The link may be expired or invalid. Please request a new verification email.</p>
              <Link to="/login" className={styles.linkBtn}>Go to Login</Link>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
