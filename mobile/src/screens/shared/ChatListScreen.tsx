import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, MessageSquare } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { chatService } from '../../services/chatService';
import { RoomResponse } from '../../types/chat';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { createRefreshControl } from '../../components/common/PullToRefresh';
import { useAuthStore } from '../../store/authStore';

export function ChatListScreen({ navigation }: any) {
  const { accountType } = useAuthStore();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await chatService.getRooms();
      setRooms(res.data.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRooms();
  }, [fetchRooms]);

  const hasAI = accountType === 'student' || accountType === 'tutor';

  const renderRoom = ({ item }: { item: RoomResponse }) => {
    const displayName = item.room_type === 'dm'
      ? item.other_user_name || 'Chat'
      : item.session_title || 'Group';

    return (
      <TouchableOpacity
        style={styles.roomItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatConversation', {
          roomId: item.matrix_room_id,
          roomName: displayName,
        })}
      >
        <Avatar imageUrl={null} firstName={displayName} lastName="" size="md" />
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.roomType}>{item.room_type === 'dm' ? 'Direct Message' : 'Class Chat'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {hasAI && (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIAssistant')}
          >
            <Sparkles size={20} color={colors.primary.blue} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        contentContainerStyle={rooms.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={createRefreshControl({ refreshing, onRefresh })}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon={<MessageSquare size={48} color={colors.text.muted} strokeWidth={1.5} />}
              title="No conversations yet"
              description="Start a conversation from a tutor's profile or class."
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  title: { ...typography.h2, color: colors.text.heading },
  aiButton: { padding: spacing[2], backgroundColor: colors.primary.light, borderRadius: radius.full },
  list: { paddingHorizontal: spacing[5] },
  emptyContainer: { flex: 1 },
  roomItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[2] },
  roomInfo: { flex: 1 },
  roomName: { ...typography.labelMd, color: colors.text.heading },
  roomType: { ...typography.bodySm, color: colors.text.muted },
});
