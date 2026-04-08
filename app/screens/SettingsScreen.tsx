import Forward from '@/assets/images/Forward.svg';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import ToggleButton from '@/components/ui/ToggleButton';
import { signOutUser } from '@/hooks/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Dropdown } from 'react-native-element-dropdown';
import { SafeAreaView } from 'react-native-safe-area-context';
import { userData } from '../store/userStore';
import { updateUserInfo } from '@/hooks/auth';

export default function SettingsScreen() {

    const { setUserId, setUserRole, setUserInfo, userRole, userInfo, userId } = userData.getState();
    const [gpsEnabled, setGpsEnabled] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState(userInfo?.language || 'english');
    const router = useRouter();
    const handleLogOut = async () => {
        await signOutUser();
        setUserId('');
        setUserRole('');
        router.replace('/screens/SelectRoleScreen');
    }

    const languages = [
        { label: 'English', value: 'english' },
        { label: 'Burmese', value: 'burmese' },
        { label: 'Chin dialect', value: 'chin_dialect' },
      ];

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} >

                <Header showBack={false} title='Settings' isCommunity={false} />
                <RoundedView isOverlay={false} style={styles.roundedView}>
                    <View style={styles.section}>
                        {/* GPS tracking with toggle */}
                        <View style={[styles.row, styles.firstRow]}>
                            <View style={styles.iconWrap}>
                                <Image source={require('@/assets/images/SettingLocation.png')} style={styles.icon} />
                            </View>
                            <View style={styles.rowContent}>
                                <ToggleButton
                                    isOn={gpsEnabled}
                                    onToggle={async (value) => {
                                        await updateUserInfo(userId, { ...userInfo, language: selectedLanguage, gps_traking: value })
                                        setUserInfo({ ...userInfo, language: selectedLanguage, gps_traking: value })
                                        setGpsEnabled(value);

                                    }}
                                    size='medium'
                                    label='GPS Tracking'
                                />
                            </View>
                        </View>

                        {/* Language */}
                        {/* <SettingItem
                        icon={require('@/assets/images/SettingLanguage.png')}
                        label='Language'
                    /> */}
                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', width: '100%' }}>
                            <View style={styles.iconWrap}>
                                <Image source={require('@/assets/images/SettingLanguage.png')} style={styles.icon} />
                            </View>
                            
                            {Platform.OS === 'ios' ? (
                                <Dropdown
                                    style={styles.dropdown}
                                    data={languages}
                                    labelField="label"
                                    valueField="value"
                                    placeholder="Select your preferred language"
                                    value={selectedLanguage}
                                    onChange={async (itemValue) => {
                                        console.log(itemValue);
                                        await updateUserInfo(userId, { ...userInfo, gps_traking: gpsEnabled, language: itemValue.value })
                                        setUserInfo({ ...userInfo, language: itemValue.value, gps_traking: gpsEnabled })
                                        setSelectedLanguage(itemValue)
                                    }}
                                    placeholderStyle={styles.placeholderStyle}
                                    selectedTextStyle={styles.selectedTextStyle}
                                    itemTextStyle={styles.itemTextStyle}
                                />
                            ) : (

                                <Picker
                                    dropdownIconColor={'white'}
                                    dropdownIconRippleColor={'white'}
                                    selectedValue={selectedLanguage}
                                    style={styles.picker}
                                    placeholder='Select your preferred language'
                                    onValueChange={async (itemValue) => {
                                        await updateUserInfo(userId, { ...userInfo, gps_traking: gpsEnabled, language: itemValue })
                                        setUserInfo({ ...userInfo, language: itemValue, gps_traking: gpsEnabled })
                                        setSelectedLanguage(itemValue)
                                    }
                                    }
                                >
                                    <Picker.Item label="English" value="english" />
                                    <Picker.Item label="Burmese" value="burmese" />
                                    <Picker.Item label="Chin dialect" value="chin_dialect" />
                                </Picker>
                            )

                            }
                            {/* <View style={styles.chevron}>
                                <Forward width={16} height={16} />
                            </View> */}
                        </View>


                        {/* Manage Account */}
                        {userRole !== 'community' && <SettingItem
                            icon={require('@/assets/images/SettingAccount.png')}
                            label='Manage Account'
                            onPress={() => { router.push('/screens/ManageAccountScreen') }}
                        />}

                        {/* Help Support */}
                        <SettingItem
                            icon={require('@/assets/images/SettingSupport.png')}
                            label='Help Support'
                        />

                        {/* Logout */}
                        <SettingItem
                            icon={require('@/assets/images/SettingLogout.png')}
                            label='Logout'
                            onPress={handleLogOut}
                        />
                    </View>
                </RoundedView>
            </SafeAreaView>
        </View>
    );
}

type SettingItemProps = {
    icon: any;
    label: string;
    onPress?: () => void;
};

const SettingItem: React.FC<SettingItemProps> = ({ icon, label, onPress }) => {
    return (
        <TouchableOpacity style={styles.row} activeOpacity={0.8} onPress={onPress}>
            <View style={styles.iconWrap}>
                <Image source={icon} style={styles.icon} />
            </View>
            <Text style={styles.rowLabel}>{label}</Text>
            <View style={styles.chevron}>
                <Forward width={16} height={16} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    roundedView: {
        flex: 2,
        marginTop: 20,
    },
    rowLabel: {
        flex: 1,
        fontSize: 16,
        color: '#2A2A2A',
        // fontWeight: '600',
    },
    picker: {
        flex: 1,
        fontSize: 16,
        color: '#2A2A2A',
        fontWeight: '600',
        // backgroundColor: 'blue'
    },
    dropdown: {
        flex: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
      },
      
      placeholderStyle: {
        color: '#aaa',
      },
      selectedTextStyle: {
        color: 'black',
      },
      itemTextStyle: {
        color: '#000',
      },
    section: {
        width: '100%',
        gap: 8,
        paddingHorizontal: 16,
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
    chevron: {
        marginLeft: 'auto',
    },
});


