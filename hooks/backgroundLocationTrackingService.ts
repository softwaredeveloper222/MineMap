import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, AppState, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { LOCATION_TASK_NAME, TRACKING_LOCATIONS_KEY, PROXIMITY_LIMIT, BEEP_SOUND_URI, REPORTS_KEY } from '@/constants/types';
import { getDistance } from './functions';
import { firestore } from "@/firebase/firebase";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";

const MIN_DISTANCE = 99999999;

const requestPermissions = async () => {
    // Location permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Foreground location permission is required');
        return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    // console.log(">>>>>>>>>");
    if (backgroundStatus !== 'granted') {
        Alert.alert(
            'Background Permission Required',
            'Background location permission is needed for proximity alerts'
        );
        return false;
    }

    // Audio permissions for beep sound
    await Audio.requestPermissionsAsync();

    return true;
};

// Function to play beep sound
async function playBeepSound() {
    try {
        const { sound } = await Audio.Sound.createAsync(BEEP_SOUND_URI);
        await sound.playAsync();

        // Unload sound after playing to free memory
        setTimeout(async () => {
            await sound.unloadAsync();
        }, 3000);
    } catch (error) {
        console.error('Error playing beep sound:', error);
    }
}

export const configureNotification = async () => {
    // Configure notification behavior
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: Platform.OS === 'ios' ? true : false,
            shouldShowList: true,
        }),
    });
}

// Function to trigger proximity alert
async function triggerProximityAlert(nearbyPoint) {
    try {
        // Play beep sound
        await playBeepSound();

        // Show notification
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Hazard Proximity Alert! 📍',
                body: `Restricted zone detected ${nearbyPoint.distance}m away. Please stay safe"`,
                data: {
                    type: 'proximity',
                    locationData: nearbyPoint,
                    timestamp: new Date().toISOString(),
                },
                sound: true,
            },
            trigger: null, // Show immediately
        });

        console.log('Proximity alert triggered for:', nearbyPoint);
    } catch (error) {
        console.error('Error triggering proximity alert:', error);
    }
}

const calcDistanceBetweenReportAndCurrentLocation = (reportLocations, myLocation) => {
    if (!reportLocations || reportLocations?.length <= 0 || !myLocation) return;

    let minDistance = MIN_DISTANCE;
    for (const location of reportLocations) {
        const distance = getDistance(
            location?.latitude,
            location?.longitude,
            myLocation?.latitude,
            myLocation?.longitude,
            'm'
        );
        if (distance < minDistance) minDistance = distance;
    }
    return minDistance;
}

// Background task definition - THIS RUNS EVEN WHEN APP IS TERMINATED
export const registerBackgroundTask = async () => {

    TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
        if (error) {
            console.error('Background location task error:', error);
            return;
        }
        console.log("Tracking...");

        if (data) {
            if(!data?.locations || data?.locations?.length <= 0 || !data?.locations?.[0]?.coords) return;
            // const { locations } = data;

            console.log('Background: Received locations (APP TERMINATED):', data?.locations?.[0]?.coords);

            try {
                // Get Firebase locations from storage
                const firebaseReportsJson = await AsyncStorage.getItem(REPORTS_KEY);
                const reports = firebaseReportsJson ? JSON.parse(firebaseReportsJson) : [];

                if (reports.length === 0) {
                    console.log('No Firebase locations to compare against');
                    return;
                }

                // Check each new location against Firebase points
                for (const report of reports) {
                    if(!report?.locations || report?.locations?.length <= 0 || !report?.locations?.[0]?.coords) continue;
                    
                    const distance = calcDistanceBetweenReportAndCurrentLocation(report?.locations, data?.locations?.[0]?.coords);

                    const nearbyPoints = [];
                    // Find nearby points

                    if (distance <= PROXIMITY_LIMIT) {
                        nearbyPoints.push({
                            ...report,
                            distance: distance.toFixed(0),
                            currentLocation: data?.locations?.[0]?.coords
                        });
                    }

                    // If there are nearby points, trigger notifications
                    if (nearbyPoints.length > 0) {
                        console.log(`Found ${nearbyPoints.length} nearby points`);

                        for (const point of nearbyPoints) {
                            await triggerProximityAlert(point);
                        }
                    }
                }
            } catch (storageError) {
                console.error('Error in background processing:', storageError);
            }
        }
    });
}

