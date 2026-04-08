import { useChatStore } from '@/app/store/chatsStore';
import { userData } from '@/app/store/userStore';
import { getAllUnreadCount } from '@/hooks/chatService';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const Icons = {
    'map': require('@/assets/images/Map.png'),
    'report': require('@/assets/images/Report.png'),
    'alert': require('@/assets/images/Alert.png'),
    'safety': require('@/assets/images/Safety.png'),
    'chat': require('@/assets/images/ChatIcon.png'),
    'setting': require('@/assets/images/Setting.png'),
};

const TabButton = ({ title, icon, isSelected, onPress, unreadCount }) => (
    <TouchableOpacity
        style={[styles.tabButton, isSelected && styles.selectedTab]}
        onPress={onPress}
    >
        <Image
            source={Icons[icon]}
            style={{
                width: 24,
                height: 24,
                tintColor: isSelected ? '#00D4AA' : '#999'
            }}
        />
        <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>
            {title}
        </Text>
        {unreadCount > 0 && (
                <View
                    style={{
                        position: "absolute",
                        right: 10,
                        top: 0,
                        backgroundColor: "red",
                        borderRadius: 10,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                    }}
                >
                    <Text style={{ color: "white", fontSize: 12 }}>{unreadCount}</Text>
                </View>
            )}
    </TouchableOpacity>
);

export const NavigationTabBar = ({ selectedTab, onPress }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const insets = useSafeAreaInsets();
    const userRole = userData.getState().userRole;
    const currentUserId = userData.getState().userId;
    const chats = useChatStore(state => state.chats);

    const fetchUnreadCount = async () => {
        const count = await getAllUnreadCount(currentUserId);
        setUnreadCount(count?.totalUnread);
    }

    useEffect(() => {
        fetchUnreadCount();
    }, [chats])
    return (
        <View style={[styles.bottomNav, {paddingBottom: insets.bottom}]}>
            <TabButton
                title="Map"
                icon="map"
                isSelected={selectedTab === 0}
                unreadCount={0}
                onPress={() => onPress(0)}
            />
            <TabButton
                title="Report"
                icon="report"
                isSelected={selectedTab === 1}
                unreadCount={0}
                onPress={() => onPress(1)}
            />
            <TabButton
                title="Alerts"
                icon="alert"
                isSelected={selectedTab === 2}
                unreadCount={0}
                onPress={() => onPress(2)}
            />
            <TabButton
                title="Safety"
                icon="safety"
                isSelected={selectedTab === 3}
                unreadCount={0}
                onPress={() => onPress(3)}
            />
            {userRole === 'operational' && <TabButton
                title="Chat"
                icon="chat"
                isSelected={selectedTab === 4}
                unreadCount={unreadCount}
                onPress={() => onPress(4)}
                />
            }
            <TabButton
                title="Setting"
                icon="setting"
                isSelected={selectedTab === 5}
                unreadCount={0}
                onPress={() => onPress(5)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,

        boxShadow: '0px -10px 20px rgba(0, 0, 0, 0.1)',
        // Alternative shadow properties for React Native:
        shadowColor: '#000',
        shadowOffset: {
            width: 30,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 1, // For Android shadow
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    selectedTab: {
        // Selected tab styling handled by color changes
    },
    tabText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontWeight: '500',
    },
    selectedTabText: {
        color: '#00D4AA',
    },
});