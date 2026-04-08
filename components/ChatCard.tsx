import { useChatStore } from '@/app/store/chatsStore';
import { userData } from '@/app/store/userStore';
import { getUnreadCount } from "@/hooks/chatService";
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export const ChatCard = ({ id, data, style }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const { chats } = useChatStore.getState();
    const currentUserId = userData.getState().userId;

    // console.log(">>>>>>>>>>>>>>>", data);

    const currentChat = chats?.find(chat => chat.id === id);

    const to_user_id = id?.split('_')?.find((userId) => userId !== currentUserId && userId !== data?.hazardId)

    const onPress = async () => {
        router.push(`/screens/MessagesScreen?to_user_id=${to_user_id}&hazard_id=${data?.hazardId}`)
    }

    const fetchUnreadCount = async () => {
        const count = await getUnreadCount(data?.id, currentUserId);
        setUnreadCount(count);
    }

    useEffect(() => {
        fetchUnreadCount();
    }, [data])

    return (
        <TouchableOpacity style={[style, { width: '100%', borderBottomWidth: 0.5, borderColor: 'gray', paddingBottom: 10 }]} activeOpacity={0.7} onPress={onPress}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 20, }}>
                <View style={{ width: 60, height: 60, flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={{ uri: 'https://picsum.photos/300/200' }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                    />
                </View>
                <View style={{ flexDirection: 'column', flex: 1 }}>
                    <Text style={{ fontWeight: 900, fontSize: 15 }}>{data?.participants}</Text>
                    <Text style={{ fontWeight: 500, fontSize: 12, color: '#c3c3c3' }}>{data?.lastMessage}</Text>
                </View>
                <View style={{ flexDirection: 'column', height: '100%', paddingVertical: 10 }}>
                    <Text style={{ fontWeight: 500, fontSize: 12, color: '#c3c3c3' }}>{ }</Text>
                </View>
            </View>
            {unreadCount > 0 && (
                <View
                    style={{
                        position: "absolute",
                        right: 10,
                        top: -5,
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
}
