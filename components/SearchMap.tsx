import * as Location from 'expo-location';
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export type AddressSearchRef = {
  clearInput: () => void;
  closeSuggestions: () => void;
  setDefaultQuery: (query: string) => void;
};

type Props = {
  onSelectedAddress: (address: any) => void;
};

const AddressSearch = forwardRef<AddressSearchRef, Props>(
  ({ onSelectedAddress }, ref) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [focusedSearchField, setFocusedSearchField] = useState(false);

    useEffect(() => {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
      })();
    }, []);

    // 👇 Expose methods to parent
    useImperativeHandle(ref, () => ({
      clearInput() {
        setQuery('');
        setSuggestions([]);
      },
      setDefaultQuery(query: string){
        setQuery(query);
      },
      closeSuggestions() {
        setFocusedSearchField(false);
      },
    }));

    const apiKey = 'AIzaSyDtKbMcIWXrp1atB4rKFB6kma6ZB0xl1Ec';

    const fetchSuggestions = async (input: string) => {
      if (!input) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify({ input }),
        });
        const data = await response.json();
        if (data.error) {
          console.log('[Places autocomplete] error:', data.error.status, data.error.message);
          return;
        }
        const mapped = (data.suggestions ?? [])
          .filter((s: any) => s.placePrediction)
          .map((s: any) => ({
            place_id: s.placePrediction.placeId,
            description: s.placePrediction.text?.text ?? '',
          }));
        setSuggestions(mapped);
      } catch (error) {
        console.log('[Places autocomplete] fetch error:', error);
      }
    };

    const fetchPlaceDetails = async (placeId: string) => {
      console.log('[Place details] tapped placeId:', placeId);
      setFocusedSearchField(false);
      try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'formattedAddress,location',
          },
        });
        const data = await response.json();
        console.log('[Place details] response:', JSON.stringify(data));
        if (data.error) {
          console.log('[Place details] error:', data.error.status, data.error.message);
          return;
        }
        if (data.formattedAddress && data.location) {
          setQuery(data.formattedAddress);
          onSelectedAddress({
            formatted_address: data.formattedAddress,
            geometry: {
              location: {
                lat: data.location.latitude,
                lng: data.location.longitude,
              },
            },
          });
          console.log('[Place details] onSelectedAddress called with', data.location);
        } else {
          console.log('[Place details] missing fields in response');
        }
      } catch (error) {
        console.log('[Place details] fetch error:', error);
      }
    };

    return (
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Type address..."
          value={query}
          onFocus={() => setFocusedSearchField(true)}
          onChangeText={(text) => {
            setQuery(text);
            fetchSuggestions(text);
          }}
        />

        {focusedSearchField && suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => fetchPlaceDetails(item.place_id)}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={() =>
              query ? <Text style={{ padding: 10 }}>No results found</Text> : null
            }
          />
        )}
      </View>
    );
  }
);

export default AddressSearch;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flex: 1,
    paddingHorizontal: 10,
  },
  input: {
    height: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  list: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    position: 'absolute',
    width: '100%',
    top: 50,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  item: {
    padding: 10,
    backgroundColor: 'white',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
