import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Video, ExternalLink } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, radius, shadow } from '../../theme/spacing';
import { Button } from '../../components/common/Button';

export function VideoCallScreen({ route, navigation }: any) {
  const { roomName, displayName } = route.params;
  const [joining, setJoining] = useState(false);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"`;
      const canOpen = await Linking.canOpenURL(jitsiUrl);
      if (canOpen) {
        await Linking.openURL(jitsiUrl);
      } else {
        Alert.alert('Error', 'Unable to open video call. Please install Jitsi Meet.');
      }
    } catch {
      Alert.alert('Error', 'Failed to join video call.');
    } finally {
      setJoining(false);
    }
  }, [roomName, displayName]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={24} color={colors.text.heading} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Call</Text>
      </View>

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 120 }}
          style={[styles.card, shadow.md]}
        >
          <View style={styles.iconWrap}>
            <Video size={48} color={colors.primary.blue} strokeWidth={1.5} />
          </View>
          <Text style={styles.roomTitle}>{roomName}</Text>
          <Text style={styles.joinAs}>Joining as {displayName}</Text>

          <Button
            title="Join Video Call"
            onPress={handleJoin}
            loading={joining}
            fullWidth
            size="lg"
            icon={<ExternalLink size={20} color={colors.white} strokeWidth={1.5} />}
          />
          <Text style={styles.hint}>Opens in Jitsi Meet app</Text>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.base },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], gap: spacing[3] },
  back: { padding: spacing[2] },
  headerTitle: { ...typography.titleMd, color: colors.text.heading },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing[5] },
  card: { backgroundColor: colors.surface.card, borderRadius: radius.md, padding: spacing[8], alignItems: 'center', gap: spacing[4] },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary.light, alignItems: 'center', justifyContent: 'center' },
  roomTitle: { ...typography.h2, color: colors.text.heading, textAlign: 'center' },
  joinAs: { ...typography.bodyMd, color: colors.text.muted },
  hint: { ...typography.bodySm, color: colors.text.muted },
});
