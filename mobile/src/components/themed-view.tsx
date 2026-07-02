import React from 'react';
import { View, Text, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, children, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  // Filter out raw text/number children that would crash React Native's <View>
  const safeChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return <Text>{child}</Text>;
    }
    return child;
  });

  return (
    <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps}>
      {safeChildren}
    </View>
  );
}
