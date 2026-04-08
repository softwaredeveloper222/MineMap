import MapScreen from '@/app/screens/MapScreen';
import { NavigationTabBar } from '@/components/NavigationTabBar';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList } from 'react-native';

import { useReportsStore } from '@/app/store/reportsStore';
import { listenChats } from "@/hooks/chatService";
import {
    StyleSheet,
    View
} from 'react-native';
import { getReports } from '../apis/reports';
import { useChatStore } from '../store/chatsStore';
import { userData } from '../store/userStore';
import AlertsScreen from './AlertsScreen';
import HazardSafetyScreen from './HazardSafetyScreen';
import MessagesListScreen from './MessagesListScreen';
import ReportHazardScreen from './ReportHazardScreen';
import SettingsScreen from './SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_REPORTS_COUNT, REPORTS_KEY } from '@/constants/types';
import Spinner from '@/components/ui/Spinner';


// import * as Notifications from "expo-notifications";

const tabs = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 }
]
// Simple Map Component (fallback when native maps aren't available)
const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const [selectedTab, setSelectedTab] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { setReports, reports } = useReportsStore.getState()
    const router = useRouter();
    const userId = userData.getState().userId;
    const userRole = userData.getState().userRole;
    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
    const { setChats } = useChatStore.getState();
    const [loading, setLoading] = useState(true);

    // const [expoPushToken, setExpoPushToken] = useState("");

    // useEffect(() => {
    //   registerForPushNotificationsAsync().then((token) =>{
    //     console.log(token);
    //     setExpoPushToken(token ?? "")}
    //   );

    //   const subscription = Notifications.addNotificationReceivedListener(
    //     (notification) => {
    //       console.log("Notification received:", notification);
    //     }
    //   );

    //   return () => subscription.remove();
    // }, []);


    const fetchReports = async () => {
        setLoading(true);
        // const storageReportsCount = JSON.parse(await AsyncStorage.getItem(CURRENT_REPORTS_COUNT));

        // if(!storageReportsCount) {
            const reports = await getReports(userId);
            AsyncStorage.clear();
            AsyncStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
            AsyncStorage.setItem(CURRENT_REPORTS_COUNT, JSON.stringify(reports?.length))
            setReports(reports);
            console.log('reports');
        // } else {
            // if(reports?.length <= 0) {
                // const storageReports = JSON.parse(await AsyncStorage.getItem(REPORTS_KEY));
                // setReports(storageReports);
            // }
        // }
        setLoading(false);
    }

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const onPressContinue = (index: number) => {
        setSelectedTab(index);
        flatListRef.current?.scrollToIndex({ index: index, animated: true });
    }

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        const unsubscribe = listenChats(userId, setChats);
        return unsubscribe;
    }, []);

    return (
        <View style={styles.container}>
            {loading ? <View style={{flex: 1}}>
                <Spinner color='gray' />
            </View> : <FlatList
                ref={flatListRef}
                data={tabs}
                pagingEnabled
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                    switch (item.id) {
                        case 1:
                            return <View style={{ width: width, display: 'flex' }}><MapScreen /></View>
                        case 2:
                            return <View style={{ width: width, display: 'flex' }}><ReportHazardScreen /></View>
                        case 3:
                            return <View style={{ width: width, display: 'flex' }}><AlertsScreen /></View>
                        case 4:
                            return <View style={{ width: width, display: 'flex' }}><HazardSafetyScreen /></View>
                        case 5:
                            { return userRole === 'operational' ? <View style={{ width: width, display: 'flex' }}><MessagesListScreen /></View> : '' }
                        case 6:
                            return <View style={{ width: width, display: 'flex' }}><SettingsScreen /></View>
                    }
                }}
                horizontal
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewConfig}
                scrollEnabled={false}

            />}
            <NavigationTabBar selectedTab={selectedTab} onPress={onPressContinue} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,        // justifyContent: 'space-between',
    },
    safeContainer: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
    },
});