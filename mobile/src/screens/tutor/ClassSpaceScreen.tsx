import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, QrCode, Users, Video, Trash2 } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { sessionService } from '../../services/sessionService';
import { attendanceService } from '../../services/attendanceService';
import { SessionResponse } from '../../types/session';
import { AttendanceResponse } from '../../types/attendance';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { SkeletonCard } from '../../components/common/Skeleton';
import { formatDate, formatTimeRange, formatDuration } from '../../utils/formatters';
import { SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

export function ClassSpaceScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'attendance'>('details');

  useEffect(() => {
    (async () => {
      try {
        const [sessionRes, attendanceRes] = await Promise.all([
          sessionService.getById(sessionId),
          attendanceService.getForSession(sessionId),
        ]);
        setSession(sessionRes.data.data);
        setAttendance(attendanceRes.data.data);
      } catch {} finally { setLoading(false); }
    })();
  }, [sessionId]);

  if (loading) return <SafeAreaView style={styles.safe}><View style={{ padding: spacing[5] }}><SkeletonCard /><SkeletonCard /></View></SafeAreaView>;
  if (!session) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{session.title}</Text>
      </View>

      <View style={styles.tabs}>
        {(['details', 'attendance'] as const).map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'details' ? 'Details' : 'Attendance'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'details' ? (
          <>
            <View style={[styles.card, shadow.sm]}>
              <View style={styles.badges}>
                <Badge text={SESSION_TYPE_LABELS[session.session_type] ?? session.session_type} />
                <Badge text={MODE_LABELS[session.mode] ?? session.mode} variant="neutral" />
                <Badge text={session.status} variant={session.status === 'active' ? 'success' : 'neutral'} />
              </View>
              <Text style={styles.detailText}>{formatDate(session.start_time)}</Text>
              <Text style={styles.detailText}>{formatTimeRange(session.start_time, session.end_time)} ({formatDuration(session.duration_minutes)})</Text>
              {session.enrolled_count > 0 && <Text style={styles.detailText}>{session.enrolled_count} student{session.enrolled_count !== 1 ? 's' : ''} enrolled</Text>}
            </View>

            <View style={styles.actions}>
              <Button title="Show QR Code" onPress={() => navigation.navigate('QRDisplay', { sessionId })} fullWidth icon={<QrCode size={20} color={colors.white} strokeWidth={1.5} />} />
              {session.mode !== 'physical' && session.jitsi_room_name && (
                <Button title="Start Video" onPress={() => {}} variant="secondary" fullWidth icon={<Video size={20} color={colors.text.heading} strokeWidth={1.5} />} />
              )}
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Attendance ({attendance.length})</Text>
            {attendance.map((record) => (
              <View key={record.id} style={[styles.attendanceRow, shadow.sm]}>
                <Avatar imageUrl={null} firstName={record.student_name || 'S'} lastName="" size="sm" />
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceName}>{record.student_name || 'Student'}</Text>
                  <Text style={styles.attendanceMeta}>{record.method === 'qr_scan' ? 'QR Scan' : 'Jitsi'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] },
  back: { padding: spacing[2] },
  headerTitle: { ...typography.titleMd, color: colors.text.heading, flex: 1 },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[2], marginBottom: spacing[4] },
  tab: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: 999, backgroundColor: colors.surface.high },
  tabActive: { backgroundColor: colors.primary.blue },
  tabText: { ...typography.labelMd, color: colors.text.body },
  tabTextActive: { color: colors.white },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[5], gap: spacing[3], marginBottom: spacing[5] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  detailText: { ...typography.bodyMd, color: colors.text.body },
  actions: { gap: spacing[3] },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[4] },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[2] },
  attendanceInfo: { flex: 1 },
  attendanceName: { ...typography.labelMd, color: colors.text.heading },
  attendanceMeta: { ...typography.bodySm, color: colors.text.muted },
});
