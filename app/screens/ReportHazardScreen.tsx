import AddressSearchIcon from '@/assets/images/AddressSearchIcon.svg';
import LocationSearchIcon from '@/assets/images/LocationSearchIcon.svg';
import MapPathIcon from '@/assets/images/MapPath.svg';
// import MapPointerIcon from '@/assets/images/MapPointer.png';
import MapPolygonIcon from '@/assets/images/MapPoligon.svg';
import { Button } from '@/components/Button';
import { ImageSelector } from '@/components/ImageSelector';
import { RoundedView } from '@/components/RoundedView';
import SearchMap, { AddressSearchRef } from '@/components/SearchMap';
import { SimpleMapView, PickMode } from '@/components/SimpleMapView';
import { Header } from '@/components/ui/Header';
import { LogoButton } from '@/components/ui/LogoButton';
import ToggleButton from '@/components/ui/ToggleButton';
import { getAddressFromLocation } from '@/hooks/functions';
import { Ionicons } from '@expo/vector-icons';
import { Provider } from "react-native-paper";
import Point from '@/assets/images/Point_white.svg';


import LocationPicker, { LocationSearchRef } from '@/components/LocationPicker';
import React, { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReports, saveReport } from '../apis/reports';
import { useReportsStore } from '../store/reportsStore';
import { userData } from '../store/userStore';

