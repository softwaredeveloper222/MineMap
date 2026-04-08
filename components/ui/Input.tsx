import Location from '@/assets/images/Location.svg';
import Point from '@/assets/images/Point.svg';
import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, TextInput, View, type ViewProps } from 'react-native';

export type InputProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  disabled?: boolean;
  placeHolder?: string;
  text?: string;
  onInputChange?: () => void;
};

export function Input({
  style,
  lightColor,
  darkColor,
  disabled = false,
  placeHolder = 'Continue',
  text = "",
  onInputChange,
  ...otherProps
}: InputProps) {
  useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View style={styles.container}>
      <Location width={20} height={20} color="#00D4AA" style={styles.icon} />
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={onInputChange}
        placeholder={placeHolder}
      />
      <Point width={20} height={20} color="#00D4AA" style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 60,
    width: '100%',
    borderWidth: 1,
    borderColor: '#DBDBDB'
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'white',
    paddingLeft: 10
  },
  icon: {
    backgroundColor: 'white'
  },
});
