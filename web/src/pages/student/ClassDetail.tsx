import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, MapPin, Users, Video } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { sessionService } from '@/services/sessionService';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { SESSION_TYPES, SESSION_MODES } from '@/utils/constants';
import type { Session } from '@/types/session';
import styles from './ClassDetail.module.css';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    sessionService.get(id).then((res) => setSession(res.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (!session) return <div>Class not found</div>;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1>{session.title}</h1>
              <p className={styles.tutor}>by {session.tutor_name}</p>
            </div>
            <Badge variant={session.status === 'active' ? 'success' : 'default'}>{session.status}</Badge>
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <Clock size={16} strokeWidth={1.5} />
              <span>{formatDateTime(session.start_time)} &middot; {formatDuration(session.duration_minutes)}</span>
            </div>
            <div className={styles.detailItem}>
              <Users size={16} strokeWidth={1.5} />
              <span>{SESSION_TYPES[session.session_type as keyof typeof SESSION_TYPES]}</span>
            </div>
            <div className={styles.detailItem}>
              <MapPin size={16} strokeWidth={1.5} />
              <span>{SESSION_MODES[session.mode as keyof typeof SESSION_MODES]}</span>
              {session.location_city && <span> — {session.location_city}</span>}
            </div>
          </div>

          {session.mode !== 'physical' && session.jitsi_room_name && (
            <Button
              icon={<Video size={16} strokeWidth={1.5} />}
              onClick={() => window.open(`/video/${session.jitsi_room_name}`, '_blank')}
            >
              Join Video Call
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
