import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { QRDisplay } from '../../components/qr/QRDisplay';

export function QRDisplayScreen({ route, navigation }: any) {
  const { sessionId } = route.params;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Attendance QR</Text>
      </View>
      <View style={styles.content}>
        <QRDisplay sessionId={sessionId} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] },
  back: { padding: spacing[2] },
  title: { ...typography.titleMd, color: colors.text.heading },
  content: { flex: 1, justifyContent: 'center' },
});
