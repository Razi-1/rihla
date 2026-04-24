import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, MapPin, Clock } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { tutorService } from '../../services/tutorService';
import { TutorProfileResponse } from '../../types/tutor';
import { Avatar } from '../../components/common/Avatar';
import { Chip } from '../../components/common/Chip';
import { Badge } from '../../components/common/Badge';
import { StarRating } from '../../components/common/StarRating';
import { Button } from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import { formatCurrency, formatDayOfWeek } from '../../utils/formatters';
import { MODE_LABELS } from '../../utils/constants';

export function TutorProfileScreen({ route, navigation }: any) {
  const { tutorId } = route.params;
  const [profile, setProfile] = useState<TutorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await tutorService.getAuthenticatedProfile(tutorId);
        setProfile(res.data.data);
      } catch {
        try {
          const res = await tutorService.getPublicProfile(tutorId);
          setProfile(res.data.data);
        } catch {}
      } finally {
        setLoading(false);
      }
    })();
  }, [tutorId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }}>
          <View style={[styles.profileCard, shadow.md]}>
            <Avatar imageUrl={profile.profile_picture_url} firstName={profile.first_name} lastName={profile.last_name} size="xl" />
            <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
            {profile.city_name && (
              <View style={styles.locationRow}>
                <MapPin size={16} color={colors.text.muted} strokeWidth={1.5} />
                <Text style={styles.locationText}>{[profile.city_name, profile.region_name, profile.country_name].filter(Boolean).join(', ')}</Text>
              </View>
            )}
            {profile.average_rating && (
              <View style={styles.ratingRow}>
                <StarRating rating={profile.average_rating} size={18} readonly />
                <Text style={styles.ratingText}>{profile.average_rating.toFixed(1)} ({profile.review_count} reviews)</Text>
              </View>
            )}
            {profile.mode_of_tuition && <Badge text={MODE_LABELS[profile.mode_of_tuition] || ''} variant="primary" />}
          </View>
        </MotiView>

        {profile.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.chips}>{profile.subjects.map((s) => <Chip key={s.id} label={`${s.subject_name} - ${s.education_level_name}`} />)}</View>
        </View>

        {(profile.individual_rate || profile.group_rate) && (
          <View style={[styles.priceCard, shadow.sm]}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            {profile.individual_rate && <Text style={styles.priceRow}>Individual: {formatCurrency(profile.individual_rate, profile.currency || 'LKR')}/session</Text>}
            {profile.group_rate && <Text style={styles.priceRow}>Group: {formatCurrency(profile.group_rate, profile.currency || 'LKR')}/session</Text>}
          </View>
        )}

        {profile.working_hours.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            {profile.working_hours.filter((h) => h.is_working).map((h, i) => (
              <View key={i} style={styles.hourRow}>
                <Text style={styles.hourDay}>{formatDayOfWeek(h.day_of_week)}</Text>
                <Text style={styles.hourTime}>{h.start_time} - {h.end_time}</Text>
              </View>
            ))}
          </View>
        )}

        {profile.sentiment_summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Student Feedback</Text>
            <Text style={styles.sentiment}>{profile.sentiment_summary}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button title="Contact Tutor" onPress={() => {}} fullWidth size="lg" icon={<MessageSquare size={20} color={colors.white} strokeWidth={1.5} />} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  back: { padding: spacing[5] },
  content: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  loadingContainer: { padding: spacing[5] },
  profileCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[6], alignItems: 'center', gap: spacing[3], marginBottom: spacing[5] },
  name: { ...typography.h2, color: colors.text.heading },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { ...typography.bodySm, color: colors.text.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  ratingText: { ...typography.labelMd, color: colors.text.body },
  section: { marginBottom: spacing[6] },
  sectionTitle: { ...typography.titleMd, color: colors.text.heading, marginBottom: spacing[3] },
  bio: { ...typography.bodyMd, color: colors.text.body, lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  priceCard: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[5], marginBottom: spacing[6] },
  priceRow: { ...typography.bodyMd, color: colors.text.body, marginBottom: spacing[2] },
  hourRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing[2] },
  hourDay: { ...typography.labelMd, color: colors.text.heading },
  hourTime: { ...typography.bodyMd, color: colors.text.body },
  sentiment: { ...typography.bodyMd, color: colors.text.body, fontStyle: 'italic' },
  actions: { marginTop: spacing[4] },
});
