import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { attendanceService } from '../../services/attendanceService';
import { QRTokenResponse } from '../../types/attendance';
import { formatRelativeTime } from '../../utils/formatters';

interface QRDisplayProps {
  sessionId: string;
}

export function QRDisplay({ sessionId }: QRDisplayProps) {
  const [qrData, setQrData] = useState<QRTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateQR = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceService.generateQR({ session_id: sessionId });
      setQrData(res.data.data);
    } catch {
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateQR();
    const interval = setInterval(generateQR, 30000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading && !qrData) {
    return (
      <View style={styles.container}>
        <MotiView from={{ opacity: 0.3 }} animate={{ opacity: 0.7 }} transition={{ type: 'timing', duration: 800, loop: true }} style={styles.placeholder} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!qrData) return null;

  return (
    <View style={styles.container}>
      <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
        <View style={[styles.qrCard, shadow.md]}>
          <Image source={{ uri: `data:image/png;base64,${qrData.qr_image_base64}` }} style={styles.qrImage} resizeMode="contain" />
          <View style={styles.pulseRing}>
            <MotiView from={{ scale: 1, opacity: 0.4 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ type: 'timing', duration: 2000, loop: true }} style={styles.pulse} />
          </View>
        </View>
      </MotiView>
      <Text style={styles.instruction}>Show this to your students</Text>
      <Text style={styles.expiry}>Refreshes automatically</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: spacing[6] },
  qrCard: { backgroundColor: colors.surface.card, borderRadius: radius.lg, padding: spacing[6], alignItems: 'center' },
  qrImage: { width: 240, height: 240 },
  pulseRing: { position: 'absolute', width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  pulse: { width: 280, height: 280, borderRadius: 140, borderWidth: 2, borderColor: colors.primary.blue },
  instruction: { ...typography.titleSm, color: colors.text.heading, marginTop: spacing[5] },
  expiry: { ...typography.bodySm, color: colors.text.muted, marginTop: spacing[1] },
  placeholder: { width: 240, height: 240, backgroundColor: colors.surface.high, borderRadius: radius.md },
  error: { ...typography.bodyMd, color: colors.semantic.error, textAlign: 'center' },
});
