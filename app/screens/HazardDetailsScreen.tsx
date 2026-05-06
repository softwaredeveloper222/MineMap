import { Button } from '@/components/Button';
import { RoundedView } from '@/components/RoundedView';
import { Header } from '@/components/ui/Header';
import { HazardStatusType, HazardType } from '@/constants/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportsStore } from '../store/reportsStore';
import { getCurrentLocation, getDistance } from '@/hooks/functions';
// const HazardInfos = [
//     {
//         id: 1,
//         latitude: 40.7589,
//         longitude: -73.9851,
//         title: "3 Birrel Avenue",
//         description: "A landmine was identified near the sidewalk edge. Please avoid this area and follow safe detour routes.",
//         status: "Confirmed"
//     },
// ];


export default function HazardDetailsScreen() {
    const router = useRouter();
    const { reportDetails } = useReportsStore.getState();
    const { id, hazard_id } = useLocalSearchParams<{ id: string, hazard_id: string }>();
    const [distance, setDistance] = useState<number>();
    const HazardInfos = reportDetails?.find(detail => detail?.id === id);
    const hazardType = HazardInfos?.type;
    // console.log(hazard_id);
    const hazardTypeImage = hazardType === "landmine" ? require('../../assets/images/Bones_detail_high.png') : require('../../assets/images/Accident_detail_high.png');
    const calcDistance = async () => {
        try {
            const locations = HazardInfos?.locations;
            if (!Array.isArray(locations) || locations.length === 0) {
                setDistance(NaN);
                return;
            }

            const curLoc = (await getCurrentLocation())?.coords;
            const myLat = Number(curLoc?.latitude);
            const myLon = Number(curLoc?.longitude);
            if (!Number.isFinite(myLat) || !Number.isFinite(myLon)) {
                setDistance(NaN);
                return;
            }

            let minDistance = Number.POSITIVE_INFINITY;
            for (const loc of locations) {
                const lat = Number(loc?.latitude);
                const lon = Number(loc?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

                const partDistance = getDistance(lat, lon, myLat, myLon, "m");
                if (Number.isFinite(partDistance) && partDistance < minDistance) {
                    minDistance = partDistance;
                }
            }

            if (!Number.isFinite(minDistance)) {
                setDistance(NaN);
                return;
            }

            setDistance(Number(minDistance.toFixed(2)));
        } catch (error) {
            console.warn("calcDistance failed:", error);
            setDistance(NaN);
        }
    };


    useEffect(() => {
        calcDistance();
    }, [HazardInfos])

    const onChatPress = () => {
        router.push(`/screens/MessagesScreen?to_user_id=${HazardInfos?.userId}&hazard_id=${hazard_id}`);
    }
    return (
        <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            <Header title='Hazard Details' isCommunity={false} />
            <RoundedView isOverlay={false} style={styles.roundedView}>
                <View style={{ width: '100%', height: '100%', gap: 20 }}>
                    <View style={styles.scrollContainer}>
                        <ScrollView
                            contentContainerStyle={{
                                alignItems: 'center',
                                gap: 10,
                                paddingBottom: 30,
                            }}
                            showsVerticalScrollIndicator={false}
                            style={styles.scrollView}
                        >
                            {HazardInfos?.images && HazardInfos?.images.length > 0 ? (
                                <Image
                                    source={{ uri: HazardInfos.images[0] }}
                                    style={styles.image}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.image,
                                        {justifyContent: 'center', alignItems: 'center' },
                                    ]}
                                >
                                    <Image
                                        source={hazardTypeImage} // your logo here
                                        style={{ width: '100%', height: '100%', resizeMode: 'cover'}}
                                    />
                                </View>
                            )}
                            {/* <Text style={{ marginRight: 'auto', fontSize: 16, fontWeight: 700 }}>{HazardType[HazardInfos?.type]}</Text> */}
                            <Text style={{ marginRight: 'auto', fontSize: 16, fontWeight: 700 }}>{"Explosive Ordnance Accident"}</Text>
                            <View style={styles.locationContainer}>
                                {HazardInfos?.locations && HazardInfos?.locations?.length > 0 && HazardInfos?.locations?.map((location, index) =>
                                    <View key={`${location.latitude},${location.longitude}-${index}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="location" size={12} color="#00D4AA" />
                                        <Text style={styles.locationText}>{location.address}</Text>
                                    </View>)
                                }
                            </View>
                            <Text style={{ marginRight: 'auto', fontSize: 14, fontWeight: 700 }}>Avoid area immediately</Text>
                            <Text style={{ marginRight: 'auto', fontSize: 16, fontWeight: 500, color: '#475467' }}>{HazardInfos?.description}</Text>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Status:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3, color: '#00D4AA' }}>{HazardStatusType[HazardInfos?.classification.toLowerCase()]}</Text>
                            </View>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Reported On:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{new Date(HazardInfos?.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Hazard Type:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{HazardType[HazardInfos?.type]}</Text>
                            </View>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Distance:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{
                                    distance === undefined
                                        ? 'Calculating...'
                                        : Number.isNaN(distance)
                                            ? 'Location unavailable'
                                            : `${distance} m`
                                }</Text>
                            </View>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Visibility:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{HazardInfos?.visibleToOther ? "Visible to others" : "Not visible to others"}</Text>
                            </View>
                            <View style={styles.textRow}>
                                <Text style={{ fontSize: 12 }}>Reported by:</Text>
                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{HazardInfos?.userRole === 'community' ? "Community user" : "Operational User"}</Text>
                            </View>

                        </ScrollView>
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button label='Chat with reporter user' onPress={onChatPress} />
                    </View>
                </View>
            </RoundedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    roundedView: {
        flex: 1,
        gap: 10,
        marginTop: 20,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
    },
    scrollView: {
    },
    image: {
        width: '100%',
        height: 220,
        borderRadius: 8,
        overflow: 'hidden',
    },
    locationContainer: {
        flexDirection: 'column',
        marginRight: 'auto'
    },
    locationText: {
        fontSize: 12,
        color: '#00D4AA',
        marginLeft: 2,
        fontWeight: '500',
    },
    textRow: {
        marginRight: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    scrollContainer: {
        flex: 1,
        // maxHeight: '90%'
    },
    buttonContainer: {
        width: '100%',
    }
});