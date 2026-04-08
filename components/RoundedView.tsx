import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export type RoundedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  radius?: number;
  isOverlay?: boolean;
};

export function RoundedView({
  style,
  lightColor,
  darkColor,
  radius = 30,
  isOverlay = true,
  ...otherProps
}: RoundedViewProps) {
    const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background'
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, padding: 20, borderTopLeftRadius: radius, borderTopRightRadius: radius },
        style,
      ]}
    >
      {isOverlay && <View style={styles.overlay} />}
      <View style={[styles.content, {paddingBottom: insets.bottom}]} {...otherProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  overlay: {
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: 'white',
    top: -12,
    position: 'absolute',
    minHeight: 20,
    width: '100%',
    opacity: 0.3,
  },
  content: {
    width: '100%',
    paddingBottom: 0,
    alignItems: 'center',

  },
});
