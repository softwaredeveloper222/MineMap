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

    const fetchSuggestions = async (input: string) => {
      if (!input) {
        setSuggestions([]);
        return;
      }

      const apiKey = 'AIzaSyBB6RX00DAk3V80_x9aN8ufsg24Z4QNWFM';
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&types=address&key=${apiKey}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.predictions) {
          setSuggestions(data.predictions);
        }
      } catch (error) {
        console.log(error);
      }
    };

    const fetchPlaceDetails = async (placeId: string) => {
      setFocusedSearchField(false);
      const apiKey = 'AIzaSyBB6RX00DAk3V80_x9aN8ufsg24Z4QNWFM';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.result) {
          setQuery(data.result.formatted_address);
          onSelectedAddress(data.result);
        }
      } catch (error) {
        console.log(error);
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
