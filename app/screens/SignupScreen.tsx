import TitleSVG from '@/assets/images/Title.svg';
import { Button } from '@/components/Button';
import { GreenView } from '@/components/GreenView';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { createUserDocument, signIn, signUp } from '@/hooks/auth';
import { validation } from '@/hooks/functions';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function SignUpScreen() {
    const router = useRouter();
    const [selectedValue, setSelectedValue] = useState("");
    const [isAllowChecked, setAllowChecked] = useState(false);
    const [isShareChecked, setShareChecked] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { language } = useLocalSearchParams<{ language: string }>();
    const insets = useSafeAreaInsets();

    const onSignUpPress = async () => {
        const result = validation({ email, password, confirmPassword });
        if (result !== 'success') {
            Alert.alert('MineMap Sign Up', result);
            return;
        }
        setLoading(true);
        const { user, error }: { user: any, error: any } = await signUp(email, password);
        if (error) {
            setLoading(false);
            if (error?.message.includes('already'))
              Alert.alert('Sign Up Error', 'This email is already registered. Please log in instead.', [{ text: 'OK' }]);
            else
              Alert.alert('Sign Up Error', 'Signup failed. Please try again later.', [{ text: 'OK' }]);
          } else {
            await createUserDocument(user, 'operational', language);
            await signIn(email, password);
            setLoading(false);
            // router.push('/screens/HomeScreen');
          }
    }

    const onSigninPress = () => {
        router.replace('/screens/SigninScreen')
    }

    return (
        <GreenView style={{ flex: 1 }}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -(insets.top + insets.bottom)} >
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                    <Header isCommunity={false} title='' />
                    <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'space-between', backgroundColor: '#1AC7A1' }}>
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
                                        Get started.
                                    </Text>
                                    <Text style={{ color: '#475467', fontSize: 16, fontWeight: '400', marginTop: 5 }}>
                                        Create your account
                                    </Text>
                                </View>

                                <View style={{ alignItems: 'flex-start', width: '100%', marginBottom: 20 }}>
                                    <View style={{ width: '100%', marginTop: 4, gap: 15 }}>
                                        <TextInput
                                            style={styles.lineInput}
                                            placeholder="Email address"
                                            value={email}
                                            onChangeText={setEmail}
                                        />
                                        <TextInput
                                            style={styles.lineInput}
                                            secureTextEntry={true}
                                            placeholder="Password"
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <TextInput
                                            style={styles.lineInput}
                                            secureTextEntry={true}
                                            placeholder="Retype Password"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                    </View>
                                </View>

                                <View style={{ width: '100%', marginBottom: 20 }}>
                                    <Button label='Sign Up' onPress={onSignUpPress} loading={loading} />
                                </View>

                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', marginBottom: 100 }}>
                                    <Text style={{ color: '#475467', fontWeight: '400', fontSize: 17 }}>Already have an account?</Text>
                                    <TouchableOpacity activeOpacity={0.8} onPress={onSigninPress}>
                                        <Text style={{ color: '#000000', fontWeight: '400', fontSize: 17 }}> Sign In</Text>
                                    </TouchableOpacity>
                                </View>

                            </ScrollView>
                        </RoundedView>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </GreenView>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginTop: 30,
        marginBottom: 20,
    },
    logo: {

    },
    title: {

    },
    roundedView: {
        bottom: 0,
        zIndex: 2,
        paddingVertical: 30
    },
    picker: {
        height: 50,
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
    lineInput: {
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        textAlignVertical: "top", // keeps text at the top
    }
});
