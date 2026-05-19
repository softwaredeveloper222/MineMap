import { useReportsStore } from '@/app/store/reportsStore';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Alert,
  Platform,
  StyleProp,
  ViewStyle,
  Text,
} from 'react-native';
import { Marker, Circle, Polyline, Polygon, PROVIDER_GOOGLE, PROVIDER_DEFAULT, MapPressEvent, MapViewProps, Region } from 'react-native-maps';
import MapView from 'react-native-map-clustering';
import * as Location from "expo-location";
import { getZoomLevel } from '@/hooks/functions';
import * as Sentry from "sentry-expo";


type LatLngLiteral = {
  latitude: number;
  longitude: number;
};

const normalizeLatLng = (value?: { latitude?: number | string; longitude?: number | string; lat?: number | string; lng?: number | string } | null): LatLngLiteral | null => {
  if (value == null) {
    return null;
  }

  const latitude = Number(value.latitude ?? value.lat);
  const longitude = Number(value.longitude ?? value.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const toLatLngArray = (locations?: any[]): LatLngLiteral[] => {
  if (!Array.isArray(locations)) {
    return [];
  }

  return locations
    .map((loc) => normalizeLatLng(loc))
    .filter((loc): loc is LatLngLiteral => !!loc);
};

export type PickMode = 'point' | 'path' | 'polygon';

type SimpleMapViewProps = {
  style?: StyleProp<ViewStyle>;
  initialRegion?: Region;
  showsUserLocation?: boolean;
  onPress?: (event: MapPressEvent) => void;
  selectedLocations?: Array<LatLngLiteral | { lat?: number | string; lng?: number | string } | null | undefined>;
  selectedAddress?: string | null;
  onChangeCurrentLocation?: (location: Location.LocationObject) => void;
  onGotoCurrentLocation?: () => void;
  pickMode?: PickMode;
  mapType?: MapViewProps['mapType'];
  onSelectPoint?: (report: any) => void;
  children?: React.ReactNode;
  onDragEnd?: (index: number, coordinate: LatLngLiteral) => void;
};

const INITIAL_REGION: Region = {
  latitude: 40.7589,
  longitude: -73.9851,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const CIRCLE_VISIBILITY_ZOOM = 10;
const VERTEX_VISIBILITY_ZOOM = 16;

export const SimpleMapView = forwardRef<MapView, SimpleMapViewProps>(({
  style,
  initialRegion = INITIAL_REGION,
  showsUserLocation = false,
  onPress,
  selectedLocations = [],
  selectedAddress,
  onChangeCurrentLocation,
  onGotoCurrentLocation,
  pickMode = 'point' as PickMode,
  mapType = 'standard' as MapViewProps['mapType'],
  onSelectPoint,
  children,
  onDragEnd,
}: SimpleMapViewProps, ref) => {

  const [pointers, setPointers] = useState<LatLngLiteral[]>(toLatLngArray(selectedLocations));
  const [reports, setReports] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [region, setRegion] = useState(initialRegion);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [currentLocation, setCurrentLocation] = useState<LatLngLiteral | null>(null);
  const [spiderfied, setSpiderfied] = useState<{ center: LatLngLiteral; originalCoords: LatLngLiteral[] } | null>(null);
  const storedReports = useReportsStore(state => state.reports);
  const internalMapRef = useRef<any>(null);
  const superClusterRef = useRef<any>(null);

  // Spider expansion: when clustered reports are close enough that zoom alone
  // won't separate them, fan them out radially so they're individually tappable.
  const SAME_POINT_THRESHOLD = 0.0005; // ~50 meters - matches typical cluster radius at max zoom
  const SPIDER_RADIUS_DEG = 0.0005; // ~55 meters - ensures spider fan exceeds cluster radius
  const getSpiderOffset = (index: number, total: number, center: LatLngLiteral): LatLngLiteral => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return {
      latitude: center.latitude + Math.cos(angle) * SPIDER_RADIUS_DEG,
      longitude: center.longitude + Math.sin(angle) * SPIDER_RADIUS_DEG,
    };
  };

  const setMapRef = useCallback((node: any) => {
    internalMapRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<any>).current = node;
    }
  }, [ref]);

  const handleClusterPress = useCallback((clusterId: number, coordinate: LatLngLiteral) => {
    console.log('[SimpleMapView] handleClusterPress entered. id=', clusterId);
    const map = internalMapRef.current;
    if (!map) {
      console.warn('[SimpleMapView] handleClusterPress: map ref is null');
      return;
    }
    const engine = superClusterRef.current;
    console.log('[SimpleMapView] clustering engine?', !!engine);
    if (engine) {
      try {
        const leaves = engine.getLeaves(clusterId, Infinity);
        const coords: LatLngLiteral[] = leaves
          .map((l: any) =>
            normalizeLatLng({
              latitude: l.geometry.coordinates[1],
              longitude: l.geometry.coordinates[0],
            })
          )
          .filter((c: LatLngLiteral | null): c is LatLngLiteral => !!c);
        console.log('[SimpleMapView] leaves count=', leaves.length, 'coords=', JSON.stringify(coords));

        if (coords.length > 1) {
          const allAtSamePoint = coords.every(c =>
            Math.abs(c.latitude - coords[0].latitude) < SAME_POINT_THRESHOLD &&
            Math.abs(c.longitude - coords[0].longitude) < SAME_POINT_THRESHOLD
          );
          console.log('[SimpleMapView] allAtSamePoint?', allAtSamePoint);

          if (allAtSamePoint) {
            console.log('[SimpleMapView] spiderfying', coords.length, 'markers at', coords[0]);
            map.animateCamera?.(
              { center: coordinate, zoom: 19 },
              { duration: 300 }
            );
            setSpiderfied({ center: coords[0], originalCoords: coords });
            return;
          }

          map.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
          return;
        }
      } catch {
        // fall through to camera zoom
      }
    }
    map.animateCamera?.(
      { center: coordinate, zoom: Math.min((zoomLevel ?? 10) + 2, 20) },
      { duration: 300 }
    );
  }, [zoomLevel, reports]);

  // Load reports from global store
  useEffect(() => {
    setReports(storedReports || []);
  }, [storedReports]);

  // Update pointers when selectedLocations change
  useEffect(() => {
    setPointers(toLatLngArray(selectedLocations));
  }, [selectedLocations]);

  // Watch user location
  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const nextLocation = normalizeLatLng(newLocation?.coords);
          if (nextLocation) {
            setCurrentLocation(nextLocation);
          }
          onChangeCurrentLocation?.(newLocation);
        }
      );
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // Pulse animation for current location marker
  const pulse1 = useRef(new Animated.Value(0)).current;
  const opacity1 = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(pulse1, {
          toValue: 2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity1, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleMapReady = () => {
    setMapReady(true);
    onGotoCurrentLocation?.();
  };

  // Filter visible markers (optional optimization)
  const filterVisibleReports = useCallback((reportsList, region) => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const latMin = latitude - latitudeDelta / 2;
    const latMax = latitude + latitudeDelta / 2;
    const lngMin = longitude - longitudeDelta / 2;
    const lngMax = longitude + longitudeDelta / 2;

    return reportsList.filter((report) => {
      const coords = toLatLngArray(report.locations || []);
      return coords.some(
        (p) =>
          p.latitude >= latMin &&
          p.latitude <= latMax &&
          p.longitude >= lngMin &&
          p.longitude <= lngMax
      );
    });
  }, []);

  const visibleReports = useMemo(
    () => filterVisibleReports(reports, region),
    [reports, region]
  );


  // Custom cluster renderer – prevents clipping by using a fixed-size circular view
  const renderCluster = useCallback((cluster: any) => {
    const { geometry, properties } = cluster;
    const coordinate = {
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0],
    };

    if(geometry?.coordinates?.length < 2) {
      console.log("Cluster has less than 2 points, skipping", geometry.coordinates);
      return ;
    }

    return (
      <Marker
        key={`cluster-${properties.cluster_id}`}
        coordinate={coordinate}
        // tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => {
          console.log('[SimpleMapView] Cluster tapped. id=', properties.cluster_id, 'count=', properties.point_count, 'coord=', coordinate);
          handleClusterPress(properties.cluster_id, coordinate);
        }}
      >
        <View style={styles.clusterContainer}>
          <Text style={styles.clusterText}>{properties.point_count}</Text>
        </View>
      </Marker>
    );
  }, [handleClusterPress]);

  // Memoized markers for smooth performance
  const renderMarkers = useMemo(() => {
    // if (!mapReady) return null;
    if (!mapReady) return [] as React.ReactNode[];

    // const markers: any[] = [];
    const markers: React.ReactNode[] = [];

    // Spider slot allocator: each marker at the spidered center gets the next free fan slot.
    // Slots are assigned in the order markers are rendered.
    let spiderSlotsUsed = 0;
    const maybeSpiderOffset = (coord: LatLngLiteral): LatLngLiteral => {
      if (!spiderfied) return coord;
      const matchesCenter =
        Math.abs(coord.latitude - spiderfied.center.latitude) < SAME_POINT_THRESHOLD &&
        Math.abs(coord.longitude - spiderfied.center.longitude) < SAME_POINT_THRESHOLD;
      if (!matchesCenter) return coord;
      const total = spiderfied.originalCoords.length;
      if (spiderSlotsUsed >= total) return coord;
      const offset = getSpiderOffset(spiderSlotsUsed, total, spiderfied.center);
      spiderSlotsUsed++;
      return offset;
    };

    // Auto-offset duplicate-coord point reports so they naturally separate at high zoom.
    // Offset is small (~16m) so they still cluster at lower zoom but appear as distinct
    // pins when zoomed in past the cluster radius.
    const AUTO_OFFSET_DEG = 0.00015; // ~16 meters
    const BUCKET_DEG = 0.00005;       // ~5 meters - grouping precision
    const bucketKey = (c: LatLngLiteral) =>
      `${Math.round(c.latitude / BUCKET_DEG)}_${Math.round(c.longitude / BUCKET_DEG)}`;

    const autoOffsetMap = new Map<string, LatLngLiteral>();
    {
      const buckets = new Map<string, { id: string; coord: LatLngLiteral }[]>();
      visibleReports.forEach((report, idx) => {
        if (!report?.locations || report.pickMode !== 'point') return;
        const cs = toLatLngArray(report.locations);
        if (cs.length === 0) return;
        const reportId = report.id || report._id || `report-${idx}`;
        const key = bucketKey(cs[0]);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push({ id: reportId, coord: cs[0] });
      });
      buckets.forEach((items) => {
        if (items.length <= 1) return;
        items.forEach((item, i) => {
          const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
          autoOffsetMap.set(item.id, {
            latitude: item.coord.latitude + Math.cos(angle) * AUTO_OFFSET_DEG,
            longitude: item.coord.longitude + Math.sin(angle) * AUTO_OFFSET_DEG,
          });
        });
      });
    }
    // User location pulse marker
    if (currentLocation) {
      markers.push(
        <Marker
          key="user-location"
          coordinate={currentLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.pulseContainer}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulse1 }],
                  opacity: opacity1,
                },
              ]}
            />
            <View style={styles.centerDot} />
          </View>
        </Marker>
      );
    }

    // User-drawn pointers (path, polygon, point)
    if (pointers.length > 0) {
      const hasPathShape = pickMode === 'path' && pointers.length > 1;
      const hasPolygonShape = pickMode === 'polygon' && pointers.length > 2;

      if (pickMode === 'point' && pointers[0]) {
        markers.push(
          <Marker
            key="selected-point"
            coordinate={pointers[0]}
            draggable
            onDragEnd={(e) => onDragEnd?.(0, e.nativeEvent.coordinate)}
            pinColor="blue"
            title="Selected Location"
            description={selectedAddress || "Fetching address..."}
          />
        );
      }

      if (hasPathShape) {
        markers.push(
          <Polyline
            key="selected-path"
            coordinates={pointers}
            strokeColor="#000"
            strokeWidth={4}
          />
        );
      }

      if (hasPolygonShape) {
        markers.push(
          <Polygon
            key="selected-polygon"
            coordinates={pointers}
            strokeColor="green"
            strokeWidth={2}
            fillColor="rgba(0, 255, 0, 0.2)"
          />
        );
      }

      if ((pickMode === 'path' || pickMode === 'polygon') && pointers.length > 0) {
        pointers.forEach((p, i) => {
          markers.push(
            <Marker
              key={`pointer-${i}`}
              coordinate={p}
              draggable
              onDragEnd={(e) => onDragEnd?.(i, e.nativeEvent.coordinate)}
              pinColor="blue"
              title={`Point ${i + 1}`}
              description={selectedAddress || "Fetching address..."}

            />
          );
        });
      }
    }

    // Reports (from Firebase/store)
    visibleReports.forEach((report, idx) => {
      try {
        if (!report || !report.locations) return;
        const coords = toLatLngArray(report.locations || []);
        if (coords.length === 0) return;
        const reportId = report.id || report._id || `report-${idx}`;
        if (report.pickMode === 'point' && coords[0]) {
          const baseCoord = autoOffsetMap.get(reportId) ?? coords[0];
          const markerCoord = maybeSpiderOffset(baseCoord);
          markers.push(
            <Marker
              key={`report-point-${reportId}`}
              coordinate={markerCoord}
              tracksViewChanges={false}
              // anchor={{ x: 0.5, y: 0.5 }}
              title={report.locations[0].address || "Reported Location"}
              description={report.description || ''}
              onPress={() => onSelectPoint?.(report)}
            />
          );

          // Circle overlay (only at high zoom)
          if (zoomLevel >= CIRCLE_VISIBILITY_ZOOM) {
            markers.push(
              <Circle
                key={`circle-${reportId}`}
                center={markerCoord}
                radius={100}
                strokeWidth={2}
                strokeColor="rgba(255, 0, 0, 0.5)"
                fillColor="rgba(255, 0, 0, 0.2)"
              />
            );
          }
        }

        if (report.pickMode === 'path' && coords.length > 1 && zoomLevel >= CIRCLE_VISIBILITY_ZOOM) {
          markers.push(
            <Polyline
              key={`report-path-${reportId}`}
              coordinates={coords}
              strokeColor="rgba(255, 72, 0, 0.57)"
              strokeWidth={4}
              tappable={true}
              onPress={() => onSelectPoint?.(report)}
            />
          );
        }

        if (report.pickMode === 'polygon' && coords.length > 2) {
          markers.push(
            <Polygon
              key={`report-polygon-${reportId}`}
              coordinates={coords}
              strokeColor="red"
              strokeWidth={2}
              fillColor="rgba(255, 72, 0, 0.2)"
              tappable={true}
              onPress={() => onSelectPoint?.(report)}
            />
          );
        }

        // Only show vertex markers for paths, not polygons
        if (report.pickMode === 'path') {
          coords.forEach((p, i) => {
            const vertexCoord = maybeSpiderOffset(p);
            markers.push(
              <Marker
                key={`report-marker-${reportId}-${i}`}
                coordinate={vertexCoord}
                tracksViewChanges={false}
                onPress={() => onSelectPoint?.(report)}
              />
            );
          });
        }
      } catch (error) {
        Alert.alert('Error rendering markers:', error.message);
        Sentry.Native.captureException("crash error >>>>>>>>>>>>>>: " + error.message);
      } finally {
        // console.log('Markers rendered successfully');
      }
    });

    return markers.filter(Boolean);
  }, [mapReady, currentLocation, pointers, pickMode, visibleReports, zoomLevel, spiderfied]);

  return (
    <View style={[style, { flex: 1 }]}>
      <MapView
        ref={setMapRef}
        mapRef={setMapRef}
        superClusterRef={superClusterRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        showsUserLocation={showsUserLocation}
        showsCompass={false}
        showsBuildings
        mapType={mapType}
        initialRegion={initialRegion}
        onPress={onPress}
        clusteringEnabled={true}
        clusterColor="#ff6600"
        showsTraffic
        clusterTextColor="#fff"
        radius={50}
        nodeSize={50}
        minPoints={2}
        // edgePadding={{ top: 50, right: 50, bottom: 50, left: 50 }} // ADD THIS

        renderCluster={renderCluster}
        // tracksViewChanges={false}
        spiralEnabled
        onMapReady={handleMapReady}
        onRegionChangeComplete={(r) => {
          setRegion(r);
          setZoomLevel(getZoomLevel(r.latitudeDelta));
          if (spiderfied) {
            const dx = r.latitude - spiderfied.center.latitude;
            const dy = r.longitude - spiderfied.center.longitude;
            if (Math.sqrt(dx * dx + dy * dy) > 0.002) {
              setSpiderfied(null);
            }
          }
        }}
        // loadingEnabled={true}
        // loadingIndicatorColor="#ff6600"
        toolbarEnabled={true}
      >
        {renderMarkers}
      </MapView>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pulseContainer: {
    width: 39,
    height: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 1)',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgb(4, 0, 255)',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  clusterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 72, 0, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 72, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterCircleInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 72, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 72, 0, 0.4)',
  },
  clusterCircleCore: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4800',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinMarker: {
    width: 26,
    height: 36,
    borderRadius: 13,
    backgroundColor: '#FF4800',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  villageMarkerIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  clusterContainer: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  pinMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
