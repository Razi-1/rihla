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
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    parentService.getChild(id).then((res) => setData(res.data.data)).finally(() => setLoading(false));
  }, [id]);

  const handlePermission = async (permId: string, status: 'granted' | 'denied') => {
    setActionLoading(permId);
    try {
      await parentService.updatePermission(permId, status);
      if (data) {
        setData({
          ...data,
          tutor_permissions: data.tutor_permissions.map((p) =>
            p.id === permId ? { ...p, status } : p
          ),
        });
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (!data) return <div>Child not found</div>;

  const { child } = data;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <Avatar src={child.profile_picture_url} firstName={child.first_name} lastName={child.last_name} size="xl" />
          <div>
            <h1>{child.first_name} {child.last_name}</h1>
            <p className={styles.email}>{child.email}</p>
            <div className={styles.badges}>
              <Badge variant={child.status === 'active' ? 'success' : 'warning'}>{child.status}</Badge>
              {child.is_age_restricted && <Badge variant="info">Under 15</Badge>}
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2><Shield size={18} strokeWidth={1.5} /> Tutor Permissions</h2>
          {data.tutor_permissions.length === 0 ? (
            <p className={styles.empty}>No tutor permissions to manage yet.</p>
          ) : (
            <div className={styles.permList}>
              {data.tutor_permissions.map((perm) => (
                <div key={perm.id} className={styles.permCard}>
                  <Avatar src={perm.tutor_profile_picture} firstName={perm.tutor_name.split(' ')[0] ?? ''} lastName={perm.tutor_name.split(' ')[1] ?? ''} size="md" />
                  <div className={styles.permInfo}>
                    <span className={styles.permName}>{perm.tutor_name}</span>
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

        {data.active_classes.length > 0 && (
          <div className={styles.section}>
            <h2>Active Classes</h2>
            <div className={styles.classList}>
              {data.active_classes.map((c) => (
                <div key={c.session_id} className={styles.classItem}>
                  <span className={styles.classTitle}>{c.title}</span>
                  <span className={styles.classTutor}>with {c.tutor_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
