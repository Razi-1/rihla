import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, Settings, Bell, LogOut } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { tutorService } from '../../services/tutorService';
import { TutorProfileResponse } from '../../types/tutor';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Chip } from '../../components/common/Chip';

export function EditProfileScreen({ navigation }: any) {
  const { firstName, lastName, profilePictureUrl } = useAuthStore();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<TutorProfileResponse | null>(null);

  useEffect(() => {
    tutorService.getProfilePreview()
      .then((res) => setProfile(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, shadow.md]}>
          <Avatar imageUrl={profilePictureUrl} firstName={firstName || ''} lastName={lastName || ''} size="xl" />
          <Text style={styles.name}>{firstName} {lastName}</Text>
          {profile?.is_profile_complete ? (
            <Badge text="Profile Complete" variant="success" />
          ) : (
            <Badge text="Profile Incomplete" variant="warning" />
          )}
        </View>

        {profile && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Subjects</Text>
            <View style={styles.chips}>
              {profile.subjects.map((s) => (
                <Chip key={s.id} label={`${s.subject_name} - ${s.education_level_name}`} />
              ))}
              {profile.subjects.length === 0 && <Text style={styles.empty}>No subjects added yet</Text>}
            </View>
          </View>
        )}

        <Button title="Preview Profile" onPress={() => navigation.navigate('ProfilePreview')} variant="secondary" fullWidth icon={<Eye size={20} color={colors.text.heading} strokeWidth={1.5} />} />

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
            <Settings size={22} color={colors.text.body} strokeWidth={1.5} />
            <Text style={styles.menuLabel}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={22} color={colors.text.body} strokeWidth={1.5} />
            <Text style={styles.menuLabel}>Notifications</Text>
          </TouchableOpacity>
        </View>

        <Button title="Sign Out" onPress={logout} variant="danger" fullWidth size="lg" icon={<LogOut size={20} color={colors.white} strokeWidth={1.5} />} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  content: { padding: spacing[5], paddingBottom: spacing[10] },
  profileCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[6], alignItems: 'center', gap: spacing[3], marginBottom: spacing[6] },
  name: { ...typography.h2, color: colors.text.heading },
  section: { marginBottom: spacing[5] },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  empty: { ...typography.bodyMd, color: colors.text.muted },
  menu: { gap: spacing[1], marginTop: spacing[5], marginBottom: spacing[6] },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[4], paddingHorizontal: spacing[4], backgroundColor: colors.surface.card, borderRadius: radius.md, marginBottom: spacing[2] },
  menuLabel: { ...typography.bodyMd, color: colors.text.heading, flex: 1 },
});
