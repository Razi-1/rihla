import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { reviewSchema, ReviewFormData } from '../../utils/validators';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { StarRating } from '../common/StarRating';

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => void;
  loading?: boolean;
  initialData?: Partial<ReviewFormData>;
}

export function ReviewForm({ onSubmit, loading, initialData }: ReviewFormProps) {
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: initialData?.rating || 0,
      text: initialData?.text || '',
      sessions_attended: initialData?.sessions_attended || 1,
      approximate_duration_weeks: initialData?.approximate_duration_weeks || 1,
    },
  });

  const currentRating = watch('rating');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rating</Text>
      <StarRating rating={currentRating} size={32} onRate={(r) => setValue('rating', r)} />
      {errors.rating && <Text style={styles.error}>{errors.rating.message}</Text>}

      <Controller
        control={control}
        name="text"
        render={({ field: { onChange, value } }) => (
          <View style={styles.textAreaContainer}>
            <Text style={styles.label}>Review</Text>
            <TextInput
              style={styles.textArea}
              value={value}
              onChangeText={onChange}
              placeholder="Share your experience..."
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            {errors.text && <Text style={styles.error}>{errors.text.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="sessions_attended"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Sessions Attended"
            value={String(value)}
            onChangeText={(t) => onChange(parseInt(t) || 0)}
            keyboardType="numeric"
            error={errors.sessions_attended?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="approximate_duration_weeks"
        render={({ field: { onChange, value } }) => (
          <Input
            label="Duration (weeks)"
            value={String(value)}
            onChangeText={(t) => onChange(parseInt(t) || 0)}
            keyboardType="numeric"
            error={errors.approximate_duration_weeks?.message}
          />
        )}
      />

      <Button title="Submit Review" onPress={handleSubmit(onSubmit)} loading={loading} fullWidth size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[4] },
  label: { ...typography.labelMd, color: colors.text.heading, marginBottom: spacing[2] },
  error: { ...typography.bodySm, color: colors.semantic.error, marginTop: 4 },
  textAreaContainer: { marginBottom: spacing[2] },
  textArea: {
    ...typography.bodyMd,
    color: colors.text.body,
    backgroundColor: colors.surface.low,
    borderRadius: 12,
    padding: spacing[4],
    minHeight: 120,
  },
});
