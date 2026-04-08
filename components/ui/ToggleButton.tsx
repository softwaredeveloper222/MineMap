import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const ToggleButton = ({
    isOn = false,
    onToggle,
    size = 'medium',
    activeColor = '#10B981',
    inactiveColor = '#D1D5DB',
    disabled = false,
    label = ''
}) => {
    const [toggled, setToggled] = useState(isOn);
    const animatedValue = useRef(new Animated.Value(isOn ? 1 : 0)).current;

    const sizes = {
        small: { width: 40, height: 22, circle: 18 },
        medium: { width: 50, height: 28, circle: 24 },
        large: { width: 60, height: 34, circle: 30 }
    };

    const currentSize = sizes[size];

    useEffect(() => {
        setToggled(isOn);
        Animated.timing(animatedValue, {
            toValue: isOn ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isOn]);

    const handleToggle = () => {
        if (disabled) return;

        const newValue = !toggled;
        setToggled(newValue);

        Animated.timing(animatedValue, {
            toValue: newValue ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();

        onToggle && onToggle(newValue);
    };

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveColor, activeColor],
    });

    const circleTranslateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, currentSize.width - currentSize.circle - 2],
    });

    return (
        <View style={{width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <Text style={{fontSize: 16, maxWidth: '85%'}}>{label}</Text>
            <TouchableOpacity
                activeOpacity={disabled ? 1 : 0.8}
                onPress={handleToggle}
                style={[
                    styles.container,
                    {
                        width: currentSize.width,
                        height: currentSize.height,
                        opacity: disabled ? 0.5 : 1,
                    }
                ]}
            >
                <Animated.View
                    style={[
                        styles.track,
                        {
                            backgroundColor,
                            width: currentSize.width,
                            height: currentSize.height,
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.circle,
                            {
                                width: currentSize.circle,
                                height: currentSize.circle,
                                transform: [{ translateX: circleTranslateX }],
                            }
                        ]}
                    />
                </Animated.View>
            </TouchableOpacity>
        </View>

    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    track: {
        borderRadius: 50,
        justifyContent: 'center',
        position: 'relative',
    },
    circle: {
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        position: 'absolute',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    demoContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#111827',
    },
    section: {
        marginBottom: 30,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        // fontWeight: '600',
        marginBottom: 15,
        color: '#374151',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 15,
    },
    column: {
        gap: 10,
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        minWidth: 60,
    },
    status: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'monospace',
    },
});

export default ToggleButton;