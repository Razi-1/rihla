import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, MessageSquare, ChevronRight } from 'lucide-react-native';
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

  const aiHeader = hasAI ? (
    <TouchableOpacity
      style={styles.aiCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('AIAssistant')}
    >
      <View style={styles.aiIconWrap}>
        <Sparkles size={22} color="#fff" strokeWidth={1.5} />
      </View>
      <View style={styles.aiCardInfo}>
        <Text style={styles.aiCardTitle}>AI Assistant</Text>
        <Text style={styles.aiCardSub}>Ask questions, get study help, find tutors</Text>
      </View>
      <ChevronRight size={20} color={colors.text.muted} strokeWidth={1.5} />
    </TouchableOpacity>
  ) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoom}
        ListHeaderComponent={aiHeader}
        contentContainerStyle={rooms.length === 0 && !hasAI ? styles.emptyContainer : styles.list}
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
  list: { paddingHorizontal: spacing[5] },
  emptyContainer: { flex: 1, paddingHorizontal: spacing[5] },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    marginBottom: spacing[4],
    shadowColor: '#191C20',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 30,
    elevation: 3,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardInfo: { flex: 1 },
  aiCardTitle: { ...typography.labelMd, color: colors.text.heading },
  aiCardSub: { ...typography.bodySm, color: colors.text.muted, marginTop: 2 },
  roomItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3], backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[2] },
  roomInfo: { flex: 1 },
  roomName: { ...typography.labelMd, color: colors.text.heading },
  roomType: { ...typography.bodySm, color: colors.text.muted },
});
