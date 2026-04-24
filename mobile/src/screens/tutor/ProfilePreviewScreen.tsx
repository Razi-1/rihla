import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { tutorService } from '../../services/tutorService';
import { TutorProfileResponse } from '../../types/tutor';
import { Avatar } from '../../components/common/Avatar';
import { Chip } from '../../components/common/Chip';
import { StarRating } from '../../components/common/StarRating';
import { Badge } from '../../components/common/Badge';
import { SkeletonCard } from '../../components/common/Skeleton';
import { formatCurrency, formatDayOfWeek } from '../../utils/formatters';
import { MODE_LABELS } from '../../utils/constants';

export function ProfilePreviewScreen({ navigation }: any) {
  const [profile, setProfile] = useState<TutorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tutorService.getProfilePreview()
      .then((res) => setProfile(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SafeAreaView style={styles.safe}><View style={{ padding: spacing[5] }}><SkeletonCard /><SkeletonCard /></View></SafeAreaView>;
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <Text style={styles.hint}>How students see you</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadow.md]}>
          <Avatar imageUrl={profile.profile_picture_url} firstName={profile.first_name} lastName={profile.last_name} size="xl" />
          <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
          {profile.city_name && <Text style={styles.location}>{[profile.city_name, profile.country_name].filter(Boolean).join(', ')}</Text>}
          {profile.average_rating && (
            <View style={styles.ratingRow}>
              <StarRating rating={profile.average_rating} size={18} readonly />
              <Text style={styles.ratingText}>{profile.average_rating.toFixed(1)} ({profile.review_count})</Text>
            </View>
          )}
          {profile.mode_of_tuition && <Badge text={MODE_LABELS[profile.mode_of_tuition] || ''} />}
        </View>

        {profile.bio && <><Text style={styles.sectionTitle}>About</Text><Text style={styles.bio}>{profile.bio}</Text></>}
        <Text style={styles.sectionTitle}>Subjects</Text>
        <View style={styles.chips}>{profile.subjects.map((s) => <Chip key={s.id} label={`${s.subject_name} - ${s.education_level_name}`} />)}</View>
        {(profile.individual_rate || profile.group_rate) && (
          <View style={[styles.priceCard, shadow.sm]}>
            {profile.individual_rate && <Text style={styles.priceText}>Individual: {formatCurrency(profile.individual_rate, profile.currency || 'LKR')}</Text>}
            {profile.group_rate && <Text style={styles.priceText}>Group: {formatCurrency(profile.group_rate, profile.currency || 'LKR')}</Text>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  back: { padding: spacing[2], marginBottom: spacing[2] },
  headerTitle: { ...typography.h2, color: colors.text.heading },
  hint: { ...typography.bodySm, color: colors.text.muted },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[6], alignItems: 'center', gap: spacing[3], marginBottom: spacing[6], marginTop: spacing[4] },
  name: { ...typography.h2, color: colors.text.heading },
  location: { ...typography.bodySm, color: colors.text.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  ratingText: { ...typography.labelMd, color: colors.text.body },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[3], marginTop: spacing[4] },
  bio: { ...typography.bodyMd, color: colors.text.body, lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  priceCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[5], marginTop: spacing[5], gap: spacing[2] },
  priceText: { ...typography.bodyMd, color: colors.text.body },
});
