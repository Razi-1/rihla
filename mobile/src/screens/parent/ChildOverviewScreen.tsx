import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { parentService } from '../../services/parentService';
import { ChildDetailResponse } from '../../types/parent';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { PermissionToggle } from '../../components/parent/PermissionToggle';
import { SkeletonCard } from '../../components/common/Skeleton';
import { EmptyState } from '../../components/common/EmptyState';

export function ChildOverviewScreen({ route, navigation }: any) {
  const { studentId } = route.params;
  const [child, setChild] = useState<ChildDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getChildDetail(studentId)
      .then((res) => setChild(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ padding: spacing[5] }}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (!child) return null;

  const statusVariant = child.link_status === 'confirmed' ? 'success' : 'warning';
  const statusLabel = child.link_status === 'confirmed' ? 'Linked' : 'Pending';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Child Overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, shadow.md]}>
          <Avatar
            imageUrl={child.profile_picture_url}
            firstName={child.first_name}
            lastName={child.last_name}
            size="xl"
          />
          <Text style={styles.name}>{child.first_name} {child.last_name}</Text>
          <Badge text={statusLabel} variant={statusVariant} />
        </View>

        <Text style={styles.sectionTitle}>Tutor Permissions</Text>
        <Text style={styles.sectionDesc}>Control which tutors can access your child's information.</Text>

        {child.tutor_permissions.length > 0 ? (
          child.tutor_permissions.map((perm) => (
            <PermissionToggle key={perm.id} permission={perm} />
          ))
        ) : (
          <EmptyState
            icon={<ShieldCheck size={44} color={colors.text.muted} strokeWidth={1.5} />}
            title="No permissions yet"
            description="Tutor permission requests will appear here."
          />
        )}
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
  profileCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[6], alignItems: 'center', gap: spacing[3], marginBottom: spacing[6], marginTop: spacing[4] },
  name: { ...typography.h2, color: colors.text.heading },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[2] },
  sectionDesc: { ...typography.bodySm, color: colors.text.muted, marginBottom: spacing[4] },
});
