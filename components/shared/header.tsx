import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { MapPinIcon, SearchIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useBookingStore } from "@/store/use-booking-store";
import useUser from "@/store/use-user";

export function Header() {
  const { location, setLocation } = useBookingStore();
  const profile = useUser((user) => user.profile);
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (location === "Detecting...") {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation("Permission denied");
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          let city =
            reverseGeocode[0].city ||
            reverseGeocode[0].region ||
            "Unknown City";
          setLocation(city);
        }
      })();
    }
  }, []);

  const handleSubmitSearch = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      router.push({ pathname: "/all-cars", params: { q: query } });
    } else {
      router.push("/all-cars");
    }
  };

  return (
    <VStack style={{ gap: 20 }}>
      <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
        <VStack style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 12,
              color: Colors.light.iconMuted,
              fontWeight: "600",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            Your Location
          </Text>

          <HStack style={{ alignItems: "center", gap: 6 }}>
            <MapPinIcon size={15} color={Colors.light.tint} />
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: Colors.light.text,
                letterSpacing: -0.3,
              }}
            >
              {location}
            </Text>
          </HStack>

          {/* Brand accent line */}
          <View
            style={{
              marginTop: 4,
              width: 28,
              height: 3,
              borderRadius: 2,
              backgroundColor: Colors.light.tint,
            }}
          />
        </VStack>

        <TouchableOpacity activeOpacity={0.8}>
          <Avatar
            size="md"
            style={{
              borderWidth: 2.5,
              borderColor: Colors.light.tint,
            }}
          >
            <AvatarFallbackText>
              {profile?.full_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("") ?? "U"}
            </AvatarFallbackText>
            <AvatarImage
              source={{
                uri: profile?.avatar_url ?? undefined,
              }}
            />
          </Avatar>
        </TouchableOpacity>
      </HStack>

      <Input
        variant="outline"
        size="xl"
        style={{
          borderRadius: 16,
          borderColor: "transparent",
          backgroundColor: Colors.light.card,
          height: 52,
          shadowColor: "#1A56FF",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.02,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <InputSlot style={{ paddingLeft: 14 }}>
          <InputIcon
            as={SearchIcon}
            style={{ color: Colors.light.iconMuted }}
          />
        </InputSlot>
        <InputField
          placeholder="Search any car..."
          placeholderTextColor={Colors.light.iconMuted}
          value={searchText}
          returnKeyType="search"
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmitSearch}
          style={{
            fontSize: 15,
            color: Colors.light.text,
          }}
        />
      </Input>
    </VStack>
  );
}
