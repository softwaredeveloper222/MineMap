import TitleSVG from '@/assets/images/Title.svg';
import { Button } from '@/components/Button';
import { GreenView } from '@/components/GreenView';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { CommunityPassword } from '@/constants/types';
import { useAuth } from '@/contexts/authContext';
import { createUserDocument, signIn, signUp } from '@/hooks/auth';
import { getDeviceId } from '@/hooks/functions';
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';
export default function SelectLanguageScreen() {
    const router = useRouter();
    const [selectedLanguage, setSelectedLanguage] = useState("english");
    const [isAllowChecked, setAllowChecked] = useState(false);
    const [isShareChecked, setShareChecked] = useState(false);
    const { user } = useAuth();
    const userRole = userData.getState().userRole;
    const { setUserId } = userData.getState();
    const [loading, setLoading] = useState(false);

    const onPress = async () => {
        if (userRole === 'community') {
            setLoading(true);
            const userId = `${(await getDeviceId() as string)}@community.com`;
            // setUserId(userId as string);
            // setLoading(false);
            const { user, error }: { user: any, error: any } = await signUp(userId, CommunityPassword);
            if (error) {
                if (error?.message.includes('already')) {
                    await signIn(userId, CommunityPassword);
                    setLoading(false);
                }
            } else {
                await createUserDocument(user, 'community', selectedLanguage);
                await signIn(userId, CommunityPassword);
                setLoading(false);
            }
        } else {
            router.push(`/screens/SigninScreen?language=${selectedLanguage}`);
        }
    }

    return (
        <GreenView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <Header isCommunity={false} title='' />
                <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <View style={styles.logoContainer}>
                        <Logo size={45} style={styles.logo} />
                        <TitleSVG width={80} style={styles.title} />
                    </View>
                    <RoundedView style={styles.roundedView} radius={16}>
                        <ScrollView
                            contentContainerStyle={{
                                alignItems: 'center',

                            }}
                            style={{ width: '100%' }}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header Text */}
                            <View style={{ alignItems: 'center', marginBottom: 40 }}>
                                <Text style={{ color: 'black', fontSize: 22, fontWeight: '600', zIndex: 3 }}>
                                    Welcome back.
                                </Text>
                                <Text style={{ color: '#475467', fontSize: 16, fontWeight: '400', marginTop: 5 }}>
                                    Select language and review permissions
                                </Text>
                            </View>

                            <View style={{ alignItems: 'flex-start', width: '100%', marginBottom: 20 }}>
                                <Text>
                                    Language
                                </Text>
                                <View style={{ borderColor: '#DBDBDB', borderWidth: 1, width: '100%', borderRadius: 8, marginTop: 4 }}>
                                    <Picker
                                        selectedValue={selectedLanguage}
                                        style={styles.picker}
                                        placeholder='Select your preferred language'
                                        onValueChange={(itemValue) => setSelectedLanguage(itemValue)}
                                    >
                                        <Picker.Item label="English" value="english" />
                                        <Picker.Item label="Burmese" value="burmese" />
                                        <Picker.Item label="Chin dialect" value="chin_dialect" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={{ alignItems: 'flex-start', width: '100%', marginBottom: 50, marginTop: 20, gap: 15 }}>
                                <Text>
                                    Consent and Privacy
                                </Text>
                                {/* <View style={{ width: '100%' }}>
                                    <View style={styles.row}>
                                        <Checkbox
                                            value={isAllowChecked}
                                            onValueChange={setAllowChecked}
                                            color={isAllowChecked ? '#4A90E2' : undefined}
                                        />
                                        <Text style={styles.label}>Allow GPS location access for hazard alerts</Text>
                                    </View>
                                </View> */}
                                <View style={{ width: '100%' }}>
                                    <View style={styles.row}>
                                        <Checkbox
                                            value={isShareChecked}
                                            onValueChange={setShareChecked}
                                            color={isShareChecked ? '#4A90E2' : undefined}
                                            style={{ marginBottom: 'auto' }}
                                        />
                                        <Text style={styles.label}>Share anonymous heatmap data to improve safety</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Continue Button */}
                            <View style={{ width: '100%' }}>
                                <Button label="Continue" onPress={onPress} loading={loading} />
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
        gap: 10,
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
    },
    picker: {
        width: '100%',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        marginLeft: 8,
        fontSize: 16,
        paddingRight: 7
    },
});
