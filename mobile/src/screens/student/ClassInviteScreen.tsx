import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { inviteService } from '../../services/inviteService';
import { InviteResponse } from '../../types/invite';
import { InviteCard } from '../../components/student/InviteCard';
import { SkeletonCard } from '../../components/common/Skeleton';

export function ClassInviteScreen({ route, navigation }: any) {
  const { inviteId } = route.params;
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inviteService.getById(inviteId)
      .then((res) => setInvite(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [inviteId]);

  const handleAccept = async () => {
    await inviteService.accept(inviteId);
    navigation.goBack();
  };

  const handleDecline = async () => {
    await inviteService.decline(inviteId);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Class Invite</Text>
        {loading ? <SkeletonCard /> : invite && (
          <InviteCard invite={invite} onAccept={handleAccept} onDecline={handleDecline} onPress={() => {}} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  back: { padding: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  title: { ...typography.h1, color: colors.text.heading, marginBottom: spacing[5] },
});
