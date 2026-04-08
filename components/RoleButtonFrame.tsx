import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type ViewProps } from 'react-native';

import Forward from '@/assets/images/Forward.svg';
import RoleButtonLogo1 from '@/assets/images/RoleButtonLogo_1.svg';
import RoleButtonLogo2 from '@/assets/images/RoleButtonLogo_2.svg';
import { useThemeColor } from '@/hooks/useThemeColor';

export type RoleButtonFrameProps = ViewProps & {
    id: string;
    lightColor?: string;
    darkColor?: string;
    isDarkMode?: boolean;
    selectedRole?: string;
    onPress: (id : string) => void;
    onLearnMorePress: (id : string) => void;
};

export function RoleButtonFrame({
    id,
    style,
    lightColor,
    darkColor,
    isDarkMode = false,
    onPress,
    selectedRole = 'community',
    onLearnMorePress,
    ...otherProps
}: RoleButtonFrameProps) {
    useThemeColor({ light: lightColor, dark: darkColor }, 'background'); // Not actually used for styles right now, but can be integrated

    return (
        <TouchableOpacity activeOpacity={0.9} style={styles.fullWidth} onPress={() => onPress(id)}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: id === selectedRole ? '#606463' : '#ffffff',
                        borderWidth: id === selectedRole ? 0 : 1,
                    },
                    style,
                ]}
                {...otherProps}
            >
                <Text style={[styles.title, { color: id === selectedRole ? 'white' : '#1C2220' }]}>
                    {id === 'community' ? 'Continue as Community User' : 'Login as Operational User'}
                </Text>
                <Text style={[styles.description, { color: id === selectedRole ? '#BABABA' : '#475467' }]}>
                    {id === 'community' ? 'For individuals and families seeking safety information and reporting hazardous areas.' : 'For trained responders supporting reporting and marking hazardous areas.'}
                </Text>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.learnMore}
                    onPress={() => onLearnMorePress(id)}
                >
                    <Text style={{ color: id === selectedRole ? 'white' : '#1C2220' }}>Learn more</Text>
                    <Forward style={styles.forwardIcon} fill={id === selectedRole ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>

                <View style={styles.logoContainer}>
                    {id === 'community' ? (
                        <RoleButtonLogo1 style={styles.logoDark} />
                    ) : (
                        <RoleButtonLogo2 style={styles.logoLight} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fullWidth: {
        width: '100%',
    },
    container: {
        width: '100%',
        padding: 18,
        paddingBottom: 25,
        flexDirection: 'column',
        borderRadius: 8,
        gap: 10,
        borderColor: '#D0D5DD',
    },
    title: {
        fontSize: 17.6,
    },
    description: {
        fontSize: 14.33,
        lineHeight: 25,
    },
    learnMore: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    forwardIcon: {
        width: 10,
        marginLeft: 10,
    },
    logoContainer: {
        position: 'absolute',
        borderRadius: 8,
        right: 0,
        bottom: 0,
        width: 400,
        height: 300,
        overflow: 'hidden',
        pointerEvents: 'none',  // Add this line
    },
    logoDark: {
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
    logoLight: {
        position: 'absolute',
        bottom: 20,
        right: 25,
    },
});
