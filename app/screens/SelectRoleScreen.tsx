import TitleSVG from '@/assets/images/Title.svg';
import { Button } from '@/components/Button';
import { GreenView } from '@/components/GreenView';
import { RoleButtonFrame } from '@/components/RoleButtonFrame';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';

export default function SelectRoleScreen() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('community');
    const {setUserRole} = userData.getState();

    const onPress = (id : string) => {
        setSelectedRole(id);
    }

    const onPressContinue = () => {
        setUserRole(selectedRole);
        router.push('/screens/SliderScreen');
    }

    const onLearnMorePress = (id: string) => {

    }

    return (
        <GreenView style={{ flex: 1 }}>
            <SafeAreaView style={{flex : 1}} edges={['top', 'left', 'right']}>

            <Header isCommunity={false} showBack={false} title='' />
            <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <View style={styles.logoContainer}>
                    <Logo size={45} style={styles.logo} />
                    <TitleSVG width={80} style={styles.title} />
                </View>
                <RoundedView style={styles.roundedView} radius={16}>
                        <ScrollView
                            contentContainerStyle={{
                                alignItems: 'center',
                                gap: 40
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header Text */}
                            <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                <Text style={{ color: 'black', fontSize: 22, fontWeight: '600', zIndex: 3 }}>
                                    Who is using this app?
                                </Text>
                                <Text style={{ color: 'black', fontSize: 16, fontWeight: '400', marginTop: 5 }}>
                                    Please choose your role to get started:
                                </Text>
                            </View>

                            {/* Role Buttons */}
                            <View style={{ alignItems: 'center', width: '100%', marginBottom: 'auto' }}>
                                <RoleButtonFrame style={{ marginBottom: 18 }} id={'community'} selectedRole={selectedRole} onPress={onPress} onLearnMorePress={onLearnMorePress}/>
                                <RoleButtonFrame id={'operational'} onPress={onPress} selectedRole={selectedRole} onLearnMorePress={onLearnMorePress}/>
                            </View>

                            {/* Continue Button */}
                            <View style={{ width: '100%' }}>
                                <Button label="Continue" onPress={onPressContinue}/>
                            </View>
                        </ScrollView>
                </RoundedView>
            </View>
            </SafeAreaView>
        </GreenView>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    logo: {

    },
    title: {

    },
    roundedView: {
        bottom: 0,
        zIndex: 2,
    }
});
