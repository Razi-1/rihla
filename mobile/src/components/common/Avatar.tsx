import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { getInitials } from '../../utils/formatters';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: 12,
  md: 15,
  lg: 20,
  xl: 28,
};

interface AvatarProps {
  imageUrl?: string | null;
  firstName: string;
  lastName: string;
  size?: AvatarSize;
}

export function Avatar({ imageUrl, firstName, lastName, size = 'md' }: AvatarProps) {
  const dimension = SIZES[size];

  if (imageUrl) {
    return (
      <View style={[styles.container, { width: dimension, height: dimension }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
        />
        <View style={[styles.halo, { width: dimension + 4, height: dimension + 4, borderRadius: (dimension + 4) / 2 }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: FONT_SIZES[size] }]}>
        {getInitials(firstName, lastName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
  },
  halo: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.surface.card,
  },
  fallback: {
    backgroundColor: colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    ...typography.labelMd,
    color: colors.primary.navy,
    fontWeight: '600',
  },
});
