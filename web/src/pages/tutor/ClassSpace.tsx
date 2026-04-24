import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, Users, Video, QrCode, Trash2 } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Skeleton from '@/components/common/Skeleton';
import { sessionService } from '@/services/sessionService';
import { attendanceService } from '@/services/attendanceService';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { SESSION_TYPES, SESSION_MODES } from '@/utils/constants';
import type { Session } from '@/types/session';
import type { AttendanceRecord } from '@/types/session';
import styles from '../student/ClassDetail.module.css';

export default function ClassSpace() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      sessionService.get(id),
      attendanceService.getSessionAttendance(id).catch(() => ({ data: { data: [] } })),
    ]).then(([sessionRes, attendanceRes]) => {
      setSession(sessionRes.data.data);
      setAttendance(attendanceRes.data.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await sessionService.delete(id);
      window.history.back();
    } catch { /* ignore */ }
    setDeleting(false);
  };

  const handleGenerateQR = async () => {
    if (!id) return;
    try {
      const res = await attendanceService.generateQR(id);
      window.open(`data:image/png;base64,${res.data.data.qr_data}`, '_blank');
    } catch { /* ignore */ }
  };

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (!session) return <div>Class not found</div>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div><h1>{session.title}</h1></div>
            <Badge variant={session.status === 'active' ? 'success' : 'default'}>{session.status}</Badge>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}><Clock size={16} strokeWidth={1.5} /><span>{formatDateTime(session.start_time)} &middot; {formatDuration(session.duration_minutes)}</span></div>
            <div className={styles.detailItem}><Users size={16} strokeWidth={1.5} /><span>{SESSION_TYPES[session.session_type as keyof typeof SESSION_TYPES]}</span>{session.enrolled_count !== undefined && <span>&middot; {session.enrolled_count} enrolled</span>}</div>
            <div className={styles.detailItem}><span>{SESSION_MODES[session.mode as keyof typeof SESSION_MODES]}</span></div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {session.mode !== 'physical' && <Button icon={<Video size={16} strokeWidth={1.5} />} onClick={() => window.open(`/video/${session.jitsi_room_name}`, '_blank')}>Join Video</Button>}
            <Button variant="secondary" icon={<QrCode size={16} strokeWidth={1.5} />} onClick={handleGenerateQR}>Generate QR</Button>
            <Button variant="danger" icon={<Trash2 size={16} strokeWidth={1.5} />} onClick={() => setShowDelete(true)}>Cancel Class</Button>
          </div>

          {attendance.length > 0 && (
            <div style={{ marginTop: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--text-title-lg)', marginBottom: 'var(--space-4)' }}>Attendance ({attendance.length})</h2>
              {attendance.map((a) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-2) 0', fontSize: 'var(--text-body-sm)' }}>
                  <span style={{ fontWeight: 500 }}>{a.student_name}</span>
                  <Badge variant="success">{a.method}</Badge>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}>{formatDateTime(a.recorded_at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
          title="Cancel Class"
          message="Are you sure you want to cancel this class? This action cannot be undone."
          confirmLabel="Cancel Class"
          variant="danger"
          loading={deleting}
        />
      </div>
    </PageTransition>
  );
}
