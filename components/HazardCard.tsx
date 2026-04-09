import { getReportDetailById } from '@/app/apis/reports';
import { useChatStore } from '@/app/store/chatsStore';
import { useReportsStore } from '@/app/store/reportsStore';
import { userData } from '@/app/store/userStore';
import { HazardStatusType, HazardType } from '@/constants/types';
import { getChatId, getUnreadCount } from '@/hooks/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export const HazardCard = ({ data, style }) => {
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();
    const { reportDetails, addReportDetail } = useReportsStore.getState();
    const currentUserId = userData.getState().userId;

    const chatId = getChatId(currentUserId, data?.userId, data?.id);
    const chats = useChatStore(state => state.chats);

    const coverImage = data?.coverImage;
    const hazardType = data?.type;
    const hazardTypeImage = hazardType === "landmine" ? require('../assets/images/Bones_high.png') : require('../assets/images/Accident_high.png');
    // console.log(coverImage);

    const fetchUnreadCount = async () => {
        const count = await getUnreadCount(chatId, currentUserId);
        setUnreadCount(count);
    }

    useEffect(() => {
        fetchUnreadCount();
    }, [chats])

    const onPress = async () => {
        const existHazardDetail = reportDetails?.find(detail => detail?.id === data.detail_id);

        if (existHazardDetail)
            router.push(`/screens/HazardDetailsScreen?id=${data?.detail_id}&hazard_id=${data?.id}`);
        else {
            setLoading(true);
            const detail = await getReportDetailById(data?.detail_id);
            addReportDetail(detail);
            setLoading(false);
            router.push(`/screens/HazardDetailsScreen?id=${data?.detail_id}&hazard_id=${data?.id}`);
        }
    }

    return (
        <TouchableOpacity style={[styles.alertCard, style]} activeOpacity={0.7} onPress={onPress}>
            <View style={styles.alertContent}>
                <View style={styles.alertImageContainer}>
                    {coverImage ? (
                        <Image source={{ uri: coverImage }} style={styles.image} />
                    ) : (
                        <View
                            style={[
                                styles.image,
                                { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
                            ]}
                        >
                            {<Image
                                source={hazardTypeImage} // your logo
                                style={{ width: '100%', height: '100%', resizeMode: 'cover'}}
                            />}
                        </View>
                    )}
                </View>
                <View style={styles.alertInfo}>
                    <View style={styles.alertHeader}>
                        {/* <Text style={styles.alertTitle}>{HazardType[data?.type]}</Text> */}
                        <Text style={styles.alertTitle}>{"Explosive Ordnance Accident"}</Text>
                    </View>
                    <View style={styles.locationContainer}>
                        {data?.locations && data?.locations?.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location" size={12} color="#00D4AA" />
                            <Text style={styles.locationText} numberOfLines={1}>{data?.locations[0].address}</Text>
                        </View>}
                        {/* {data?.locations?.map(location => {
                            return (<View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="location" size={12} color="#00D4AA" />
                                <Text style={styles.locationText}>{location?.address}</Text>
                            </View>)
                        })} */}
                    </View>
                    <Text style={styles.alertDescription} numberOfLines={2}>
                        {data?.description}
                    </Text>
                    <View style={styles.statusContainer}>
                        <Text style={styles.statusLabel}>Status: </Text>
                        <Text style={styles.statusConfirmed}>{HazardStatusType[data?.status?.toLowerCase()]}</Text>
                    </View>
                </View>
            </View>
            {unreadCount > 0 && (
                <View
                    style={{
                        position: "absolute",
                        right: 10,
                        top: 10,
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

const styles = StyleSheet.create({

    alertCard: {
        height: 150,
        width: 350,
        marginTop: 'auto',
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 6,
        flexDirection: 'row',
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
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
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    alertContent: {
        flex: 1,
        flexDirection: 'row',
    },
    alertImageContainer: {
        width: 140,
        // alignItems: 'center',
        marginRight: 12,
        borderRadius: 8,
        height: '100%',
        justifyContent: 'center'

    },
    alertImagePlaceholder: {
        width: 60,
        height: 60,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertImageRightContainer: {
        marginLeft: 12,
    },
    alertInfo: {
        flex: 1,
        paddingRight: 10,
    },
    alertHeader: {
        marginBottom: 4,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    locationContainer: {
        flexDirection: 'column',
    },
    locationText: {
        fontSize: 12,
        color: '#00D4AA',
        marginLeft: 2,
        fontWeight: '500',
    },
    alertDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 6,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 'auto'
    },
    statusLabel: {
        fontSize: 12,
        color: '#999',
    },
    statusConfirmed: {
        fontSize: 12,
        color: '#00D4AA',
        fontWeight: '500',
    },
});

