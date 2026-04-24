import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';
import { studentService } from '../../services/studentService';
import { inviteService } from '../../services/inviteService';
import { InviteResponse } from '../../types/invite';
import { DashboardCards } from '../../components/student/DashboardCards';
import { InviteCard } from '../../components/student/InviteCard';
import { EmailVerificationBanner } from '../../components/auth/EmailVerificationBanner';
import { SkeletonCard } from '../../components/common/Skeleton';
import { createRefreshControl } from '../../components/common/PullToRefresh';

export function StudentDashboardScreen({ navigation }: any) {
  const { firstName, isEmailVerified, isRestricted } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [invites, setInvites] = useState<InviteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, invRes] = await Promise.all([
        studentService.getDashboard(),
        inviteService.getAll(),
      ]);
      setDashboardData(dashRes.data.data);
      setInvites((invRes.data as any).data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAcceptInvite = async (id: string) => {
    try {
      await inviteService.accept(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      await inviteService.decline(id);
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={createRefreshControl({
          refreshing,
          onRefresh: () => { setRefreshing(true); fetchData(); },
        })}
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <Text style={styles.greeting}>Hello, {firstName || 'Student'}</Text>
          <Text style={styles.subtitle}>Ready to learn today?</Text>
        </MotiView>

        {!isEmailVerified && <EmailVerificationBanner />}

        {isRestricted && (
          <View style={styles.restrictedBanner}>
            <Text style={styles.restrictedText}>Your account has been restricted. Contact support.</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <>
            <DashboardCards
              stats={{
                nextSession: dashboardData?.next_session,
                activeClasses: dashboardData?.active_classes || 0,
                pendingInvites: invites.length,
                unreadNotifications: dashboardData?.unread_notifications || 0,
              }}
            />

            {invites.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Invites</Text>
                {invites.map((invite) => (
                  <InviteCard
                    key={invite.id}
                    invite={invite}
                    onAccept={() => handleAcceptInvite(invite.id)}
                    onDecline={() => handleDeclineInvite(invite.id)}
                    onPress={() => navigation.navigate('ClassInvite', { inviteId: invite.id })}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  content: { flexGrow: 1, paddingBottom: spacing[8] },
  greeting: { ...typography.h1, color: colors.text.heading, paddingHorizontal: spacing[5], marginTop: spacing[5] },
  subtitle: { ...typography.bodyMd, color: colors.text.muted, paddingHorizontal: spacing[5], marginBottom: spacing[6] },
  restrictedBanner: { backgroundColor: colors.semantic.errorLight, padding: spacing[4], marginHorizontal: spacing[5], borderRadius: 12, marginBottom: spacing[4] },
  restrictedText: { ...typography.bodySm, color: colors.semantic.error },
  skeletons: { paddingHorizontal: spacing[5] },
  section: { paddingHorizontal: spacing[5], marginTop: spacing[4] },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[3] },
});
