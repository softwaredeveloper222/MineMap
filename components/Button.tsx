import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type ViewProps } from 'react-native';

export type ButtonProps = ViewProps & {
  loading?: boolean;
  lightColor?: string;
  darkColor?: string;
  disabled?: boolean;
  label?: string;
  onPress?: () => void;
};

export function Button({
  style,
  loading,
  lightColor,
  darkColor,
  disabled = false,
  label = 'Continue',
  onPress,
  ...otherProps
}: ButtonProps) {
  useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  const buttonStyle = [
    styles.button,
    { backgroundColor: disabled ? '#D9D9D9' : '#000000' },
    style,
  ];

  const textStyle = [
    styles.label,
    { color: disabled ? '#8D8D8D9E' : '#FFFFFF' },
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={buttonStyle}
      onPress={onPress}
      {...otherProps}
    >
      {loading ? <ActivityIndicator/> :<Text style={textStyle}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 55,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
