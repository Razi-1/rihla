import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock, MapPin, AlertTriangle } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing, shadow } from '../../theme/spacing';
import { InviteResponse } from '../../types/invite';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatDate, formatDuration } from '../../utils/formatters';
import { SESSION_TYPE_LABELS, MODE_LABELS } from '../../utils/constants';

interface InviteCardProps {
  invite: InviteResponse;
  onAccept: () => void;
  onDecline: () => void;
  onPress: () => void;
}

export function InviteCard({ invite, onAccept, onDecline, onPress }: InviteCardProps) {
  const hasConflict = invite.conflict_details && Object.keys(invite.conflict_details).length > 0;

  return (
    <View style={[styles.card, shadow.sm]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{invite.session_title}</Text>
          <Text style={styles.tutor}>by {invite.tutor_name}</Text>
        </View>
        <Badge text={SESSION_TYPE_LABELS[invite.session_type || ''] || ''} />
      </View>

      <View style={styles.details}>
        {invite.start_time && (
          <View style={styles.row}>
            <Clock size={16} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.detail}>
              {formatDate(invite.start_time)} - {formatDuration(invite.duration_minutes || 60)}
            </Text>
          </View>
        )}
        {invite.location_city && (
          <View style={styles.row}>
            <MapPin size={16} color={colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.detail}>{invite.location_city}</Text>
          </View>
        )}
        {invite.session_mode && (
          <Badge text={MODE_LABELS[invite.session_mode] || invite.session_mode} variant="neutral" />
        )}
      </View>

      {hasConflict && (
        <View style={styles.conflictBanner}>
          <AlertTriangle size={16} color={colors.semantic.warning} strokeWidth={1.5} />
          <Text style={styles.conflictText}>Schedule conflict detected</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Decline" onPress={onDecline} variant="ghost" size="sm" />
        <Button title="Accept" onPress={onAccept} variant="primary" size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[3] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerText: { flex: 1, marginRight: spacing[2] },
  title: { ...typography.titleSm, color: colors.text.heading },
  tutor: { ...typography.bodySm, color: colors.text.muted, marginTop: 2 },
  details: { marginTop: spacing[3], gap: spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detail: { ...typography.bodySm, color: colors.text.body },
  conflictBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.semantic.warningLight, borderRadius: radius.sm, padding: spacing[3], marginTop: spacing[3] },
  conflictText: { ...typography.bodySm, color: colors.semantic.warning },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing[2], marginTop: spacing[4] },
});
