import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Check, X } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { parentService } from '@/services/parentService';
import type { ChildDetail } from '@/types/parent';
import styles from './ChildOverview.module.css';

export default function ChildOverview() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    parentService.getChild(id)
      .then((res) => setData(res.data.data))
      .catch((err) => {
        console.error('[ChildOverview] Failed to load child detail:', err);
        setError(err?.response?.data?.detail ?? 'Failed to load child details');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePermission = async (permId: string, status: 'granted' | 'denied') => {
    setActionLoading(permId);
    try {
      await parentService.updatePermission(permId, status);
      if (data) {
        setData({
          ...data,
          permissions: data.permissions.map((p) =>
            p.id === permId ? { ...p, status } : p
          ),
        });
      }
    } catch (err) {
      console.error('[ChildOverview] Failed to update permission:', err);
    }
    setActionLoading(null);
  };

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (error) return <PageTransition><div style={{ padding: '2rem', color: 'var(--color-error)' }}>{error}</div></PageTransition>;
  if (!data) return <div>Child not found</div>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <Avatar src={data.profile_picture_url} firstName={data.first_name} lastName={data.last_name} size="xl" />
          <div>
            <h1>{data.first_name} {data.last_name}</h1>
            <p className={styles.email}>{data.email}</p>
            <div className={styles.badges}>
              <Badge variant={data.link_status === 'active' ? 'success' : 'warning'}>{data.link_status}</Badge>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2><Shield size={18} strokeWidth={1.5} /> Tutor Permissions</h2>
          {data.permissions.length === 0 ? (
            <p className={styles.empty}>No tutor permissions to manage yet.</p>
          ) : (
            <div className={styles.permList}>
              {data.permissions.map((perm) => (
                <div key={perm.id} className={styles.permCard}>
                  <div className={styles.permInfo}>
                    <span className={styles.permName}>{perm.permission_type}</span>
                    <Badge variant={perm.status === 'granted' ? 'success' : perm.status === 'denied' ? 'error' : 'warning'}>{perm.status}</Badge>
                  </div>
                  {perm.status === 'pending' && (
                    <div className={styles.permActions}>
                      <Button size="sm" variant="primary" onClick={() => handlePermission(perm.id, 'granted')} loading={actionLoading === perm.id} icon={<Check size={14} strokeWidth={1.5} />}>Grant</Button>
                      <Button size="sm" variant="secondary" onClick={() => handlePermission(perm.id, 'denied')} loading={actionLoading === perm.id} icon={<X size={14} strokeWidth={1.5} />}>Deny</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {data.classes.length > 0 && (
          <div className={styles.section}>
            <h2>Active Classes</h2>
            <div className={styles.classList}>
              {data.classes.map((c) => (
                <div key={c.id} className={styles.classItem}>
                  <span className={styles.classTitle}>{c.title}</span>
                  <span className={styles.classTutor}>{c.session_type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
