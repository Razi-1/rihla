import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { attendanceService } from '../../services/attendanceService';
import { QRScanner } from '../../components/qr/QRScanner';

export function QRScannerScreen({ route, navigation }: any) {
  const { sessionId } = route.params;
  const [processing, setProcessing] = useState(false);

  const handleScan = async (data: string) => {
    setProcessing(true);
    try {
      await attendanceService.validateQR({ qr_token: data, session_id: sessionId });
      Alert.alert('Success', 'Attendance recorded!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Error', 'Invalid or expired QR code. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.white} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan QR Code</Text>
      </View>
      <QRScanner onScan={handleScan} isProcessing={processing} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.black },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: spacing[3] },
  back: { padding: spacing[2] },
  title: { ...typography.titleMd, color: colors.white },
});
