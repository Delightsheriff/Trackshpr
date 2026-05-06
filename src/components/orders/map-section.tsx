import React from "react";
import { Platform, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { layout, font } from "@/src/constants/tokens";

const MapSectionNative = Platform.OS !== "web" 
  ? require("react-native-maps").default
  : null;
const Marker = Platform.OS !== "web"
  ? require("react-native-maps").Marker
  : null;
const PROVIDER_DEFAULT = Platform.OS !== "web"
  ? require("react-native-maps").PROVIDER_DEFAULT
  : null;

export function MapSection({ riderName }: { riderName: string }) {
  const { colors } = useTheme();

  if (Platform.OS === "web" || !MapSectionNative) {
    return (
      <View
        style={[
          styles.mapContainer,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            MapView not available on web
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mapContainer,
        { backgroundColor: colors.surfaceContainer },
      ]}
    >
      <MapSectionNative
        style={styles.mapView}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 6.455,
          longitude: 3.3841,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={{ latitude: 6.455, longitude: 3.3841 }}
          title={`Rider: ${riderName}`}
        />
      </MapSectionNative>
      <View
        style={[styles.mapLabel, { backgroundColor: colors.surfaceCard }]}
      >
        <Text style={[styles.mapLabelText, { color: colors.textMuted }]}>
          Last known location
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
    height: 130,
  },
  mapView: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 14,
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapLabelText: {
    fontSize: 11,
    fontWeight: "500",
  },
});