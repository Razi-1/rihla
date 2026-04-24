import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Button } from '../common/Button';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCANNER_SIZE = SCREEN_WIDTH * 0.7;

interface QRScannerProps {
  onScan: (data: string) => void;
  isProcessing?: boolean;
}

export function QRScanner({ onScan, isProcessing }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Camera access is needed to scan QR codes</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    onScan(data);
    setTimeout(() => setScanned(false), 3000);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <MotiView
                from={{ opacity: 0.3 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 1500, loop: true }}
                style={styles.scanLine}
              />
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instruction}>
              {isProcessing ? 'Verifying...' : 'Align QR code within the frame'}
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[8] },
  permissionText: { ...typography.bodyMd, color: colors.text.body, textAlign: 'center', marginBottom: spacing[5] },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middleRow: { flexDirection: 'row' },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanArea: { width: SCANNER_SIZE, height: SCANNER_SIZE, position: 'relative' },
  scanLine: { position: 'absolute', top: '50%', left: 10, right: 10, height: 2, backgroundColor: colors.primary.blue },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: spacing[6] },
  instruction: { ...typography.bodyMd, color: colors.white },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: colors.primary.blue, borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
});
