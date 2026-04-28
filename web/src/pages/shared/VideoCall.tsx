import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Video } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import Skeleton from '@/components/common/Skeleton';
import { useAuthStore } from '@/store/authStore';
import { sessionService } from '@/services/sessionService';
import { createJitsiMeeting } from '@/lib/jitsi';
import styles from './VideoCall.module.css';

export default function VideoCall() {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<Awaited<ReturnType<typeof createJitsiMeeting>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jitsiReady, setJitsiReady] = useState(false);

  const leaveCall = () => {
    jitsiApiRef.current?.dispose();
    jitsiApiRef.current = null;
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  };

  useEffect(() => {
    if (!containerRef.current || !account) return;

    let disposed = false;

    const initJitsi = async () => {
      let room = roomName ?? '';
      let jwt: string | undefined;

      if (sessionId) {
        try {
          const res = await sessionService.getJitsiToken(sessionId);
          const data = res.data.data;
          jwt = data.token;
          room = data.room_name;
        } catch {
          setError('Could not load video call credentials. You may not have access to this session.');
          setLoading(false);
          return;
        }
      }

      if (disposed) return;

      if (!room || !containerRef.current) {
        setError('No room name provided.');
        setLoading(false);
        return;
      }

      const api = await createJitsiMeeting({
        roomName: room,
        parentNode: containerRef.current,
        displayName: `${account.first_name} ${account.last_name}`,
        email: account.email,
        jwt,
        onReadyToClose: leaveCall,
      });

      if (disposed) {
        api?.dispose();
        return;
      }

      setLoading(false);

      if (!api) {
        setError(
          'Could not load the Jitsi video service. Make sure the Jitsi containers are running ' +
          'and you have accepted the SSL certificate by visiting https://localhost:8443 in your browser.',
        );
        return;
      }

      jitsiApiRef.current = api;
      setJitsiReady(true);
    };

    initJitsi();
    return () => {
      disposed = true;
      jitsiApiRef.current?.dispose();
      jitsiApiRef.current = null;
    };
  }, [roomName, sessionId, account]);

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={leaveCall} icon={<ArrowLeft size={16} strokeWidth={1.5} />}>
            Leave Call
          </Button>
          <span className={styles.roomName}>{roomName ?? 'Video Call'}</span>
        </div>
        <div ref={containerRef} className={styles.container}>
          {loading && <Skeleton width="100%" height="100%" borderRadius="var(--radius-md)" />}
          {error && (
            <div className={styles.placeholder}>
              <Video size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 'var(--space-3)' }} />
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && !jitsiReady && (
            <div className={styles.placeholder}>
              <Video size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: 'var(--space-3)' }} />
              <p>Video call will load here when Jitsi is available.</p>
              <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-text-muted)' }}>Room: {roomName}</p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
