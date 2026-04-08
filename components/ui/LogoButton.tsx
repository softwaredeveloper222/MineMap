import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, type ViewProps } from 'react-native';

export type LogoButtonProps = ViewProps & {
  id: string;
  lightColor?: string;
  darkColor?: string;
  disabled?: boolean;
  label?: string;
  icon?: string;
  selected?: string;
  onPress?: (id: string) => void;
};

export function LogoButton({
  id,
  style,
  lightColor,
  darkColor,
  disabled = false,
  label = 'Continue',
  icon = 'landmine',
  selected,
  onPress,
  ...otherProps
}: LogoButtonProps) {
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

  const icons = {
    "landmine": require('@/assets/images/Landmine.png'),
    "uxo": require('@/assets/images/Uxo.png'),
    "notsure": require('@/assets/images/Notsure.png'),
    "ied": require('@/assets/images/Ied.png'),
    "suspected": require('@/assets/images/Suspected.png'),
    "confirmed": require('@/assets/images/Confirmed.png'),
    "cleared": require('@/assets/images/Cleared.png'),
    "marked": require('@/assets/images/Marked.png'),
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.button, {backgroundColor: selected === id ? '#DDDDDD' : 'white'}]}
      onPress={() => onPress(id)}
      {...otherProps}
    >
      <Image
        source={icons[icon]}
        resizeMode="cover"
        style={styles.icon}
      />
      <Text style={styles.boldText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBDBDB',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    gap: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    width: 25,
    height: 28,
  },
  boldText: {
    fontWeight: '500', // ✅ must be string
  },
});
