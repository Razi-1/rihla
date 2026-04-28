import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, Video, Check, MessageCircle } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { sessionService } from '@/services/sessionService';
import { chatService } from '@/services/chatService';
import { formatDateTime, formatDuration } from '@/utils/formatters';
import { SESSION_TYPES, SESSION_MODES } from '@/utils/constants';
import type { Session } from '@/types/session';
import styles from './ClassDetail.module.css';

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    sessionService.get(id)
      .then((res) => {
        const s = res.data.data ?? (res.data as unknown as Session);
        setSession(s);
        if (s.is_enrolled) setHasJoined(true);
      })
      .catch((err) => console.error('[ClassDetail] Failed to load session:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    if (!id || !session) return;
    setJoining(true);
    setJoinMsg(null);
    try {
      await sessionService.requestJoin(id);
      setHasJoined(true);
      setJoinMsg('Successfully joined the class! A chat with your tutor has been created.');
      try {
        await chatService.createDM(session.tutor_id);
      } catch { /* DM may already exist */ }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (msg === 'Already enrolled in this class') {
        setHasJoined(true);
        setJoinMsg('You are already enrolled in this class.');
      } else {
        setJoinMsg(msg ?? 'Failed to join class');
      }
    }
    setJoining(false);
  };

  if (loading) return <PageTransition><Skeleton width="100%" height={400} borderRadius="var(--radius-md)" /></PageTransition>;
  if (!session) return <div>Class not found</div>;

  const isGroup = session.session_type === 'group_class';
  const spotsLeft = isGroup && session.max_group_size
    ? session.max_group_size - (session.enrolled_count ?? 0)
    : null;

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1>{session.title}</h1>
              <p className={styles.tutor}>by {session.tutor_name ?? 'Tutor'}</p>
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
              {spotsLeft !== null && (
                <span style={{ color: spotsLeft <= 2 ? 'var(--color-warning)' : 'var(--color-text-muted)' }}>
                  &middot; {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </span>
              )}
            </div>
            <div className={styles.detailItem}>
              <MapPin size={16} strokeWidth={1.5} />
              <span>{SESSION_MODES[session.mode as keyof typeof SESSION_MODES]}</span>
              {session.location_city && <span> — {session.location_city}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {isGroup && session.status === 'active' && (
              <Button
                icon={hasJoined ? <Check size={16} strokeWidth={1.5} /> : <Users size={16} strokeWidth={1.5} />}
                onClick={handleJoin}
                loading={joining}
                disabled={hasJoined || (spotsLeft !== null && spotsLeft <= 0)}
                variant={hasJoined ? 'secondary' : 'primary'}
              >
                {hasJoined ? 'Joined' : 'Join Class'}
              </Button>
            )}

            {hasJoined && (
              <Button
                variant="secondary"
                icon={<MessageCircle size={16} strokeWidth={1.5} />}
                onClick={async () => {
                  try {
                    const res = await chatService.createDM(session.tutor_id);
                    navigate(`/chat/${res.data.data.room_id}`);
                  } catch { /* ignore */ }
                }}
              >
                Message Tutor
              </Button>
            )}

            {session.mode !== 'physical' && session.jitsi_room_name && (
              <Button
                variant="secondary"
                icon={<Video size={16} strokeWidth={1.5} />}
                onClick={() => window.open(`/video/${session.jitsi_room_name}?session=${id}`, '_blank')}
              >
                Join Video Call
              </Button>
            )}
          </div>

          {joinMsg && (
            <p style={{
              marginTop: 'var(--space-3)',
              fontSize: 'var(--text-body-sm)',
              color: joinMsg.includes('Successfully') || joinMsg.includes('already enrolled') ? 'var(--color-success)' : 'var(--color-error)',
            }}>
              {joinMsg}
            </p>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