export default function ReportHazardScreen() {
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [text, setText] = useState('');
    const [visibleOtherToggle, setVisibleOtherToggle] = useState(false);
    const [contactedNeededToggle, setContactedNeededToggle] = useState(false);
    const [selectedHazardType, setSelectedHazardType] = useState('landmine');
    const [selectedClassification, setSelectedClassification] = useState('suspected');
    const [community, setCommunity] = useState('');
    const [landmark, setLandmark] = useState('');
    const [phone, setPhone] = useState('');
    const [shaToggle, setShaToggle] = useState(false);
    const [chaToggle, setChaToggle] = useState(false);
    const [searchMode, setSearchMode] = useState('address');
    const userRole = userData.getState().userRole;
    const userId = userData.getState().userId;
    const mapRef = useRef(null);
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [selectedLocations, setSelectedLocations] = useState<
        { latitude: number; longitude: number }[]
    >([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [pickMode, setPickMode] = useState<PickMode>('point');
    const { addReport, setReports } = useReportsStore.getState();
    const searchFieldRef = useRef<AddressSearchRef>(null);
    const locationSearchFieldRef = useRef<LocationSearchRef>(null);
    const imageSelectorRef = useRef<{ resetImages: () => void }>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const descriptionYRef = useRef(0);
    const [loading, setLoading] = useState(false);

    const handleDescriptionFocus = () => {
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: Math.max(0, descriptionYRef.current - 20), animated: true });
        }, 250);
    };

    const resetForm = () => {
        setSelectedImages([]);
        setText('');
        setVisibleOtherToggle(false);
        setContactedNeededToggle(false);
        setSelectedHazardType('');
        setSelectedClassification('');
        setCommunity('');
        setLandmark('');
        setPhone('');
        setShaToggle(false);
        setChaToggle(false);
        setSelectedLocations([]);
        setSelectedAddress(null);
        imageSelectorRef.current?.resetImages();
        searchFieldRef.current?.clearInput();
        locationSearchFieldRef.current?.clearInputs();
    };

    const hideSuggestions = () => {
        searchFieldRef?.current?.closeSuggestions()
    };

    const handleDragEnd = async (index: number, coordinate: any) => {
        setSelectedLocations((prev) => {
            const newLocations = [...prev];
            newLocations[index] = { latitude: coordinate.latitude, longitude: coordinate.longitude };
            return newLocations;
        });

        if (pickMode === 'point') {
            const address = await getAddressFromLocation(coordinate.latitude, coordinate.longitude);
            setSelectedAddress(address);
            searchFieldRef?.current?.setDefaultQuery(address);
        }
    }

    const handleSelectedMap = async (event) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        if (pickMode === 'point') setSelectedLocations([]);
        setSelectedLocations((prev) => [...prev, { latitude, longitude }]);

        const address = await getAddressFromLocation(latitude, longitude);

        setSelectedAddress(address);
        searchFieldRef?.current?.setDefaultQuery(address)

    }

    const handleSelectedAddress = (address: any) => {
        const coords = { latitude: address.geometry.location.lat, longitude: address.geometry.location.lng };
        console.log('[ReportHazardScreen] handleSelectedAddress called, mapRef.current is', mapRef.current ? 'SET' : 'NULL', 'coords:', coords);
        mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        if (pickMode === 'point') setSelectedLocations([]);
        setSelectedLocations((prev) => [...prev, coords]);
    }

    const handleSelectedLocation = (location: any) => {
        const coords = { latitude: location.lat, longitude: location.lng };
        mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        if (pickMode === 'point') setSelectedLocations([]);
        setSelectedLocations((prev) => [...prev, coords]);
        // console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> : \n", address.geometry)
    }

    const handleToolClick = (id: PickMode) => {
        setSelectedLocations([]);
        // console.log(id);
        setPickMode(id);
    }

    const fetchReports = async () => {
        const reports = await getReports(userId);
        setReports(reports);
    }

    const handleSubmit = async () => {
        setLoading(true);
        if(selectedLocations.length === 0) {
            Alert.alert("MineMap Report", "Please select a location");
            setLoading(false);
            return;
        }

        const locations = await Promise.all(
            selectedLocations.map(async (location) => ({
                ...location,
                address: await getAddressFromLocation(location.latitude, location.longitude) || "",
            }))
        );

        if(locations.length === 0) {
            Alert.alert("MineMap Report", "Please select a location");
            setLoading(false);
            return;
        }

        const report = {
            locations: locations,
            images: selectedImages,
            type: selectedHazardType,
            classification: selectedClassification,
            description: text,
            community: community,
            landmark: landmark,
            visibleToOther: visibleOtherToggle,
            contactedNeeded: contactedNeededToggle,
            phone: phone,
            sha: shaToggle,
            cha: chaToggle,
            pickMode: pickMode
        }
        const addedReport = await saveReport(report, userRole, userId);
        resetForm();
        // fetchReports();
        addReport(addedReport);
        setLoading(false);
        Alert.alert("MineMap Report", "Report uploaded successfully")
    }

    const onChangeSearchMode = (mode: string) => {
        // console.log(mode);
        setSearchMode(mode);
    }

    const handleChangeCurrentLocation = (location: any) => {
        setCurrentLocation(location);
    }

    const handleCurrentLocation = () => {
        mapRef.current?.animateToRegion({
            latitude: currentLocation?.coords?.latitude,
            longitude: currentLocation?.coords?.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
    }

    return (
        <Provider>
            <View style={styles.container}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']} >
                    <Header showBack={false} title='Report Hazard' isCommunity={false} />
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                    <RoundedView isOverlay={false} style={styles.roundedView}>
                        <ScrollView
                            ref={scrollViewRef}
                            contentContainerStyle={{
                                alignItems: 'center',
                            }}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            style={styles.scrollView}
                        >
                            <TouchableWithoutFeedback onPress={hideSuggestions} accessible={false}>
                                <View style={styles.scrollView}>
                                    <View style={styles.col}>
                                        <View style={{ flexDirection: 'row', width: '100%', marginBottom: 5 }}>
                                            <Text style={styles.boldText}>Location</Text>
                                            <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
                                                <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 1000, backgroundColor: 'rgb(156, 156, 156)', flexDirection: 'row', gap: 7 }}>
                                                    <AddressSearchIcon width={20} height={20} onPress={() => onChangeSearchMode('address')} fill={searchMode === 'address' ? 'white' : 'black'} />
                                                    <LocationSearchIcon width={20} height={20} onPress={() => onChangeSearchMode('location')} fill={searchMode === 'location' ? 'white' : 'black'} />
                                                </View>
                                            </View>
                                        </View>
                                        {searchMode === 'address' && <View style={styles.searchContainer}>
                                            <Ionicons name="search" size={20} color="#00D4AA" style={styles.searchIcon} />
                                            <SearchMap onSelectedAddress={handleSelectedAddress} ref={searchFieldRef} />
                                        </View>}
                                        {searchMode === 'location' && <LocationPicker ref={locationSearchFieldRef} onSelectedLocation={handleSelectedLocation} />}
                                    </View>
                                    <View style={styles.col}>
                                        <SimpleMapView
                                            ref={mapRef}
                                            style={{ flex: 1, height: 250, width: '100%' }}
                                            children={undefined}
                                            initialRegion={{
                                                latitude: 40.7589,
                                                longitude: -73.9851,
                                                latitudeDelta: 0.01,
                                                longitudeDelta: 0.01,
                                            }}
                                            onPress={handleSelectedMap}
                                            selectedLocations={selectedLocations}
                                            selectedAddress={selectedAddress}
                                            onChangeCurrentLocation={handleChangeCurrentLocation}
                                            // showsUserLocation={true}
                                            onSelectPoint={() => { }}
                                            pickMode={pickMode}
                                            onDragEnd={handleDragEnd}
                                        />
                                        <View style={styles.toolContainer}>
                                            <TouchableOpacity style={[styles.tool, { backgroundColor: `rgba(0, 0, 0, 0.5)` }]} activeOpacity={0.8} onPress={handleCurrentLocation}>
                                                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                                    <Point width={20} height={20} fill="#fff" />
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.tool, { backgroundColor: `rgba(0, 0, 0, ${pickMode === 'point' ? 0.6 : 0.4})` }]} activeOpacity={0.8} onPress={() => handleToolClick('point')}><Image source={require('../../assets/images/MapPointer.png')} resizeMode='contain' width={30} height={30} style={{ width: 25, height: 25 }} /></TouchableOpacity>
                                            <TouchableOpacity style={[styles.tool, { backgroundColor: `rgba(0, 0, 0, ${pickMode === 'path' ? 0.6 : 0.4})` }]} activeOpacity={0.8} onPress={() => handleToolClick('path')}><Image source={require('../../assets/images/MapPath.png')} resizeMode='contain' width={30} height={30} style={{ width: 25, height: 25 }} /></TouchableOpacity>
                                            <TouchableOpacity style={[styles.tool, { backgroundColor: `rgba(0, 0, 0, ${pickMode === 'polygon' ? 0.6 : 0.4})` }]} activeOpacity={0.8} onPress={() => handleToolClick('polygon')}><Image source={require('../../assets/images/MapPolygon.png')} resizeMode='contain' width={30} height={30} style={{ width: 25, height: 25 }} /></TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.col}>
                                        <Text style={styles.boldText}>Image</Text>
                                        <ImageSelector onChangeImage={setSelectedImages} customComponent={false} ref={imageSelectorRef} />
                                    </View>

                                    <View style={styles.col}>
                                        <Text style={styles.boldText}>Types Of Hazards</Text>
                                        <Text style={styles.normalText}>Select a hazard type</Text>
                                        {userRole === 'community' && <View style={styles.rowButtons}>
                                            <LogoButton id='landmine' icon='landmine' label='Landmine' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                            <LogoButton id='uxo' icon='uxo' label='UXO' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                            <LogoButton id='notsure' icon='notsure' label='Not Sure' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                        </View>}
                                        {userRole === 'operational' && <View style={{ flexDirection: 'column', gap: 10 }}>
                                            <View style={styles.rowButtons}>
                                                <LogoButton id='ied' icon='ied' label='IED' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                                <LogoButton id='uxo' icon='uxo' label='UXO' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                                <LogoButton id='landmine' icon='landmine' label='Landmine' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                            </View>
                                            <LogoButton id='notsure' icon='notsure' label='Not Sure' selected={selectedHazardType} onPress={setSelectedHazardType} />
                                        </View>}
                                    </View>

                                    {userRole === 'operational' && <View style={styles.col}>
                                        <Text style={styles.boldText}>Classification</Text>
                                        <View style={{ flexDirection: 'column', gap: 10 }}>
                                            <View style={[styles.rowButtons, { marginTop: 2 }]}>
                                                <LogoButton id='suspected' icon='suspected' label='Suspected' selected={selectedClassification} onPress={setSelectedClassification} />
                                                <LogoButton id='confirmed' icon='confirmed' label='Confirmed' selected={selectedClassification} onPress={setSelectedClassification} />
                                                <LogoButton id='cleared' icon='cleared' label='Cleared' selected={selectedClassification} onPress={setSelectedClassification} />
                                            </View>
                                            <LogoButton id='marked' icon='marked' label='Marked' selected={selectedClassification} onPress={setSelectedClassification} />
                                        </View>
                                    </View>}

                                    <View
                                        style={styles.col}
                                        onLayout={(e) => { descriptionYRef.current = e.nativeEvent.layout.y; }}
                                    >
                                        <Text style={styles.boldText}>Description about the hazard (Optional)</Text>
                                        <TextInput
                                            style={styles.textArea}
                                            placeholder="Enter details about the hazard"
                                            value={text}
                                            onChangeText={setText}
                                            onFocus={handleDescriptionFocus}
                                            multiline={true}
                                            numberOfLines={4} // sets initial height
                                        />
                                    </View>

                                    {userRole === 'operational' && <View style={styles.col}>
                                        <Text style={styles.boldText}>Additional Details</Text>
                                        <View style={{ flexDirection: 'column', gap: 10 }}>
                                            <TextInput
                                                style={styles.lineInput}
                                                placeholder="Community/village Name"
                                                value={community}
                                                onChangeText={setCommunity}
                                            />
                                            <TextInput
                                                style={styles.lineInput}
                                                placeholder="Landmark"
                                                value={landmark}
                                                onChangeText={setLandmark}
                                            />
                                        </View>
                                    </View>}

                                    <View style={styles.col}>
                                        <View style={{ width: '100%', flexDirection: 'column', gap: 20, marginTop: 30, marginBottom: 30 }}>
                                            <ToggleButton onToggle={setVisibleOtherToggle} label='Make this visible to others' />
                                            <ToggleButton onToggle={setContactedNeededToggle} label='Would you like to be contacted if needed?' />
                                        </View>
                                    </View>

                                    {userRole === 'operational' && <View style={{ width: '100%' }}>
                                        <TextInput
                                            style={styles.lineInput}
                                            placeholder="Phone number or nickname (Optional)"
                                            value={phone}
                                            onChangeText={setPhone}
                                        />
                                    </View>}

                                    {userRole === 'operational' && <View style={styles.col}>
                                        <View style={{ width: '100%', flexDirection: 'column', gap: 20, marginTop: 5, marginBottom: 30 }}>
                                            <Text style={{ color: '#2A2A2A', fontWeight: 700, fontSize: 16 }}>Tag as</Text>
                                            <ToggleButton onToggle={setShaToggle} label='SHA(Suspected Hazardous Area)' />
                                            <ToggleButton onToggle={setChaToggle} label='CHA (Confirmed Hazardous Area)' />
                                        </View>
                                    </View>}

                                    <View style={styles.col}>
                                        <Button label='Submit' disabled={loading} loading={loading} onPress={handleSubmit} />
                                    </View>
                                </View>
                            </TouchableWithoutFeedback>
                        </ScrollView>
                    </RoundedView>
                    </KeyboardAvoidingView>
                </SafeAreaView>

            </View>
        </Provider>
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
        marginTop: 20,
        padding: 20
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginTop: 32,
    },
    col: {
        width: '100%',
        flexDirection: 'column',
        marginTop: 10,
    },
    rowButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
        marginTop: 10
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        width: '100%',
        borderWidth: 1,
        borderColor: "#ccc"
    },
    toolContainer: {
        position: 'absolute',
        top: 30,
        right: 10,
        flexDirection: 'column',
        gap: 10
    },
    tool: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    scrollView: {
        width: '100%',
    },
    boldText: {
        fontWeight: '700',
        marginBottom: 5,
        fontSize: 16
    },
    normalText: {
        color: '#475467'
    },
    textArea: {
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        minHeight: 130,
        textAlignVertical: "top", // keeps text at the top
    },
    lineInput: {
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        textAlignVertical: "top", // keeps text at the top
    },
    searchIcon: {
        marginRight: 8,
    },
});