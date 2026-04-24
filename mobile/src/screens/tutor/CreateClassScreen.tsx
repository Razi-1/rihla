import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { sessionService } from '../../services/sessionService';
import { SessionCreateRequest } from '../../types/session';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';
import { DURATIONS, SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

type SessionType = 'booking_meeting' | 'individual_class' | 'group_class';
type Mode = 'online' | 'physical' | 'hybrid';

export function CreateClassScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('individual_class');
  const [mode, setMode] = useState<Mode>('online');
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [maxGroupSize, setMaxGroupSize] = useState('');
  const [locationCity, setLocationCity] = useState('');

  const handleCreate = async () => {
    if (!title.trim() || !startTime) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const data: SessionCreateRequest = {
        title: title.trim(),
        session_type: sessionType,
        mode,
        duration_minutes: duration,
        start_time: startTime,
        max_group_size: sessionType === 'group_class' ? parseInt(maxGroupSize) || undefined : undefined,
        location_city: mode !== 'online' ? locationCity : undefined,
      };
      await sessionService.create(data);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Class</Text>

        <Input label="Class Title" value={title} onChangeText={setTitle} placeholder="e.g., O-Level Mathematics" />

        <Text style={styles.label}>Session Type</Text>
        <View style={styles.chips}>
          {(['booking_meeting', 'individual_class', 'group_class'] as SessionType[]).map((t) => (
            <Chip key={t} label={SESSION_TYPE_LABELS[t] ?? t} selected={sessionType === t} onPress={() => setSessionType(t)} />
          ))}
        </View>

        <Text style={styles.label}>Mode</Text>
        <View style={styles.chips}>
          {(['online', 'physical', 'hybrid'] as Mode[]).map((m) => (
            <Chip key={m} label={MODE_LABELS[m] ?? m} selected={mode === m} onPress={() => setMode(m)} />
          ))}
        </View>

        <Text style={styles.label}>Duration</Text>
        <View style={styles.chips}>
          {DURATIONS.map((d) => (
            <Chip key={d} label={`${d} min`} selected={duration === d} onPress={() => setDuration(d)} />
          ))}
        </View>

        <Input label="Start Time (ISO 8601)" value={startTime} onChangeText={setStartTime} placeholder="2026-01-15T10:00:00Z" />

        {sessionType === 'group_class' && (
          <Input label="Max Group Size" value={maxGroupSize} onChangeText={setMaxGroupSize} keyboardType="numeric" placeholder="e.g., 10" />
        )}

        {mode !== 'online' && (
          <Input label="City" value={locationCity} onChangeText={setLocationCity} placeholder="e.g., Colombo" />
        )}

        <Button title="Create Class" onPress={handleCreate} loading={loading} fullWidth size="lg" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  back: { padding: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  title: { ...typography.h1, color: colors.text.heading, marginBottom: spacing[6] },
  label: { ...typography.labelMd, color: colors.text.heading, marginBottom: spacing[2], marginTop: spacing[4] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[2] },
});
