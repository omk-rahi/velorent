import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  address?: {
    address_line1: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  latitude?: number | null;
  longitude?: number | null;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function PickupLocationCard({ address, latitude, longitude }: Props) {
  const [distance, setDistance] = useState<number | null>(null);

  const pickupLat = latitude ?? address?.latitude;
  const pickupLon = longitude ?? address?.longitude;

  useEffect(() => {
    if (pickupLat == null || pickupLon == null) return;

    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;

        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (cancelled) return;
        const d = haversineKm(
          loc.coords.latitude,
          loc.coords.longitude,
          pickupLat,
          pickupLon
        );
        setDistance(d);
      } catch {
        // Location unavailable — badge simply won't render
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pickupLat, pickupLon]);

  const displayAddress = address
    ? `${address.address_line1}, ${address.city}, ${address.state} - ${address.pincode}`
    : "Riverfront Road, Ahmedabad";

  const distanceLabel =
    distance !== null
      ? distance < 1
        ? `${Math.round(distance * 1000)} m away`
        : `${distance.toFixed(1)} km away`
      : null;

  return (
    <Card className="rounded-2xl px-4 py-4">
      <HStack style={{ alignItems: "flex-start" }}>
        <View
          style={{
            height: 44,
            width: 44,
            borderRadius: 22,
            backgroundColor: Colors.light.success,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            flexShrink: 0,
          }}
        >
          <Ionicons name="location" size={20} color="white" />
        </View>

        <VStack style={{ flex: 1 }}>
          <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
            <Heading size="sm" className="font-semibold">
              Pickup location
            </Heading>

            {distanceLabel && (
              <View
                style={{
                  backgroundColor: "#ECFDF5",
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 100,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: Colors.light.success,
                  }}
                >
                  {distanceLabel}
                </Text>
              </View>
            )}
          </HStack>

          <Text className="text-sm" style={{ marginTop: 4 }}>
            {displayAddress}
          </Text>

          <Text className="text-xs text-muted-foreground" style={{ marginTop: 4 }}>
            Available instantly · Open 24/7
          </Text>
        </VStack>
      </HStack>
    </Card>
  );
}
