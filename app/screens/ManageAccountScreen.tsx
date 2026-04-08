import Forward from '@/assets/images/Forward.svg';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import ToggleButton from '@/components/ui/ToggleButton';
import { signOutUser, updateUserInfo } from '@/hooks/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    ScrollView,
    Alert,
} from 'react-native';
import { Button } from '@/components/Button';
import { Provider } from "react-native-paper";

import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';
import { ImageSelector } from '@/components/ImageSelector';
import PhotoEditIcon from '@/assets/images/PhotoEditIcon.svg';
import { reauthenticateUser, updateUserEmail, updateUserPassword } from "@/hooks/auth";
import { ReauthModal } from '@/components/ReauthModal';
import { uploadImage } from '@/hooks/functions';

export default function ManageAccountScreen() {
    const { setUserId, setUserRole, setUserInfo } = userData.getState();
    const userInfo = userData(state => state.userInfo);

    const [gpsEnabled, setGpsEnabled] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string>(userInfo?.photo);
    const [firstName, setFirstName] = useState(userInfo?.firstName || '');
    const [lastName, setLastName] = useState(userInfo?.lastName || '');
    const [address, setAddress] = useState(userInfo?.address || '');
    const [email, setEmail] = useState(userInfo?.email || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [reauthVisible, setReauthVisible] = useState(false);
    const [pendingAction, setPendingAction] = useState<() => void>(() => { });

    const router = useRouter();

    // Inside handleSubmit

    // inside handleSubmit
    const handleSubmit = async () => {
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
        }
        setLoading(true);
        if ((password && password.length > 0) || email !== userInfo?.email) {
            // prepare action after reauth
            setPendingAction(() => async (enteredPassword: string) => {
                const { success } = await reauthenticateUser(enteredPassword);
                if (!success) return;

                if (email !== userInfo?.email) {
                    await updateUserEmail(email);
                }
                if (password) {
                    await updateUserPassword(password);
                }
                Alert.alert("Success", "Account updated successfully.");
            });
            setReauthVisible(true); // open modal
        }

        let downloadUrl = "";
        if(selectedPhoto) {
            downloadUrl = await uploadImage(selectedPhoto) as string;
        }

        const userData = {
            email,
            firstName,
            lastName,
            address,
            photo: downloadUrl,
        }

        const { success, error } = await updateUserInfo(userInfo.id, userData);
        if (success) {
            setUserInfo({...userData, id: userInfo.id});
            Alert.alert("Success", "Profile updated successfully!");
        } else {
            Alert.alert("Error", error?.toString() || "Failed to update profile");
        }
        setLoading(false)
    };


    return (
        <Provider>

            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} >

                    <Header showBack={true} title='Manager Account' isCommunity={false} />
                    <RoundedView isOverlay={false} style={styles.roundedView}>
                        <ScrollView
                            contentContainerStyle={{
                                alignItems: 'center',
                                gap: 10
                            }}
                            showsVerticalScrollIndicator={false}
                            style={styles.scrollView}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
                                <View style={{ borderWidth: 1, borderRadius: 50, borderColor: 'gray' }}>
                                    <Image source={{ uri: selectedPhoto }} alt='Pick Photo' style={{ width: 100, height: 100, borderRadius: 50 }} />
                                    <View style={{ position: 'absolute', width: 30, height: 30, borderRadius: 14, padding: 5, backgroundColor: 'white', right: 0, bottom: 0 }} >
                                        <ImageSelector style={{ width: '100%', height: '100%', zIndex: 100, backgroundColor: 'transparent' }} onChangeLatestImage={setSelectedPhoto} />
                                        <PhotoEditIcon style={{ position: 'absolute', left: 4, top: 3 }} />
                                    </View>
                                </View>

                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>First Name</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter your first name"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>Last Name</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter your last name"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>Address</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter your Address"
                                    value={address}
                                    onChangeText={setAddress}
                                />
                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>Email</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter your Email"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>Password</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter Password"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <View style={styles.col}>
                                <Text style={{}}>Confirm Password</Text>
                                <TextInput
                                    style={styles.lineInput}
                                    placeholder="Enter Confirm Password"
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                            </View>

                            <View style={styles.col}>
                                <Button label='Submit' disabled={loading} loading={loading} onPress={handleSubmit} />
                            </View>
                        </ScrollView>
                    </RoundedView>
                </SafeAreaView>
            </View>
            <ReauthModal
                visible={reauthVisible}
                onClose={() => setReauthVisible(false)}
                onConfirm={async (password) => {
                    setReauthVisible(false);
                    await pendingAction(password);
                }}
            />
        </Provider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    roundedView: {
        flex: 2,
        marginTop: 20,
    },
    section: {
        width: '100%',
        gap: 8,
        paddingHorizontal: 16,
    },
    col: {
        width: '100%',
        flexDirection: 'column',
        marginTop: 10,
    },
    scrollView: {
        width: '100%',
    },
    lineInput: {
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        textAlignVertical: "top", // keeps text at the top
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 5,
        gap: 12,
    },
    firstRow: {
        marginTop: 8,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F1F3F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 24,
        height: 24,
        resizeMode: 'contain',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        color: '#2A2A2A',
        fontWeight: '600',
    },
    chevron: {
        marginLeft: 'auto',
    },
});


