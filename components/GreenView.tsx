import { View, type ViewProps } from 'react-native';


export type GreenViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function GreenView({ style, lightColor, darkColor, ...otherProps }: GreenViewProps) {
  const backgroundColor = '#1AC7A1';

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
