import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Bell, Users, LogOut } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { parentService } from '../../services/parentService';
import { Avatar } from '../../components/common/Avatar';
import { Badge, CountBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export function ParentProfileScreen({ navigation }: any) {
  const { firstName, lastName, profilePictureUrl } = useAuthStore();
  const { logout } = useAuth();
  const [childrenCount, setChildrenCount] = useState(0);

  useEffect(() => {
    parentService.getChildren()
      .then((res) => setChildrenCount(res.data.data.length))
      .catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, shadow.md]}>
          <Avatar imageUrl={profilePictureUrl} firstName={firstName || ''} lastName={lastName || ''} size="xl" />
          <Text style={styles.name}>{firstName} {lastName}</Text>
          <Badge text="Parent Account" />
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChildrenTab', { screen: 'ChildrenList' })}>
            <Users size={22} color={colors.text.body} strokeWidth={1.5} />
            <Text style={styles.menuLabel}>My Children</Text>
            {childrenCount > 0 && <CountBadge count={childrenCount} />}
          </TouchableOpacity>
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
  menu: { gap: spacing[1], marginBottom: spacing[8] },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[4], paddingHorizontal: spacing[4], backgroundColor: colors.surface.card, borderRadius: radius.md, marginBottom: spacing[2] },
  menuLabel: { ...typography.bodyMd, color: colors.text.heading, flex: 1 },
});
