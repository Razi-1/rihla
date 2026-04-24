import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyBold = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  displayLg: {
    fontFamily: fontFamilyBold,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.34,
  } as TextStyle,

  h1: {
    fontFamily: fontFamilyBold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.28,
  } as TextStyle,

  h2: {
    fontFamily: fontFamilyBold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.22,
  } as TextStyle,

  h3: {
    fontFamily: fontFamilyBold,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  titleLg: {
    fontFamily: fontFamilyBold,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  } as TextStyle,

  titleMd: {
    fontFamily: fontFamilyBold,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  } as TextStyle,

  titleSm: {
    fontFamily: fontFamilyBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  bodyLg: {
    fontFamily,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,

  bodyMd: {
    fontFamily,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  } as TextStyle,

  bodySm: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  } as TextStyle,

  labelLg: {
    fontFamily: fontFamilyBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  } as TextStyle,

  labelMd: {
    fontFamily: fontFamilyBold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  } as TextStyle,

  labelSm: {
    fontFamily: fontFamilyBold,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  } as TextStyle,

  button: {
    fontFamily: fontFamilyBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  caption: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,
} as const;

export type Typography = typeof typography;
