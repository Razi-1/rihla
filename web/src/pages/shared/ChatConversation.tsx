import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Paperclip } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import { useAuthStore } from '@/store/authStore';
import { staggerItem } from '@/hooks/useAnimations';
import type { ChatMessage } from '@/types/chat';
import styles from './ChatConversation.module.css';

export default function ChatConversation() {
  const { roomId } = useParams<{ roomId: string }>();
  const account = useAuthStore((s) => s.account);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Matrix SDK would be initialized here for real-time messages
    // For now, show empty state
    setMessages([]);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !account) return;
    const msg: ChatMessage = {
      event_id: Date.now().toString(),
      room_id: roomId ?? '',
      sender_id: account.id,
      sender_name: `${account.first_name} ${account.last_name}`,
      body: input,
      timestamp: Date.now(),
      type: 'text',
    };
    setMessages([...messages, msg]);
    setInput('');
  };

  return (
    <PageTransition>
      <div className={styles.page}>
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
      </div>
    </PageTransition>
  );
}
