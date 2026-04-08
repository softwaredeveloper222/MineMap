import { useReportsStore } from "@/app/store/reportsStore";
import { HazardCard } from '@/components/HazardCard';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import React, { useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HazardInfos = [
    {
        id: 1,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    },
    {
        id: 2,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    },
    {
        id: 3,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    },
    {
        id: 4,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    },
    {
        id: 5,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    },
    {
        id: 6,
        latitude: 40.7589,
        longitude: -73.9851,
        title: "3 Birrel Avenue",
        description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
        status: "Confirmed"
    }
];


export default function AlertsScreen() {
    const { reports } = useReportsStore();

    // Use store data if available, otherwise fall back to static list
    const data = reports?.length > 0 ? reports : HazardInfos;

    const renderItem = useCallback(
        ({ item }) => (
            <HazardCard
                data={item}
                style={{ width: '90%', alignSelf: 'center' }}
            />
        ),
        []
    );
    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} >

                <Header showBack={false} title='Alerts' isCommunity={false} />
                <RoundedView isOverlay={false} style={styles.roundedView}>
                    <FlatList
                    style={{width: '100%'}}
                        data={data}
                        renderItem={renderItem}
                        keyExtractor={(item) => item?.id?.toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            alignItems: 'center',
                            paddingVertical: 20,
                            gap: 10,
                        }}
                        ListEmptyComponent={() => (
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: 'gray',
                                    textAlign: 'center',
                                    marginTop: 20,
                                }}
                            >
                                There are no reports
                            </Text>
                        )}
                        initialNumToRender={5}
                        maxToRenderPerBatch={10}
                        windowSize={10}
                        removeClippedSubviews
                    />
                </RoundedView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    roundedView: {
        flex: 2,
        gap: 10,
        padding: 0,
        marginTop: 20,
        paddingVertical: 20
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
    },
    scrollView: {
        width: '100%',
    },
});