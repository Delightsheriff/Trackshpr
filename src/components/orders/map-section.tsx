import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { layout, font } from "@/src/constants/tokens";

import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

export function MapSection({ riderName }: { riderName: string }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.mapContainer,
        { backgroundColor: colors.surfaceContainer },
      ]}
    >
      <MapView
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
      </MapView>
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
    position: "relative",
  },
  mapView: { flex: 1 },
  mapFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapFallbackText: {
    fontSize: 14,
    fontFamily: font.sans.regular,
  },
  mapFallbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  mapLabelText: {
    fontSize: 9,
    fontFamily: font.sans.regular,
  },
});
