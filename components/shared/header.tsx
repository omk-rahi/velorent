import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDownIcon, MapPinIcon, SearchIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

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
  const insets = useSafeAreaInsets();
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
  }, [location, setLocation]);

  const handleSubmitSearch = () => {
    const query = searchText.trim();
    if (query.length > 0) {
      router.push({ pathname: "/all-cars", params: { q: query } });
    } else {
      router.push("/all-cars");
    }
  };

  return (
    <VStack
      style={{
        gap: 14,
        marginHorizontal: -20,
        marginTop: -16 - insets.top,
        paddingHorizontal: 20,
        paddingTop: 14 + insets.top,
        paddingBottom: 18,
        overflow: "hidden",
        backgroundColor: Colors.light.background,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 178 + insets.top,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          overflow: "hidden",
        }}
      >
        <Svg width="100%" height="100%" preserveAspectRatio="none">
          <Defs>
            <SvgLinearGradient
              id="headerGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <Stop offset="0" stopColor={Colors.light.tint} />
              <Stop offset="0.58" stopColor="#3B6FF8" />
              <Stop offset="1" stopColor="#8EB5FF" />
            </SvgLinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#headerGradient)" />
        </Svg>
      </View>
      <HStack style={{ alignItems: "center", justifyContent: "space-between" }}>
        <VStack style={{ flex: 1, gap: 8, marginRight: 14 }}>
          <Text
            numberOfLines={1}
            style={{
              color: "#FFFFFF",
              fontSize: 27,
              fontWeight: "900",
              letterSpacing: 0,
            }}
          >
            Velorent
          </Text>
          <TouchableOpacity activeOpacity={0.8}>
            <HStack
              style={{
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: "rgba(255,255,255,0.14)",
                borderRadius: 18,
                gap: 6,
                maxWidth: "100%",
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <MapPinIcon size={14} color="#FFFFFF" />
              <Text
                numberOfLines={1}
                style={{
                  color: "#EAF1FF",
                  flexShrink: 1,
                  fontSize: 12,
                  fontWeight: "800",
                }}
              >
                {location}
              </Text>
              <ChevronDownIcon size={14} color="#EAF1FF" />
            </HStack>
          </TouchableOpacity>
        </VStack>

        <TouchableOpacity activeOpacity={0.8}>
          <Avatar
            size="md"
            style={{
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.85)",
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

      <VStack>
        <Input
          variant="outline"
          size="lg"
          style={{
            borderRadius: 16,
            borderColor: "rgba(255,255,255,0.9)",
            backgroundColor: Colors.light.card,
            height: 48,
            shadowColor: "#0F172A",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 3,
          }}
        >
          <InputSlot style={{ paddingLeft: 14 }}>
            <InputIcon
              as={SearchIcon}
              style={{ color: Colors.light.tint }}
            />
          </InputSlot>
          <InputField
            placeholder="Search cars, brands or places"
            placeholderTextColor={Colors.light.iconMuted}
            value={searchText}
            returnKeyType="search"
            onChangeText={setSearchText}
            onSubmitEditing={handleSubmitSearch}
            style={{
              color: Colors.light.text,
              fontSize: 14,
              fontWeight: "600",
            }}
          />
        </Input>
      </VStack>
    </VStack>
  );
}
