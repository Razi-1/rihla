import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Bot, Send } from 'lucide-react';
import PageTransition from '@/components/common/PageTransition';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import Skeleton from '@/components/common/Skeleton';
import { chatService } from '@/services/chatService';
import { formatRelative } from '@/utils/formatters';
import { staggerContainer, staggerItem } from '@/hooks/useAnimations';
import type { ChatRoom, AIAssistantMessage } from '@/types/chat';
import styles from './ChatList.module.css';

type Tab = 'conversations' | 'ai';

export default function ChatList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('conversations');

  const [aiMessages, setAiMessages] = useState<AIAssistantMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatService.listRooms()
      .then((res) => setRooms(res.data.data))
      .catch((err) => console.error('[ChatList] Failed to load rooms:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const handleAISend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg: AIAssistantMessage = { role: 'user', content: aiInput.trim() };
    const updated = [...aiMessages, userMsg];
    setAiMessages(updated);
    setAiInput('');
    setAiLoading(true);

    try {
      const res = await chatService.sendAIMessage(userMsg.content, aiMessages);
      const reply = res.data.data?.response ?? res.data?.data ?? 'No response';
      setAiMessages([...updated, { role: 'assistant', content: typeof reply === 'string' ? reply : JSON.stringify(reply) }]);
    } catch {
      setAiMessages([...updated, { role: 'assistant', content: 'Sorry, I could not process your request right now. Please try again later.' }]);
    }
    setAiLoading(false);
  };

  const tabStyle = (tab: Tab) => ({
    padding: '0.625rem 1.25rem',
    border: 'none',
    background: activeTab === tab
      ? 'linear-gradient(135deg, var(--color-primary-blue), var(--color-accent-blue))'
      : 'var(--color-surface-low)',
    color: activeTab === tab ? '#fff' : 'var(--color-text-body)',
    borderRadius: 'var(--radius-full)',
    cursor: 'pointer' as const,
    fontSize: 'var(--text-body-sm)',
    fontWeight: 500,
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '0.375rem',
    transition: 'all var(--transition-fast)',
  });

  if (loading) {
    return (
      <PageTransition>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={72} borderRadius="var(--radius-sm)" />
          ))}
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div>
        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <button style={tabStyle('conversations')} onClick={() => setActiveTab('conversations')}>
            <MessageCircle size={16} strokeWidth={1.5} /> Conversations
          </button>
          <button style={tabStyle('ai')} onClick={() => setActiveTab('ai')}>
            <Bot size={16} strokeWidth={1.5} /> AI Assistant
          </button>
        </div>

        {activeTab === 'conversations' && (
          <>
            {rooms.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No conversations yet"
                description="Start a conversation by contacting a tutor from their profile."
              />
            ) : (
              <motion.div className={styles.list} variants={staggerContainer} initial="initial" animate="animate">
                {rooms.map((room) => {
                  const other = room.members[0];
                  return (
                    <motion.div key={room.room_id} variants={staggerItem}>
                      <Link to={`/chat/${room.room_id}`} className={styles.item}>
                        <Avatar
                          src={room.avatar_url ?? other?.avatar_url ?? null}
                          firstName={room.name.split(' ')[0] ?? '?'}
                          lastName={room.name.split(' ')[1] ?? ''}
                          size="md"
                        />
                        <div className={styles.info}>
                          <div className={styles.top}>
                            <span className={styles.name}>{room.name}</span>
                            {room.last_message_at && (
                              <span className={styles.time}>{formatRelative(room.last_message_at)}</span>
                            )}
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
          </>
        )}

        {activeTab === 'ai' && (
          <div
            style={{
              background: 'var(--color-surface-card)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              height: 'min(600px, calc(100vh - 250px))',
            }}
          >
            {/* AI Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
              {aiMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  <Bot size={48} strokeWidth={1} style={{ marginBottom: 'var(--space-3)', opacity: 0.4 }} />
                  <p style={{ fontSize: 'var(--text-body-md)', marginBottom: 'var(--space-2)' }}>
                    Hi! I'm your AI study assistant.
                  </p>
                  <p style={{ fontSize: 'var(--text-body-sm)' }}>
                    Ask me anything about your studies, homework, or learning strategies.
                  </p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: msg.role === 'user'
                        ? 'linear-gradient(135deg, var(--color-primary-blue), var(--color-accent-blue))'
                        : 'var(--color-surface-low)',
                      color: msg.role === 'user' ? '#fff' : 'var(--color-text-body)',
                      fontSize: 'var(--text-body-sm)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div
                    style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-low)',
                      color: 'var(--color-text-muted)',
                      fontSize: 'var(--text-body-sm)',
                    }}
                  >
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={aiBottomRef} />
            </div>

            {/* AI Input */}
            <div
              style={{
                borderTop: '1px solid var(--color-surface-high)',
                padding: 'var(--space-3) var(--space-4)',
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'center',
              }}
            >
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAISend()}
                placeholder="Ask the AI assistant..."
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'var(--color-surface-low)',
                  fontSize: 'var(--text-body-sm)',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAISend}
                disabled={!aiInput.trim() || aiLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  background: aiInput.trim() && !aiLoading
                    ? 'linear-gradient(135deg, var(--color-primary-blue), var(--color-accent-blue))'
                    : 'var(--color-surface-high)',
                  color: aiInput.trim() && !aiLoading ? '#fff' : 'var(--color-text-muted)',
                  cursor: aiInput.trim() && !aiLoading ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-label="Send"
              >
                <Send size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
