import { Ionicons } from '@expo/vector-icons';
import React, {
    forwardRef,
    useImperativeHandle,
    useState,
} from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onSelectedLocation: (address: { lat: number; lng: number }) => void;
};

export type LocationSearchRef = {
    validate: () => boolean;
    clearInputs: () => void;
};

const AddressSearch = forwardRef<LocationSearchRef, Props>(
  ({ onSelectedLocation }, ref) => {
    const [lat, setLat] = useState("");
    const [lng, setLng] = useState("");
    const [error, setError] = useState("");

    const validateCoordinates = () => {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        setError("Latitude and Longitude must be numbers.");
        return false;
      }
      if (latitude < -90 || latitude > 90) {
        setError("Latitude must be between -90 and 90.");
        return false;
      }
      if (longitude < -180 || longitude > 180) {
        setError("Longitude must be between -180 and 180.");
        return false;
      }

      setError(""); // clear errors
      onSelectedLocation({ lat: latitude, lng: longitude });
      return true;
    };

    // Expose validate function to parent via ref
    useImperativeHandle(ref, () => ({
      validate: validateCoordinates,
      clearInputs() {
        setLat('');
        setLng('');
        setError('');
      },
    }));

    return (
      <View style={styles.container}>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%', alignItems: 'center' }}>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={lat}
              onChangeText={setLat}
              placeholder="Lat (-90 to 90)"
            />
          </View>
          <View style={{ flexDirection: 'column', flex: 1 }}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={lng}
              onChangeText={setLng}
              placeholder="Lng (-180 to 180)"
            />
          </View>
          <TouchableOpacity
            onPress={validateCoordinates}
            style={{ height: '100%', flexDirection: 'column-reverse', paddingBottom: 10 }}
          >
            <Ionicons name="search" size={25} color="#00D4AA" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
        {/* {error ? <Text style={styles.error}>{error}</Text> : null} */}
      </View>
    );
  }
);

export default AddressSearch;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", width: '100%', height: 44 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 40,
  },
  error: { color: "red", marginTop: 5 },
  searchIcon: {
    marginRight: 8,
  },
});
