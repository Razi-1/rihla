import React, { useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Sparkles } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { aiService } from '../../services/aiService';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistantScreen({ navigation }: any) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setText('');
    setLoading(true);

    try {
      const res = await aiService.sendMessage({ message: trimmed });
      const aiMsg: AIMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.data.data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: AIMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, I could not process your request. Please try again.' };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: AIMessage; index: number }) => {
    const isUser = item.role === 'user';
    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 250, delay: 50 }}
      >
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && (
            <View style={styles.aiLabel}>
              <Sparkles size={14} color={colors.primary.blue} strokeWidth={1.5} />
              <Text style={styles.aiLabelText}>Rihla AI</Text>
            </View>
          )}
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
        </View>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Sparkles size={22} color={colors.primary.blue} strokeWidth={1.5} />
        <Text style={styles.headerTitle}>AI Assistant</Text>
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
          contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.welcomeContainer}>
              <Sparkles size={48} color={colors.primary.blue} strokeWidth={1.5} />
              <Text style={styles.welcomeTitle}>Rihla AI Assistant</Text>
              <Text style={styles.welcomeDesc}>Ask me anything about your studies, schedule, or finding the right tutor.</Text>
            </View>
          }
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={colors.primary.blue} />
            <Text style={styles.typingText}>AI is thinking...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Ask anything..."
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, (!text.trim() || loading) && styles.sendDisabled]}
            disabled={!text.trim() || loading}
          >
            <Send size={20} color={text.trim() && !loading ? colors.white : colors.text.muted} strokeWidth={1.5} />
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
  headerTitle: { ...typography.titleMd, color: colors.text.heading },
  messageList: { padding: spacing[5], paddingBottom: spacing[3] },
  emptyContainer: { flex: 1 },
  bubble: { maxWidth: '82%', padding: spacing[4], borderRadius: radius.md, marginBottom: spacing[3] },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary.blue, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface.card, borderBottomLeftRadius: 4 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing[1], marginBottom: spacing[1] },
  aiLabelText: { ...typography.labelSm, color: colors.primary.blue },
  bubbleText: { ...typography.bodyMd, color: colors.text.body, lineHeight: 22 },
  userBubbleText: { color: colors.white },
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[8], gap: spacing[3] },
  welcomeTitle: { ...typography.h2, color: colors.text.heading },
  welcomeDesc: { ...typography.bodyMd, color: colors.text.muted, textAlign: 'center', lineHeight: 22 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
  typingText: { ...typography.bodySm, color: colors.text.muted },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: colors.surface.card, gap: spacing[2] },
  input: { flex: 1, ...typography.bodyMd, color: colors.text.body, backgroundColor: colors.surface.low, borderRadius: radius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary.blue, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { backgroundColor: colors.surface.high },
});
