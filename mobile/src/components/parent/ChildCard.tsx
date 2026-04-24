import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedCard } from '../common/AnimatedCard';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { ChildSummaryResponse } from '../../types/parent';

interface ChildCardProps {
  child: ChildSummaryResponse;
  index?: number;
  onPress?: () => void;
}

export function ChildCard({ child, index = 0, onPress }: ChildCardProps) {
  const statusVariant = child.link_status === 'confirmed' ? 'success' : 'warning';
  const statusLabel = child.link_status === 'confirmed' ? 'Linked' : 'Pending';

  return (
    <AnimatedCard index={index} onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar
          imageUrl={child.profile_picture_url}
          firstName={child.first_name}
          lastName={child.last_name}
          size="lg"
        />
        <View style={styles.info}>
          <Text style={styles.name}>{child.first_name} {child.last_name}</Text>
          <Badge text={statusLabel} variant={statusVariant} />
        </View>
      </View>
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  info: { flex: 1, gap: spacing[2] },
  name: { ...typography.titleMd, color: colors.text.heading },
});