// export const loadStorageLocations = async () => {
//     try {
//         const reports = JSON.parse(await AsyncStorage.getItem(REPORTS_KEY));
//         // Fetch locations from Firebase
//         // const locationsRef = collection(firestore, 'reports'); // Replace 'locations' with your collection name
//         // const snapshot = await getDocs(locationsRef) as any;
//         // console.log(snapshot);

//         const locations = [];
//         reports && reports?.length > 0 && reports?.forEach((report) => {
//             const data = report;

//             data.locations.forEach((loc, idx) => {
//                 locations.push({
//                     id: `${report.id}_${idx}`,
//                     ...data,
//                     // Ensure latitude and longitude are numbers
//                     latitude: typeof loc.latitude === 'number' ? loc.latitude : parseFloat(loc.latitude),
//                     longitude: typeof loc.longitude === 'number' ? loc.longitude : parseFloat(loc.longitude),
//                 });

//             })

//         });

//         // setFirebaseLocations(locations);

//         // Store in AsyncStorage for background access
//         await AsyncStorage.setItem(TRACKING_LOCATIONS_KEY, JSON.stringify(locations));

//         console.log(`Loaded ${locations.length} locations from Firebase`);
//         return locations;
//     } catch (error) {
//         console.error('Error loading Firebase locations:', error);
//         // Alert.alert('Error', 'Failed to load locations from Firebase');
//         return [];
//     }
// };

export const startProximityTracking = async () => {
    const hasPermissions = await requestPermissions();
    // console.log(">>>>>>>>>");
    if (!hasPermissions) return;
    // Refresh Firebase locations before starting
    // const locations = await loadFirebaseLocations();
    // if (locations.length === 0) {
    //     // Alert.alert('No Locations', 'No locations found in Firebase database');
    //     return;
    // }

    try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Check every 10 seconds
            distanceInterval: 10, // Check every 20 meters

            foregroundService: {
                notificationTitle: 'Proximity Tracking Active',
                notificationBody: 'Monitoring your proximity to saved locations',
                notificationColor: '#00AA00',
            },

            // Battery optimization
            deferredUpdatesInterval: 3000,
            deferredUpdatesDistance: 10,
            pausesUpdatesAutomatically: true,
        });

        //   setIsTracking(true);
        // Alert.alert('Success', 'Proximity tracking started');
    } catch (error) {
        console.error('Error starting proximity tracking:', error);
        Alert.alert('Error', 'Failed to start proximity tracking');
    }
};

// Test 1: Basic immediate notification
export const testImmediateNotification = async () => {
    try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'Notification permission is required for location alerts');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔔 Test Notification',
                body: 'This is a test immediate notification!',
                data: {
                    testType: 'immediate',
                    timestamp: Date.now()
                },
                sound: true,
            },
            trigger: null, // Show immediately
        });

        Alert.alert('Success', 'Immediate notification sent!');
    } catch (error) {
        console.error('Error sending immediate notification:', error);
        Alert.alert('Error', 'Failed to send notification');
    }
};

export const stopProximityTracking = async () => {
    try {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        //   setIsTracking(false);
        Alert.alert('Success', 'Proximity tracking stopped');
    } catch (error) {
        console.error('Error stopping proximity tracking:', error);
    }
};

export const refreshLocations = async () => {
    // await loadFirebaseLocations();
    Alert.alert('Success', 'Locations refreshed from Firebase');
};

export const loadStoredFirebaseData = async () => {
    try {
        const storedData = await AsyncStorage.getItem(TRACKING_LOCATIONS_KEY);
        if (storedData) {
            const locations = JSON.parse(storedData);
            // setFirebaseLocations(locations);
        }
    } catch (error) {
        console.error('Error loading stored Firebase data:', error);
    }
};

export const checkTrackingStatus = async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    return isRegistered;
    // setIsTracking(isRegistered);
};