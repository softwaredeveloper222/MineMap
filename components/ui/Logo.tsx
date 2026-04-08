
import SvgLogo from '@/assets/images/Logo.svg';
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

export function Logo({
  size = 24,
  color = '#ffffff',
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[style as any, {
      zIndex: 2,
      // paddingRight: '10%',
    }]}>
      <SvgLogo width={size} height={size} fill={color} style={{
        marginRight: size * 0.23
      }} />
    </View>
  );
}
