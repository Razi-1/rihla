import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types/chat';
import { sendMessage as matrixSendMessage, onRoomMessage, getMatrixClient } from '../lib/matrix';

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const client = getMatrixClient();
    if (!client) return;

    const room = client.getRoom(roomId);
    if (room) {
      const timeline = room.getLiveTimeline().getEvents();
      const existing: ChatMessage[] = timeline
        .filter((e) => e.getType() === 'm.room.message')
        .map((e) => ({
          id: e.getId() || '',
          sender_id: e.getSender() || '',
          sender_name: room.getMember(e.getSender() || '')?.name || e.getSender() || '',
          body: e.getContent().body || '',
          timestamp: e.getTs(),
          type: 'text' as const,
        }));
      setMessages(existing);
    }

    unsubRef.current = onRoomMessage((event, eventRoom) => {
      if (eventRoom?.roomId !== roomId) return;
      const newMsg: ChatMessage = {
        id: event.getId() || '',
        sender_id: event.getSender() || '',
        sender_name: eventRoom?.getMember(event.getSender() || '')?.name || event.getSender() || '',
        body: event.getContent().body || '',
        timestamp: event.getTs(),
        type: 'text',
      };
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      unsubRef.current?.();
    };
  }, [roomId]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!roomId) return;
      setIsLoading(true);
      try {
        await matrixSendMessage(roomId, text);
      } finally {
        setIsLoading(false);
      }
    },
    [roomId],
  );

  return { messages, sendMessage, isLoading };
}
