import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { LinkChildForm } from '../../components/parent/LinkChildForm';

export function LinkChildScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Link a Child</Text>
        <LinkChildForm onSuccess={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  back: { padding: spacing[5] },
  content: { paddingHorizontal: spacing[5] },
  title: { ...typography.h1, color: colors.text.heading, marginBottom: spacing[6] },
});
