import * as Application from 'expo-application';
import * as Location from "expo-location";
import { Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImageManipulator from 'expo-image-manipulator';


const validateEmail = (email: string) => {
    const re = /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password: string) => {
    // At least 6 characters, at least one letter, one number, and one special character
    return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/.test(password);
};

export const validation = (data: { email: string, password: string, confirmPassword: string }) => {
    const { email, password, confirmPassword } = data;

    if (!email.trim()) {
        return 'Email is required';
    } else if (!validateEmail(email)) {
        return 'Invalid email address';
    }
    if (!password) {
        return 'Password is required';
    } else if (!validatePassword(password)) {
        return 'Password must be at least 6 characters, include a letter, a number, and a special character';
    } else if (password !== confirmPassword) {
        return 'Passwords do not match. Please re-enter your password'
    }
    
    return 'success';
}

export const getDeviceId = () => {
    let deviceId = null;
  
    if (Platform.OS === 'android') {
      // This is the closest alternative to IMEI / Serial in Expo
      deviceId = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      // iOS does not allow access to IMEI or Serial numbers
      deviceId = Application.applicationId; 
    }
  
    return deviceId;
  }

  export const getAddressFromLocation = async (
    latitude: number,
    longitude: number,
    retries = 2
  ): Promise<string | undefined> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const [result] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (!result) return undefined;
        return (
          result.formattedAddress ||
          [result.name, result.street, result.city, result.region, result.country]
            .filter(Boolean)
            .join(', ')
        );
      } catch (error: any) {
        const message = String(error?.message ?? error);
        const lower = message.toLowerCase();
        const isTransient =
          message.includes('DEADLINE_EXCEEDED') ||
          lower.includes('timeout') ||
          lower.includes('deadobjectexception') ||
          lower.includes('ioexception');
        if (attempt < retries && isTransient) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
        if (!isTransient) {
          console.warn('Error in reverse geocoding:', error);
        }
        return undefined;
      }
    }
    return undefined;
  }

  export const getZoomLevel = (latitudeDelta: number) => {
    return Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  };

  export const convertImageToJpg = async (imgUri: string) => {
    const jpegImage = await ImageManipulator.manipulateAsync(
        imgUri,
        [
          { resize: { width: 1080 } }
        ],
        {
            compress: 0.5, // 1 = best quality
            format: ImageManipulator.SaveFormat.JPEG, // or 'jpeg'
          }
    );
    console.log('jpegImage.uri', jpegImage.uri)
    return jpegImage.uri;
}

  export const uploadImage = async (image: string): Promise<string | null> => {
    if (!image) return null;
  
    try {
      // Convert local file URI to blob
      const convertedImage = await convertImageToJpg(image);
      const response = await fetch(convertedImage);
      const blob = await response.blob();
  
      // Get filename from path
      const filename = convertedImage.substring(convertedImage.lastIndexOf("/") + 1);
  
      // Firebase Storage reference
      const storage = getStorage();
      const storageRef = ref(storage, `images/${Date.now()}-${filename}`);
  
      // Upload blob
      await uploadBytes(storageRef, blob);
  
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

  export const uploadAudio = async (audio: string): Promise<string | null> => {
    if (!audio) return null;

    try {
      // Convert local file URI to blob
      const response = await fetch(audio);
      const blob = await response.blob();

      // Get filename from path
      const filename = audio.substring(audio.lastIndexOf("/") + 1);

      // Firebase Storage reference
      const storage = getStorage();
      const storageRef = ref(storage, `audios/${Date.now()}-${filename}`);

      // Upload blob
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Upload failed:", error);
      return null;
    }
  };

/**
 * Calculate distance between two lat/lon points
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @param unit "K" = Kilometers (default), "M" = Miles, "N" = Nautical miles, "m" = Meters
 */
export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: "K" | "M" | "N" | "m" = "K"
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // 🌍 Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let distance = R * c; // in kilometers

  if (unit === "M") distance *= 0.621371;      // miles
  if (unit === "N") distance *= 0.539957;      // nautical miles
  if (unit === "m") distance *= 1000;          // meters

  return distance;
}

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return;
    }

    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) return lastKnown;

    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (error) {
    console.warn("getCurrentLocation failed:", error);
    return;
  }
}
