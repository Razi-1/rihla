import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing, shadow } from '../../theme/spacing';
import { TutorCardResponse } from '../../types/tutor';
import { Avatar } from '../common/Avatar';
import { Chip } from '../common/Chip';
import { formatCurrency } from '../../utils/formatters';
import { MODE_LABELS } from '../../utils/constants';

interface TutorCardProps {
  tutor: TutorCardResponse;
  onPress: () => void;
  index?: number;
}

export function TutorCard({ tutor, onPress, index = 0 }: TutorCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.95} style={[styles.card, shadow.md]}>
      <View style={styles.header}>
        <Avatar
          imageUrl={tutor.profile_picture_url}
          firstName={tutor.first_name}
          lastName={tutor.last_name}
          size="lg"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{tutor.first_name} {tutor.last_name}</Text>
          {tutor.city_name && (
            <View style={styles.locationRow}>
              <MapPin size={14} color={colors.text.muted} strokeWidth={1.5} />
              <Text style={styles.location}>{tutor.city_name}</Text>
            </View>
          )}
          {tutor.average_rating && (
            <View style={styles.ratingRow}>
              <Star size={14} color={colors.semantic.warning} fill={colors.semantic.warning} strokeWidth={1.5} />
              <Text style={styles.rating}>{tutor.average_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({tutor.review_count})</Text>
            </View>
          )}
        </View>
        <View style={styles.priceContainer}>
          {tutor.individual_rate && (
            <Text style={styles.price}>
              {formatCurrency(tutor.individual_rate, tutor.currency || 'LKR')}
            </Text>
          )}
          <Text style={styles.perSession}>/ session</Text>
        </View>
      </View>

      {tutor.bio && (
        <Text style={styles.bio} numberOfLines={2}>{tutor.bio}</Text>
      )}

      <View style={styles.chips}>
        {tutor.mode_of_tuition && (
          <Chip label={MODE_LABELS[tutor.mode_of_tuition] || tutor.mode_of_tuition} />
        )}
        {tutor.subjects.slice(0, 3).map((s) => (
          <Chip key={s.id} label={s.subject_name || ''} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.md,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  header: { flexDirection: 'row', gap: spacing[3] },
  headerInfo: { flex: 1 },
  name: { ...typography.titleSm, color: colors.text.heading },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { ...typography.bodySm, color: colors.text.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { ...typography.labelMd, color: colors.text.heading },
  reviewCount: { ...typography.bodySm, color: colors.text.muted },
  priceContainer: { alignItems: 'flex-end' },
  price: { ...typography.titleMd, color: colors.primary.blue },
  perSession: { ...typography.caption, color: colors.text.muted },
  bio: { ...typography.bodySm, color: colors.text.body, marginTop: spacing[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[3] },
});
