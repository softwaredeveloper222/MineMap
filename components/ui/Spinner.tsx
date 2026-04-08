import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type SpinnerProps = {
  size?: number | 'small' | 'large';
  color?: string; // Use string to ensure compatibility with border color
  lightColor?: string;
  darkColor?: string;
  animating?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const THICKNESS = 2; // px

function Spinner({
  size = 'large',
  color,
  lightColor,
  darkColor,
  animating = true,
  style,
  testID,
}: SpinnerProps) {
  const themeTintColor = useThemeColor({ light: lightColor, dark: darkColor }, 'tint');
  const resolvedColor = color ?? themeTintColor;

  const resolvedSize = useMemo(() => {
    if (typeof size === 'number') return size;
    return size === 'large' ? 20 : 36;
  }, [size]);

  const rotateValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animating) {
      rotateValue.setValue(0);
      const timing = Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      });
      const loop = Animated.loop(timing, { iterations: -1, resetBeforeIteration: true });
      animationRef.current = loop;
      loop.start();
    } else {
      animationRef.current?.stop();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [animating, rotateValue]);

  const spin = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width: resolvedSize,
          height: resolvedSize,
          borderRadius: resolvedSize / 2,
          borderWidth: THICKNESS,
          borderColor: '#FFFFFF3E',
          // borderTopColor: resolvedColor,
          borderBlockStartColor: resolvedColor,
          transform: [{ rotate: spin }],
        },
        style,
      ]}
    />
  );
}

export default Spinner;
