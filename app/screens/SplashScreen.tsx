import TitleSVG from '@/assets/images/Title.svg';
import TitleDesSVG from '@/assets/images/TitleDescription.svg';
import { Logo } from '@/components/ui/Logo';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';

const SPLASH_DURATION = 2000; // ms

export default function SplashScreen() {
  const router = useRouter();
  const {loading} = useAuth();
  // useEffect(() => {
  //   const timeout = setTimeout(() => {
  //     router.replace('/screens/SelectRoleScreen');
  //   }, SPLASH_DURATION);

  //   return () => clearTimeout(timeout);
  // }, [router]);


  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/MapBackground.png')}
        style={styles.background}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      <View style={styles.centerContent}>
        <Logo size={100} style={styles.logo} />
        <TitleSVG width={200} style={styles.title} />
        <TitleDesSVG width={110} style={styles.titleDes} />
      </View>
      <Spinner style={styles.spinner} color="white" size={45} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  background: {
    zIndex: -10,
    width: '110%',
    height: '110%',
    top: -50,
    left: -50,
    position: 'absolute',
  },
  
  overlay: {
    zIndex: -5,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1ac7a1',
  },
  centerContent: {
    alignItems: 'center',
    marginBottom: 100,
    zIndex: 1
  },
  logo: {
    marginTop: 70,
  },
  title: {
    width: 120,
    marginTop: 10,
  },
  titleDes: {
    marginTop: 25,
  },
  spinner: {
    position: 'absolute',
    bottom: 70,
  },
});
