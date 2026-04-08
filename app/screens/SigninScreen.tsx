import TitleSVG from '@/assets/images/Title.svg';
import { Button } from '@/components/Button';
import { GreenView } from '@/components/GreenView';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { Logo } from '@/components/ui/Logo';
import { forgotPassword, signIn, updateUserInfo } from '@/hooks/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

export default function SignInScreen() {
    const router = useRouter();
    const [selectedValue, setSelectedValue] = useState("");
    const [isAllowChecked, setAllowChecked] = useState(false);
    const [isShareChecked, setShareChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { language } = useLocalSearchParams<{ language: string }>();

    const insets = useSafeAreaInsets();

    const onLoginPress = async () => {
        if (!email || !password) {
            Alert.alert("Login Failed", "Please enter both email and password.");
            return;
        }

        setLoading(true);
        const { user, error }: { user: any; error: any } = await signIn(email, password);
        if (error) {
            setLoading(false);
            Alert.alert("Login Failed", "Invalid email or password.");
            return;
        }
        setLoading(false);

    };
    const onForgetPasswordPress = async () => {
        if (!email) {
            Alert.alert("Forgot Password Failed", "Please enter email.");
            return;
        }
        const { success, error } = await forgotPassword(email);

        if (success) {
            Alert.alert(
                "Password Reset",
                "If this email is registered, you’ll receive a reset link shortly."
            );
        } else {
            Alert.alert("Error", error?.message || "Failed to send reset email.");
        }
    }

    const onSignupPress = () => {
        router.replace(`/screens/SignupScreen?language=${language}`);
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
                                        Welcome back.
                                    </Text>
                                    <Text style={{ color: '#475467', fontSize: 16, fontWeight: '400', marginTop: 5 }}>
                                        Login to continue
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
                                            secureTextEntry={true}
                                            style={styles.lineInput}
                                            placeholder="Password"
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                    </View>
                                </View>
                                <View style={{ width: '100%', justifyContent: 'flex-end', flexDirection: 'row', marginBottom: 30 }}>
                                    <TouchableOpacity activeOpacity={0.8} onPress={onForgetPasswordPress}>
                                        <Text style={{ fontWeight: '700' }} >Forgot password?</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ width: '100%', marginBottom: 20 }}>
                                    <Button label='Sign In' onPress={onLoginPress} loading={loading} />
                                </View>

                                <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'center', marginBottom: 100 }}>
                                    <Text style={{ color: '#475467', fontWeight: '400', fontSize: 17 }}>Don&apos;t have an account?</Text>
                                    <TouchableOpacity activeOpacity={0.8} onPress={onSignupPress}>
                                        <Text style={{ color: '#000000', fontWeight: '400', fontSize: 17 }}> Sign up</Text>
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
