import { MapView } from '@/components/MapView';
import React, { useEffect, useState } from 'react';
import {
    View,
    Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { checkTrackingStatus, loadStoredFirebaseData, startProximityTracking, registerBackgroundTask, testImmediateNotification, configureNotification } from '@/hooks/backgroundLocationTrackingService';
import { Button } from '@/components/Button';



export default function MapScreen() {
    const [isTracking, setIsTracking] = useState(false);
    const [firebaseLocations, setFirebaseLocations] = useState([]);
    const [lastLocation, setLastLocation] = useState(null);
    const [nearbyCount, setNearbyCount] = useState(0);

    useEffect(() => {
        initializeApp();

        setupNotifications();
    }, []);

    const initializeApp = async () => {
        await registerBackgroundTask();
        const trackingStatus = await checkTrackingStatus();
        console.log('trackingStatus >>>>>>', trackingStatus);
        setIsTracking(trackingStatus);
        await startProximityTracking();

        // await loadFirebaseLocations();
        await loadStoredFirebaseData();
    };

    const setupNotifications = async () => {
        // Request notification permissions
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Notification permission is required for location alerts');
        }
        await configureNotification();
        // Handle notification responses (when user clicks notification)
        Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    };

    const handleNotificationResponse = (response) => {
        const { data } = response.notification.request.content;

        if (data.type === 'proximity') {
            // Navigate to your map screen with the location data
            console.log('Notification clicked, location data:', data.locationData);

            // You can use React Navigation here to navigate to your map screen
            // navigation.navigate('MapScreen', { 
            //   currentLocation: data.locationData.currentLocation,
            //   targetLocation: data.locationData,
            //   timestamp: data.timestamp
            // });

            // Alert.alert(
            //     'Location Alert',
            //     `Opening location: ${data.locationData.name || 'Unknown'}\nDistance: ${data.locationData.distance}m`,
            //     [
            //         {
            //             text: 'OK',
            //             // onPress: () => {
            //             //     // Handle navigation to your map/location screen
            //             //     setLastLocation(data.locationData);
            //             // }
            //         }
            //     ]
            // );
        }
    };




    return (
        <View style={{ flex: 1 }}>
            <MapView />
        </View>
    )
}