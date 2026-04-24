import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, ShieldX } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { parentService } from '../../services/parentService';
import { TutorPermission } from '../../types/parent';

interface PermissionToggleProps {
  permission: TutorPermission;
  onUpdate?: (id: string, status: 'granted' | 'denied') => void;
}

export function PermissionToggle({ permission, onUpdate }: PermissionToggleProps) {
  const [status, setStatus] = useState(permission.status);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (newStatus: 'granted' | 'denied') => {
    if (loading || newStatus === status) return;
    setLoading(true);
    try {
      await parentService.updatePermission(permission.id, { status: newStatus });
      setStatus(newStatus);
      onUpdate?.(permission.id, newStatus);
    } catch {} finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name}>{permission.tutor_name}</Text>
        <Text style={[styles.status, status === 'granted' ? styles.granted : styles.denied]}>
          {status === 'granted' ? 'Approved' : status === 'denied' ? 'Denied' : 'Pending'}
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary.blue} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => handleToggle('granted')}
            style={[styles.btn, status === 'granted' && styles.btnActive]}
          >
            <ShieldCheck size={20} color={status === 'granted' ? colors.semantic.success : colors.text.muted} strokeWidth={1.5} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleToggle('denied')}
            style={[styles.btn, status === 'denied' && styles.btnDenied]}
          >
            <ShieldX size={20} color={status === 'denied' ? colors.semantic.error : colors.text.muted} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[2] },
  info: { flex: 1, gap: spacing[1] },
  name: { ...typography.labelMd, color: colors.text.heading },
  status: { ...typography.bodySm },
  granted: { color: colors.semantic.success },
  denied: { color: colors.semantic.error },
  actions: { flexDirection: 'row', gap: spacing[2] },
  btn: { padding: spacing[2], borderRadius: radius.sm, backgroundColor: colors.surface.high },
  btnActive: { backgroundColor: 'rgba(18, 183, 106, 0.12)' },
  btnDenied: { backgroundColor: 'rgba(240, 68, 56, 0.12)' },
});
