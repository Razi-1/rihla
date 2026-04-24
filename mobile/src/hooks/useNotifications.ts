import { useCallback, useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/notificationService';
import {
  registerForPushNotifications,
  sendPushTokenToServer,
  addNotificationReceivedListener,
} from '../lib/notifications';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead: storeMarkAllRead,
    setLoading,
  } = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setLoading]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      markAsRead(id);
      try {
        await notificationService.markAsRead(id);
      } catch {
        // revert on failure handled by next fetch
      }
    },
    [markAsRead],
  );

  const handleMarkAllAsRead = useCallback(async () => {
    storeMarkAllRead();
    try {
      await notificationService.markAllAsRead();
    } catch {
      // revert on failure handled by next fetch
    }
  }, [storeMarkAllRead]);

  const setupPush = useCallback(async () => {
    const token = await registerForPushNotifications();
    if (token) {
      await sendPushTokenToServer(token);
    }
  }, []);

  useEffect(() => {
    const sub = addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as any;
      if (data) {
        addNotification({
          id: notification.request.identifier,
          title: notification.request.content.title || '',
          body: notification.request.content.body || null,
          notification_type: data.type || 'general',
          related_entity_id: data.entity_id || null,
          related_entity_type: data.entity_type || null,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      }
    });

    return () => sub.remove();
  }, [addNotification]);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    setupPush,
  };
}
