import React, { useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import { ChatMessage } from '../../types/chat';

export function ChatConversationScreen({ route, navigation }: any) {
  const { roomId, roomName } = route.params;
  const { messages, sendMessage, isLoading } = useChat(roomId);
  const { accountId } = useAuthStore();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setText('');
    await sendMessage(trimmed);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender_id.includes(accountId || '');
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
        <Text style={[styles.messageText, isMe && styles.myMessageText]}>{item.body}</Text>
        <Text style={[styles.timestamp, isMe && styles.myTimestamp]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{roomName}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, (!text.trim() || isLoading) && styles.sendDisabled]}
            disabled={!text.trim() || isLoading}
          >
            <Send size={20} color={text.trim() ? colors.white : colors.text.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3], backgroundColor: colors.surface.card },
  back: { padding: spacing[2] },
  headerTitle: { ...typography.titleMd, color: colors.text.heading, flex: 1 },
  messageList: { padding: spacing[5], paddingBottom: spacing[3] },
  messageBubble: { maxWidth: '78%', padding: spacing[3], borderRadius: radius.md, marginBottom: spacing[2] },
  myMessage: { alignSelf: 'flex-end', backgroundColor: colors.primary.blue, borderBottomRightRadius: 4 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: colors.surface.card, borderBottomLeftRadius: 4 },
  senderName: { ...typography.labelSm, color: colors.primary.accent, marginBottom: 2 },
  messageText: { ...typography.bodyMd, color: colors.text.body },
  myMessageText: { color: colors.white },
  timestamp: { ...typography.labelSm, color: colors.text.muted, alignSelf: 'flex-end', marginTop: 2, fontSize: 10 },
  myTimestamp: { color: 'rgba(255,255,255,0.7)' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: colors.surface.card, gap: spacing[2] },
  input: { flex: 1, ...typography.bodyMd, color: colors.text.body, backgroundColor: colors.surface.low, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary.blue, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: colors.surface.high },
});
