import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, X, Clock } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/Skeleton';
import { inviteService } from '@/services/inviteService';
import { formatDateTime } from '@/utils/formatters';
import { SESSION_TYPES } from '@/utils/constants';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { SessionInvite } from '@/types/session';
import styles from './ClassInvite.module.css';

export default function ClassInvite() {
  const [invites, setInvites] = useState<SessionInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    inviteService.list()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.data;
        setInvites(data);
      })
      .catch((err) => console.error('[ClassInvite] Failed to load invites:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await inviteService.accept(id);
      setInvites(invites.map((inv) => inv.id === id ? { ...inv, status: 'accepted' } : inv));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      await inviteService.decline(id);
      setInvites(invites.map((inv) => inv.id === id ? { ...inv, status: 'declined' } : inv));
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  if (loading) return <PageTransition><div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{[1, 2, 3].map((i) => <Skeleton key={i} width="100%" height={100} borderRadius="var(--radius-md)" />)}</div></PageTransition>;

  return (
    <PageTransition>
      <div>
        {invites.length === 0 ? (
          <EmptyState icon={Mail} title="No invites yet" description="When a tutor invites you to a class, it will appear here." />
        ) : (
          <motion.div className={styles.list} variants={staggerContainer} initial="initial" animate="animate">
            {invites.map((inv) => (
              <motion.div key={inv.id} className={styles.card} variants={staggerItem}>
                <div className={styles.cardTop}>
                  <div>
                    <h3>{inv.session_title ?? 'Untitled Class'}</h3>
                    <p className={styles.meta}>
                      <Clock size={14} strokeWidth={1.5} /> {inv.start_time ? formatDateTime(inv.start_time) : 'TBD'}
                      <span>&middot;</span>
                      {inv.session_type ? SESSION_TYPES[inv.session_type as keyof typeof SESSION_TYPES] : ''}
                    </p>
                    {inv.tutor_name && <p className={styles.tutor}>from {inv.tutor_name}</p>}
                  </div>
                  <Badge variant={inv.status === 'accepted' ? 'success' : inv.status === 'declined' ? 'error' : 'warning'}>
                    {inv.status}
                  </Badge>
                </div>
                {inv.status === 'pending' && (
                  <div className={styles.actions}>
                    <Button variant="primary" size="sm" onClick={() => handleAccept(inv.id)} loading={actionLoading === inv.id} icon={<Check size={14} strokeWidth={1.5} />}>Accept</Button>
                    <Button variant="secondary" size="sm" onClick={() => handleDecline(inv.id)} loading={actionLoading === inv.id} icon={<X size={14} strokeWidth={1.5} />}>Decline</Button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
