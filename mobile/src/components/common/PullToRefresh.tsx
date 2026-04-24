import React from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../../theme/colors';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export function createRefreshControl({ refreshing, onRefresh }: PullToRefreshProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary.blue}
      colors={[colors.primary.blue]}
      progressBackgroundColor={colors.surface.card}
    />
  );
}
