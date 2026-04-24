import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/Skeleton';
import { chatService } from '@/services/chatService';
import { formatRelative } from '@/utils/formatters';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { ChatRoom } from '@/types/chat';
import styles from './ChatList.module.css';

export default function ChatList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chatService.listRooms().then((res) => setRooms(res.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageTransition><div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} width="100%" height={72} borderRadius="var(--radius-sm)" />)}</div></PageTransition>;

  return (
    <PageTransition>
      <div>
        {rooms.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No conversations yet" description="Start a conversation by contacting a tutor from their profile." />
        ) : (
          <motion.div className={styles.list} variants={staggerContainer} initial="initial" animate="animate">
            {rooms.map((room) => {
              const other = room.members[0];
              return (
                <motion.div key={room.room_id} variants={staggerItem}>
                  <Link to={`/chat/${room.room_id}`} className={styles.item}>
                    <Avatar src={room.avatar_url ?? other?.avatar_url ?? null} firstName={room.name.split(' ')[0] ?? '?'} lastName={room.name.split(' ')[1] ?? ''} size="md" />
                    <div className={styles.info}>
                      <div className={styles.top}>
                        <span className={styles.name}>{room.name}</span>
                        {room.last_message_at && <span className={styles.time}>{formatRelative(room.last_message_at)}</span>}
                      </div>
                      <div className={styles.bottom}>
                        <span className={styles.lastMsg}>{room.last_message ?? 'No messages yet'}</span>
                        {room.unread_count > 0 && <Badge variant="info">{room.unread_count}</Badge>}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
