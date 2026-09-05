import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'], writingDirection: 'rtl', textAlign: 'right' },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  link: {
    lineHeight: 24,
    fontSize: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  linkPrimary: {
    lineHeight: 24,
    fontSize: 14,
    color: '#059669',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  code: {
    fontFamily: Fonts?.mono || 'monospace',
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
  },
});