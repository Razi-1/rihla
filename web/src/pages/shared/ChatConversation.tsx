import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Paperclip, Video, X, AlertTriangle } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chatService';
import { tutorService } from '@/services/tutorService';
import { sessionService } from '@/services/sessionService';
import { DAY_NAMES } from '@/utils/formatters';
import { SESSION_DURATIONS } from '@/utils/constants';
import { staggerItem } from '@/hooks/useAnimations';
import type { ChatMessage, ChatRoom } from '@/types/chat';
import type { TutorProfile } from '@/types/tutor';
import styles from './ChatConversation.module.css';

export default function ChatConversation() {
  const { roomId } = useParams<{ roomId: string }>();
  const account = useAuthStore((s) => s.account);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [roomInfo, setRoomInfo] = useState<ChatRoom | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0] ?? '',
    time: '10:00',
    duration: 60,
    title: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);
  const [outsideHours, setOutsideHours] = useState(false);
  const [bookedSession, setBookedSession] = useState<{ id: string; jitsi_room_name: string | null; title: string } | null>(null);

  useEffect(() => {
    if (!roomId) return;
    chatService.getMessages(roomId)
      .then((res) => {
        const data = res.data.data;
        setMessages(Array.isArray(data) ? data : []);
      })
      .catch((err) => { console.error('[ChatConversation] Failed to load messages:', err); setMessages([]); });

    chatService.listRooms()
      .then((res) => {
        const room = res.data.data.find((r) => r.room_id === roomId);
        if (room) setRoomInfo(room);
      })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const otherMember = roomInfo?.members[0];
  const isTutorChat = account?.account_type === 'student' && otherMember?.account_type === 'tutor';

  const handleSend = async () => {
    if (!input.trim() || !account || !roomId || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);
    try {
      const res = await chatService.sendMessage(roomId, body);
      const msg = res.data.data;
      setMessages((prev) => [...prev, msg]);
    } catch {
      setInput(body);
    }
    setSending(false);
  };

  const openBooking = async () => {
    if (!otherMember) return;
    setShowBooking(true);
    setBookingMsg(null);
    setOutsideHours(false);
    try {
      const res = await tutorService.getPublic(otherMember.account_id);
      setTutorProfile(res.data.data);
    } catch { /* ignore */ }
  };

  const checkWorkingHours = (date: string, time: string) => {
    if (!tutorProfile?.working_hours?.length) {
      setOutsideHours(false);
      return;
    }
    const jsDay = new Date(`${date}T${time}`).getDay();
    const backendDay = jsDay === 0 ? 6 : jsDay - 1;
    const wh = tutorProfile.working_hours.find((h) => h.day_of_week === backendDay && h.is_working);
    if (!wh) {
      setOutsideHours(true);
      return;
    }
    setOutsideHours(time < wh.start_time || time >= wh.end_time);
  };

  const handleBookingSubmit = async () => {
    if (!otherMember) return;
    setBookingLoading(true);
    setBookingMsg(null);
    try {
      const startTime = `${bookingForm.date}T${bookingForm.time}:00`;
      const res = await sessionService.bookMeeting({
        tutor_id: otherMember.account_id,
        start_time: startTime,
        duration_minutes: bookingForm.duration,
        title: bookingForm.title || undefined,
      });
      const session = res.data.data;
      setBookedSession({
        id: session.id,
        jitsi_room_name: session.jitsi_room_name,
        title: session.title,
      });
      setBookingMsg('Session booked successfully!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setBookingMsg(msg ?? 'Failed to book session');
    }
    setBookingLoading(false);
  };

  return (
    <PageTransition>
      <div className={styles.page}>
        {roomInfo && (
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <Avatar
                src={otherMember?.avatar_url ?? null}
                firstName={roomInfo.name.split(' ')[0] ?? '?'}
                lastName={roomInfo.name.split(' ')[1] ?? ''}
                size="sm"
              />
              <span className={styles.chatHeaderName}>{roomInfo.name}</span>
            </div>
            {isTutorChat && (
              <Button size="sm" variant="primary" icon={<Video size={14} strokeWidth={1.5} />} onClick={openBooking}>
                Book Session
              </Button>
            )}
          </div>
        )}

        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.empty}>
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isOwn = msg.sender_id === account?.id;
            return (
              <motion.div
                key={msg.event_id}
                className={`${styles.bubble} ${isOwn ? styles.own : styles.other}`}
                variants={staggerItem}
                initial="initial"
                animate="animate"
              >
                {!isOwn && <Avatar src={null} firstName={msg.sender_name.split(' ')[0] ?? '?'} lastName={msg.sender_name.split(' ')[1] ?? ''} size="sm" />}
                <div className={styles.bubbleContent}>
                  <p>{msg.body}</p>
                  <span className={styles.time}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputBar}>
          <button className={styles.attachBtn} aria-label="Attach file">
            <Paperclip size={18} strokeWidth={1.5} />
          </button>
          <input
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button className={styles.sendBtn} onClick={handleSend} aria-label="Send" disabled={!input.trim()}>
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>

        {showBooking && (
          <div className={styles.bookingOverlay} onClick={() => setShowBooking(false)}>
            <div className={styles.bookingModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.bookingHeader}>
                <h3>Book a Session</h3>
                <button onClick={() => setShowBooking(false)} className={styles.bookingClose}>
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>

              <div className={styles.bookingBody}>
                {tutorProfile?.working_hours && tutorProfile.working_hours.filter((h) => h.is_working).length > 0 && (
                  <div className={styles.workingHours}>
                    <h4>Tutor's Working Hours</h4>
                    {tutorProfile.working_hours
                      .filter((h) => h.is_working)
                      .map((wh) => (
                        <div key={wh.day_of_week} className={styles.hourRow}>
                          <span className={styles.dayName}>{DAY_NAMES[wh.day_of_week]}</span>
                          <span>{wh.start_time} — {wh.end_time}</span>
                        </div>
                      ))}
                  </div>
                )}

                <div className={styles.bookingField}>
                  <label>Title (optional)</label>
                  <input
                    type="text"
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    placeholder={`Meeting with ${roomInfo?.name ?? 'Tutor'}`}
                  />
                </div>

                <div className={styles.bookingField}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => {
                      setBookingForm({ ...bookingForm, date: e.target.value });
                      checkWorkingHours(e.target.value, bookingForm.time);
                    }}
                    min={new Date().toISOString().split('T')[0] ?? ''}
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                  <div className={styles.bookingField} style={{ flex: 1 }}>
                    <label>Time</label>
                    <input
                      type="time"
                      value={bookingForm.time}
                      onChange={(e) => {
                        setBookingForm({ ...bookingForm, time: e.target.value });
                        checkWorkingHours(bookingForm.date, e.target.value);
                      }}
                    />
                  </div>
                  <div className={styles.bookingField} style={{ flex: 1 }}>
                    <label>Duration</label>
                    <select
                      value={bookingForm.duration}
                      onChange={(e) => setBookingForm({ ...bookingForm, duration: Number(e.target.value) })}
                      className={styles.select}
                    >
                      {SESSION_DURATIONS.map((d) => (
                        <option key={d} value={d}>{d} min</option>
                      ))}
                    </select>
                  </div>
                </div>

                {outsideHours && (
                  <div className={styles.warning}>
                    <AlertTriangle size={16} strokeWidth={1.5} />
                    <span>This time is outside the tutor's working hours. You may still book, but confirmation may be delayed.</span>
                  </div>
                )}

                {bookingMsg && (
                  <p style={{
                    fontSize: 'var(--text-body-sm)',
                    color: bookingMsg.includes('successfully') ? 'var(--color-success)' : 'var(--color-error)',
                  }}>
                    {bookingMsg}
                  </p>
                )}
              </div>

              <div className={styles.bookingFooter}>
                {bookedSession ? (
                  <>
                    {bookedSession.jitsi_room_name && (
                      <Button
                        size="sm"
                        icon={<Video size={14} strokeWidth={1.5} />}
                        onClick={() => window.open(`/video/${bookedSession.jitsi_room_name}?session=${bookedSession.id}`, '_blank')}
                      >
                        Join Video Call
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => { setShowBooking(false); setBookedSession(null); }}>
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setShowBooking(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleBookingSubmit} loading={bookingLoading}>
                      Book Session
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
