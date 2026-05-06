
import { useReportsStore } from '@/app/store/reportsStore';
import Direction from '@/assets/images/Direction.svg';
import Layer from '@/assets/images/Layer.svg';
import Point from '@/assets/images/Point.svg';
import Setting from '@/assets/images/Setting.svg';
import { HazardSlide } from '@/components/HazardSlide';
import { HazardStatusType, HazardType, MapTypeIcons } from '@/constants/types';
import { getAddressFromLocation } from '@/hooks/functions';
import { Ionicons } from '@expo/vector-icons';
import * as Location from "expo-location";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchMap, { AddressSearchRef } from './SearchMap';
import { SimpleMapView } from './SimpleMapView';
import { getDistance, getCurrentLocation } from '@/hooks/functions';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { getReportDetailById } from '@/app/apis/reports';
const accidentLogo = require("@/assets/images/Accident_high.png");
const bonesLogo = require("@/assets/images/Bones_high.png");

const minDistance = 1000;  //unite meter;


export const MapView = () => {
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);
    const searchFieldRef = useRef<AddressSearchRef>(null);
    const { reportDetails, addReportDetail } = useReportsStore.getState();
    const [selectedLocations, setSelectedLocations] = useState<
        { latitude: number; longitude: number }[]
    >([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [currentLocation, setCurrentLocation] = useState('');
    const [filteredReports, setFilteredReports] = useState([]);
    const [showLayers, setShowLayers] = useState(false);
    const [mapType, setMapType] = useState<"standard" | "satellite" | "terrain" | "hybrid">("standard");
    const reports = useReportsStore(state => state.reports);
    const [popupReport, setPopReport] = useState(null);
    const [distance, setDistance] = useState<number>();

    const filterReports = async (
        location: { latitude: number; longitude: number }
    ) => {
        // console.log(location);
        const filteredReports: any[] = [];

        for (const report of reports) {
            if (!report.locations) continue;

            for (const loc of report.locations) {
                const distance = getDistance(
                    loc.latitude,
                    loc.longitude,
                    location.latitude,
                    location.longitude,
                    "m"
                );

                if (distance <= minDistance) {
                    // console.log("Matched distance:", distance);
                    filteredReports.push(report);
                    break; // ✅ stop checking other locations for this report
                }
            }
        }

        setFilteredReports(filteredReports as any);
    };

    const calcDistance = async () => {
        const curLoc = (await getCurrentLocation())?.coords;
        let minDistance = Number.MAX_VALUE; // start with a very large number

        for (const loc of popupReport?.locations || []) {
            const partDistance = await getDistance(
                loc.latitude,
                loc.longitude,
                curLoc?.latitude,
                curLoc?.longitude,
                "m"
            );
            // console.log(partDistance);

            if (partDistance < minDistance) {
                minDistance = partDistance;
            }
        }
        const formattedDistance = Number(minDistance.toFixed(2)); // ✅ keep 2 decimals
        // console.log("Min distance:", formattedDistance);

        setDistance(formattedDistance);
    };

    useEffect(() => {
        calcDistance();
    }, [popupReport])


    const centerMap = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        let location = await Location.getCurrentPositionAsync({});
        goToLocation(location.coords);
    };

    const goToLocation = (location: { latitude: number, longitude: number }) => {
        mapRef.current?.animateToRegion({
            ...location,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    }

    const goToFitLocation = (locations: any) => {
        if (mapRef.current && locations?.length > 0) {
            mapRef.current.fitToCoordinates(locations, {
                edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, // margin from edges
                animated: true,
            });
        }
    }
    const handleSelectedAddress = (address: any) => {
        const coords = { latitude: address.geometry.location.lat, longitude: address.geometry.location.lng };
        console.log('[MapView] handleSelectedAddress called, mapRef.current is', mapRef.current ? 'SET' : 'NULL', 'coords:', coords);
        goToLocation(coords);
    }

    const handleChangeCurrentLocation = (location: any) => {
        setCurrentLocation(location);
    }

    const handleChangeSlidePage = (report: any) => {
        const coords = report.locations?.map(loc => ({ latitude: loc.latitude, longitude: loc.longitude }))
        goToFitLocation(coords);
    }

    const hideSuggestions = () => {
        searchFieldRef?.current?.closeSuggestions()
        setShowLayers(false);
        Keyboard.dismiss();
    };

    const handleSelectedMap = async (event) => {
        handleClose()
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setSelectedLocations([{ latitude, longitude }]);

        const address = await getAddressFromLocation(latitude, longitude);

        setSelectedAddress(address);
        searchFieldRef?.current?.setDefaultQuery(address)
        filterReports({ latitude, longitude });
    }

    const handleCurrentLocation = async () => {
        // const loc = await getCurrentLocation() as any;
        // setCurrentLocation(loc?.coords);
        filterReports(currentLocation?.coords);
        mapRef.current?.animateToRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    }

    const sheetRef = useRef(null);

    // Snap points define how far the sheet can expand
    const isVillageReport = popupReport?.type === 'landmine' || popupReport?.type === 'accidents';
    const snapPoints = useMemo(() => isVillageReport ? ['45%'] : popupReport?.pickMode === 'polygon' ? ['30%'] : ['25%'], [popupReport, isVillageReport]);

    const handleOpen = useCallback(() => {
        sheetRef.current?.expand();
        // console.log(">>>>>>>>>>>")

    }, []);

    const handleClose = useCallback(() => {
        sheetRef.current?.close();
    }, []);

    const handleSelectPoint = async (report: any) => {
        const HazardInfos = reportDetails?.find(detail => detail?.id === report?.detail_id);
        if (!HazardInfos) {
            const detail = await getReportDetailById(report?.detail_id);
            addReportDetail(detail);
            setPopReport(detail);
            // console.log(detail);

        } else {
            setPopReport(HazardInfos);
            // console.log(reportDetails);
        }
        handleOpen();
    }

    useEffect(() => {
        filterReports(currentLocation?.coords);
    }, [currentLocation])

    const resetToNorth = () => {
        if (mapRef.current) {
            mapRef.current.animateCamera({
                heading: 0, // 0° = North
                pitch: 0,   // optional: reset tilt
                zoom: 15,   // keep zoom consistent
            });
        }
    };

    return (
        <TouchableWithoutFeedback onPress={hideSuggestions} accessible={false}>
            <View style={styles.container} >
                <SimpleMapView
                    ref={mapRef}
                    style={{ flex: 1, height: '100%', width: '100%' }}
                    // children={undefined}
                    onPress={handleSelectedMap}
                    // initialRegion={{
                    //     latitude: 40.7589,
                    //     longitude: -73.9851,
                    //     latitudeDelta: 0.01,
                    //     longitudeDelta: 0.01,
                    // }}
                    selectedLocations={selectedLocations}
                    selectedAddress={selectedAddress}
                    onChangeCurrentLocation={handleChangeCurrentLocation}
                    onGotoCurrentLocation={centerMap}
                    pickMode={'point'}
                    mapType={mapType}
                    onSelectPoint={handleSelectPoint}
                // showsUserLocation={true}
                />

                {/* Header with Search */}
                <View style={[styles.header, { top: insets.top + 30 }]}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#00D4AA" style={styles.searchIcon} />
                        <SearchMap onSelectedAddress={handleSelectedAddress} ref={searchFieldRef} />
                    </View>
                </View>

                {/* Map Controls */}
                <View style={[styles.mapControls, { top: insets.top + 100 }]}>
                    <View style={{ gap: 15 }}>
                        <TouchableOpacity style={[styles.controlButton, { flexDirection: 'row' }]} activeOpacity={0.8} onPress={() => setShowLayers((prev) => !prev)}>
                            <View style={styles.controlButtonInner}>
                                <Layer width={20} height={20} color="#00D4AA" />
                            </View>
                            {showLayers && (
                                <View style={styles.layerOptions}>
                                    {[
                                        { key: "standard", label: "Standard", logo: "@/ass" },
                                        { key: "satellite", label: "Satellite" },
                                        { key: "terrain", label: "Terrain" },
                                        { key: "hybrid", label: "Hybrid" },
                                    ].map((layer) => (
                                        <TouchableOpacity
                                            key={layer.key}
                                            style={styles.layerOption}
                                            onPress={() => {
                                                setMapType(layer.key as any);
                                                setShowLayers(false); // close after selecting
                                            }}
                                        >
                                            <Image source={MapTypeIcons[layer.key]} width={20} height={20} style={{ width: 30, height: 30 }} />
                                            <Text style={{ color: "#00D4AA", fontSize: 12 }}>{layer.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton} activeOpacity={0.8} onPress={resetToNorth}>
                            <View style={styles.controlButtonInner}>
                                <Direction width={20} height={20} color="#00D4AA" />
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton} activeOpacity={0.8}>
                            <View style={styles.controlButtonInner}>
                                <Setting width={20} height={20} color="#00D4AA" />
                            </View>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.controlButton} activeOpacity={0.8} onPress={handleCurrentLocation}>
                        <View style={styles.controlButtonInner}>
                            <Point width={20} height={20} color="#00D4AA" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ position: 'absolute', bottom: 0 }}>
                    <HazardSlide onPageChange={handleChangeSlidePage} reports={filteredReports} />
                </View>
                <BottomSheet
                    ref={sheetRef}
                    index={-1} // Start closed (-1 means closed)
                    snapPoints={snapPoints}
                    enablePanDownToClose={true}
                >
                    <BottomSheetView style={{
                        flex: 1,
                        padding: 20,
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: 10
                    }}>
                        {isVillageReport ? (
                            // Village pin callout (landmine or accident)
                            <>
                                <Image
                                    source={popupReport?.type === 'landmine' ? bonesLogo : accidentLogo}
                                    style={{ width: 60, height: 60, borderRadius: 8 }}
                                    resizeMode="contain"
                                />
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#D32F2F', textAlign: 'center' }}>
                                    {popupReport?.type === 'landmine' ? 'Suspected Contamination' : 'Accident Reported'}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#475467', textAlign: 'left', lineHeight: 20 }}>
                                    {popupReport?.type === 'landmine'
                                        ? 'Residents reported possible landmine and explosive ordnance (EO) contamination in this village during the 2025 community survey. The exact locations of hazardous areas are unknown. If visiting or returning, remain on well-used paths, avoid touching suspicious objects, and consult the village head or community leaders for local safety information.'
                                        : 'Landmine and UXO victims reported in this village. Landmines or UXO likely present. No marked safe paths \u2013 follow local guidance and use only well-used routes.'}
                                </Text>
                            </>
                        ) : popupReport?.pickMode === 'polygon' ? (
                            // Polygon callout
                            <>
                                <Image
                                    source={accidentLogo}
                                    style={{ width: 60, height: 60, borderRadius: 8 }}
                                    resizeMode="contain"
                                />
                                <Text style={{ fontSize: 18, fontWeight: '700', color: '#D32F2F', textAlign: 'center' }}>
                                    Warning: Hazardous Area
                                </Text>
                                <Text style={{ fontSize: 14, color: '#475467', textAlign: 'center', lineHeight: 22 }}>
                                    Known hazardous area {'\u2013'} please avoid the area immediately.
                                </Text>
                            </>
                        ) : (
                            // Existing report callout (point/path)
                            <>
                                <Text style={{ fontSize: 16, fontWeight: '700', width: '100%', textAlign: 'center' }}>{popupReport?.userRole === 'operational' ? "Avoid area immediately" : "Community-Reported Suspected Contamination"}</Text>

                                {popupReport?.images?.length > 0 ? (
                                    // Has uploaded photo → show photo + text side by side
                                    <View style={{ width: '100%', flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
                                        <Image
                                            source={{ uri: popupReport.images[0] }}
                                            style={{
                                                width: '45%',
                                                aspectRatio: 1,
                                                borderRadius: 8,
                                            }}
                                            resizeMode="cover"
                                        />
                                        <View style={{ flexDirection: 'column', gap: 5, width: '50%' }}>
                                            <View style={styles.textRow}>
                                                <Text style={{ fontSize: 12 }}>Status:</Text>
                                                <Text style={{ fontSize: 12, paddingLeft: 3, color: '#00D4AA' }}>{HazardStatusType[popupReport?.classification?.toLowerCase()]}</Text>
                                            </View>
                                            <View style={styles.textRow}>
                                                <Text style={{ fontSize: 12 }}>Hazard Type:</Text>
                                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{HazardType[popupReport?.type]}</Text>
                                            </View>
                                            <View style={styles.textRow}>
                                                <Text style={{ fontSize: 12 }}>Reported On:</Text>
                                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{new Date(popupReport?.createdAt).toLocaleDateString()}</Text>
                                            </View>
                                            <View style={styles.textRow}>
                                                <Text style={{ fontSize: 12 }}>Distance:</Text>
                                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{!distance ? 'Calculating...' : distance === Number.MAX_VALUE ? 'So far' : `${distance} m`}</Text>
                                            </View>
                                            <View style={styles.textRow}>
                                                <Text style={{ fontSize: 12 }}>Reported by:</Text>
                                                <Text style={{ fontSize: 12, paddingLeft: 3 }}>{popupReport?.userRole === 'community' ? "Community User" : "Operational User"}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ) : (
                                    // No photo → show text only (full width)
                                    <View style={{ width: '100%', gap: 5 }}>
                                        <View style={styles.textRow}>
                                            <Text style={{ fontSize: 12 }}>Status:</Text>
                                            <Text style={{ fontSize: 12, paddingLeft: 3, color: '#00D4AA' }}>{HazardStatusType[popupReport?.classification?.toLowerCase()]}</Text>
                                        </View>
                                        <View style={styles.textRow}>
                                            <Text style={{ fontSize: 12 }}>Hazard Type:</Text>
                                            <Text style={{ fontSize: 12, paddingLeft: 3 }}>{HazardType[popupReport?.type]}</Text>
                                        </View>
                                        <View style={styles.textRow}>
                                            <Text style={{ fontSize: 12 }}>Reported On:</Text>
                                            <Text style={{ fontSize: 12, paddingLeft: 3 }}>{new Date(popupReport?.createdAt).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={styles.textRow}>
                                            <Text style={{ fontSize: 12 }}>Distance:</Text>
                                            <Text style={{ fontSize: 12, paddingLeft: 3 }}>{!distance ? 'Calculating...' : distance === Number.MAX_VALUE ? 'So far' : `${distance} m`}</Text>
                                        </View>
                                        <View style={styles.textRow}>
                                            <Text style={{ fontSize: 12 }}>Reported by:</Text>
                                            <Text style={{ fontSize: 12, paddingLeft: 3 }}>{popupReport?.userRole === 'community' ? "Community User" : "Operational User"}</Text>
                                        </View>
                                    </View>
                                )}
                                <View style={{ width: '100%' }}>
                                    <Text style={{ fontSize: 16, textAlign: 'left', width: '100%' }}>Description:</Text>
                                    <Text style={{ marginRight: 'auto', fontSize: 13, fontWeight: '500', color: '#475467' }}>{popupReport?.description ? popupReport?.description : "No Description"}</Text>
                                </View>
                            </>
                        )}
                    </BottomSheetView>
                </BottomSheet>
            </View >
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: '100%',
        width: '100%',
    },
    map: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    autocompleteContainer: {
        position: "absolute",
        top: 40,
        left: 10,
        right: 10,
        zIndex: 1,
    },
    input: {
        height: 44,
        backgroundColor: "#fff",
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    suggestions: {
        backgroundColor: "white",
        marginTop: 2,
        borderRadius: 6,
        maxHeight: 150,
    },
    suggestionItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    header: {
        position: 'absolute',
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        width: '100%',

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
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },

    gridRow: {
        flexDirection: 'row',
        height: '5%',
    },
    gridCell: {
        flex: 1,
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    streetLabel: {
        position: 'absolute',
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255,0.8)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    hazardZone: {
        position: 'absolute',
        top: '40%',
        left: '35%',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 68, 68, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255, 68, 68, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    hazardMarkerFallback: {
        width: 32,
        height: 32,
        backgroundColor: '#FF4444',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userLocationFallback: {
        position: 'absolute',
        bottom: '45%',
        left: '25%',
        width: 16,
        height: 16,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    userMarkerInner: {
        width: 6,
        height: 6,
        backgroundColor: 'white',
        borderRadius: 3,
    },
    mapControls: {
        position: 'absolute',
        right: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: 'column',
        display: 'flex',
        height: 500,
        paddingBottom: 120,
        paddingTop: 20,
        marginLeft: 'auto'
    },
    controlButton: {
        width: 50,
        height: 50,
    },
    controlButtonInner: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 20px 20px rgba(0, 0, 0, 0.1)',
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
    locationLabel: {
        position: 'absolute',
        top: '35%',
        left: '45%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    locationLabelText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
        marginLeft: 4,
    },
    layerOptions: {
        position: "absolute",
        width: 'auto',
        flexDirection: 'row',
        right: 60,   // appear to the right of button
        top: -8,
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        flex: 1,
    },
    layerOption: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    textRow: {
        marginRight: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
});