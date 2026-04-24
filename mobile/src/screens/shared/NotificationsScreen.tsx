import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationResponse } from '../../types/notification';
import { EmptyState } from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../utils/formatters';

export function NotificationsScreen({ navigation }: any) {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const renderItem = ({ item, index }: { item: NotificationResponse; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateX: -10 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 250, delay: index * 40 }}
    >
      <TouchableOpacity
        style={[styles.notificationItem, !item.is_read && styles.unread]}
        activeOpacity={0.7}
        onPress={() => markAsRead(item.id)}
      >
        <View style={[styles.dot, item.is_read && styles.dotRead]} />
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {item.body && <Text style={styles.notificationBody} numberOfLines={2}>{item.body}</Text>}
          <Text style={styles.notificationTime}>{formatRelativeTime(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAll}>
            <CheckCheck size={20} color={colors.primary.blue} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={48} color={colors.text.muted} strokeWidth={1.5} />}
            title="No notifications"
            description="You're all caught up."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] },
  back: { padding: spacing[2] },
  headerTitle: { ...typography.titleMd, color: colors.text.heading, flex: 1 },
  markAll: { padding: spacing[2] },
  list: { paddingHorizontal: spacing[5] },
  emptyContainer: { flex: 1 },
  notificationItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], paddingVertical: spacing[4], paddingHorizontal: spacing[4], backgroundColor: colors.surface.card, borderRadius: radius.md, marginBottom: spacing[2] },
  unread: { backgroundColor: colors.primary.light },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary.blue, marginTop: 6 },
  dotRead: { backgroundColor: colors.surface.high },
  notificationContent: { flex: 1 },
  notificationTitle: { ...typography.labelMd, color: colors.text.heading, marginBottom: 2 },
  notificationBody: { ...typography.bodySm, color: colors.text.body, marginBottom: spacing[1] },
  notificationTime: { ...typography.labelSm, color: colors.text.muted },
});
