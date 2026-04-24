import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { accountService } from '../../services/accountService';
import { SettingsResponse } from '../../types/account';
import { SkeletonCard } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';

export function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountService.getSettings()
      .then((res) => setSettings(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: keyof SettingsResponse, value: boolean) => {
    if (!settings) return;
    const prev = settings[key];
    setSettings({ ...settings, [key]: value });
    try {
      await accountService.updateSettings({ [key]: value });
    } catch {
      setSettings({ ...settings, [key]: prev });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? Your account will be scheduled for deletion. This action can be cancelled within 30 days.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await accountService.requestDeletion();
              Alert.alert('Account Deletion', 'Your account has been scheduled for deletion.');
            } catch {
              Alert.alert('Error', 'Failed to request account deletion.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing[5] }}><SkeletonCard /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.card, shadow.sm]}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Email Notifications</Text>
            <Switch
              value={settings?.email_notifications ?? false}
              onValueChange={(v) => updateSetting('email_notifications', v)}
              trackColor={{ false: colors.surface.high, true: colors.primary.blue }}
              thumbColor={colors.white}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={settings?.push_notifications ?? false}
              onValueChange={(v) => updateSetting('push_notifications', v)}
              trackColor={{ false: colors.surface.high, true: colors.primary.blue }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={[styles.card, shadow.sm]}>
          <Text style={styles.settingLabel}>Timezone</Text>
          <Text style={styles.settingValue}>{settings?.timezone || 'Not set'}</Text>
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            fullWidth
            icon={<Trash2 size={20} color={colors.white} strokeWidth={1.5} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] },
  back: { padding: spacing[2] },
  headerTitle: { ...typography.titleMd, color: colors.text.heading },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginTop: spacing[5], marginBottom: spacing[3] },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[5], gap: spacing[4] },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { ...typography.bodyMd, color: colors.text.heading },
  settingValue: { ...typography.bodySm, color: colors.text.muted, marginTop: spacing[1] },
  dangerZone: { marginTop: spacing[8], gap: spacing[3] },
  dangerTitle: { ...typography.titleMd, color: colors.semantic.error },
});
