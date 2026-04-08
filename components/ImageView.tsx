import { ImageBackground, StyleSheet, type ViewProps } from 'react-native';


export type ImageViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  backgroundImage?: any;
};

export function ImageView({ style, lightColor, darkColor, backgroundImage, ...otherProps }: ImageViewProps) {

  return <ImageBackground
    source={backgroundImage}
    style={styles.background}
    resizeMode="cover"
  />;
}

const styles = StyleSheet.create({
  background: {
    zIndex: -10,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});
