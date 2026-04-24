import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { radius, shadow } from '../../theme/spacing';
import { buttonPressScale, springConfig } from '../../theme/animations';
import { LinearGradient } from 'react-native-svg';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(buttonPressScale, springConfig.stiff);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig.stiff);
  };

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Size`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    variant === 'primary' && shadow.sm,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, ...containerStyle]}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary.blue}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.button,
  },

  primaryContainer: {
    backgroundColor: colors.primary.blue,
    borderRadius: radius.full,
  },
  secondaryContainer: {
    backgroundColor: colors.surface.high,
    borderRadius: radius.full,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
    borderRadius: radius.full,
  },
  dangerContainer: {
    backgroundColor: colors.semantic.error,
    borderRadius: radius.full,
  },

  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text.heading,
  },
  ghostText: {
    color: colors.primary.blue,
  },
  dangerText: {
    color: colors.white,
  },

  smSize: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  mdSize: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  lgSize: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },

  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 17,
  },
});
