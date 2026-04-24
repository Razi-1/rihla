import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 20,
  onRate,
  readonly = false,
}: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const filled = starIndex <= Math.floor(rating);
        const halfFilled = !filled && starIndex <= rating + 0.5;

        const StarWrapper = readonly ? View : TouchableOpacity;

        return (
          <StarWrapper
            key={i}
            onPress={readonly ? undefined : () => onRate?.(starIndex)}
            style={styles.star}
          >
            <Star
              size={size}
              color={filled || halfFilled ? colors.semantic.warning : colors.surface.high}
              fill={filled ? colors.semantic.warning : 'transparent'}
              strokeWidth={1.5}
            />
          </StarWrapper>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  star: {
    padding: 2,
  },
});
