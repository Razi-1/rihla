import React, { useCallback, useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { X } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, spacing } from '../../theme/spacing';

interface BottomSheetProps {
  title?: string;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  onClose?: () => void;
  scrollable?: boolean;
}

export const BottomSheet = forwardRef<GorhomBottomSheet, BottomSheetProps>(
  ({ title, children, snapPoints: customSnapPoints, onClose, scrollable = false }, ref) => {
    const snapPoints = useMemo(() => customSnapPoints || ['50%', '80%'], [customSnapPoints]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

    return (
      <GorhomBottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color={colors.text.body} strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </View>
        )}
        <ContentWrapper style={styles.content}>{children}</ContentWrapper>
      </GorhomBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  indicator: {
    backgroundColor: colors.surface.high,
    width: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.titleMd,
    color: colors.text.heading,
    flex: 1,
  },
  closeButton: {
    padding: spacing[2],
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
  },
});
