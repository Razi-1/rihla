import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, MapPin, Users, Video } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { sessionService } from '../../services/sessionService';
import { SessionResponse } from '../../types/session';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import { formatDate, formatTimeRange, formatDuration } from '../../utils/formatters';
import { SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

export function ClassDetailScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionService.getById(sessionId)
      .then((res) => setSession(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.pad}><SkeletonCard /><SkeletonCard /></View></SafeAreaView>;
  if (!session) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadow.md]}>
          <Text style={styles.title}>{session.title}</Text>
          <Text style={styles.tutor}>by {session.tutor_name}</Text>
          <View style={styles.badges}>
            <Badge text={SESSION_TYPE_LABELS[session.session_type] || session.session_type} />
            <Badge text={MODE_LABELS[session.mode] || session.mode} variant="neutral" />
            <Badge text={session.status} variant={session.status === 'active' ? 'success' : 'neutral'} />
          </View>
        </View>

        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Clock size={18} color={colors.primary.blue} strokeWidth={1.5} />
            <View>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>{formatDate(session.start_time)}</Text>
              <Text style={styles.detailSub}>{formatTimeRange(session.start_time, session.end_time)} ({formatDuration(session.duration_minutes)})</Text>
            </View>
          </View>

          {session.location_city && (
            <View style={styles.detailRow}>
              <MapPin size={18} color={colors.primary.blue} strokeWidth={1.5} />
              <View>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{[session.location_city, session.location_region, session.location_country].filter(Boolean).join(', ')}</Text>
                {session.location_address && <Text style={styles.detailSub}>{session.location_address}</Text>}
              </View>
            </View>
          )}

          {session.max_group_size && (
            <View style={styles.detailRow}>
              <Users size={18} color={colors.primary.blue} strokeWidth={1.5} />
              <View>
                <Text style={styles.detailLabel}>Enrollment</Text>
                <Text style={styles.detailValue}>{session.enrolled_count} / {session.max_group_size} students</Text>
              </View>
            </View>
          )}
        </View>

        {session.mode !== 'physical' && session.jitsi_room_name && (
          <Button title="Join Video Call" onPress={() => navigation.navigate('VideoCall', { roomName: session.jitsi_room_name, displayName: 'Student' })} fullWidth size="lg" icon={<Video size={20} color={colors.white} strokeWidth={1.5} />} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  back: { padding: spacing[5] },
  pad: { padding: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[5], marginBottom: spacing[5] },
  title: { ...typography.h2, color: colors.text.heading },
  tutor: { ...typography.bodyMd, color: colors.text.muted, marginTop: spacing[1] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
  detailSection: { gap: spacing[5], marginBottom: spacing[6] },
  detailRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  detailLabel: { ...typography.labelSm, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { ...typography.bodyMd, color: colors.text.heading, marginTop: 2 },
  detailSub: { ...typography.bodySm, color: colors.text.muted, marginTop: 2 },
});
