import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import styles from './VideoCall.module.css';

export default function VideoCall() {
  const { roomName } = useParams<{ roomName: string }>();
  const navigate = useNavigate();
  const account = useAuthStore((s) => s.account);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!roomName || !containerRef.current || !account) return;

    // Jitsi IFrame API integration
    const domain = 'localhost:8443';
    const options = {
      roomName: roomName,
      parentNode: containerRef.current,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: `${account.first_name} ${account.last_name}`,
        email: account.email,
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'desktop', 'chat',
          'raisehand', 'tileview', 'hangup',
        ],
        SHOW_JITSI_WATERMARK: false,
      },
    };

    try {
      const api = new window.JitsiMeetExternalAPI(domain, options);
      return () => api.dispose();
    } catch {
      // Jitsi API not available in dev mode
    }
  }, [roomName, account]);

  return (
    <PageTransition>
      <div className={styles.page}>
        <div className={styles.header}>
          <Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} strokeWidth={1.5} />}>
            Leave Call
          </Button>
          <span className={styles.roomName}>{roomName}</span>
        </div>
        <div ref={containerRef} className={styles.container}>
          <div className={styles.placeholder}>
            <p>Video call will load here when Jitsi is available.</p>
            <p style={{ fontSize: 'var(--text-label-md)', color: 'var(--color-text-muted)' }}>Room: {roomName}</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
