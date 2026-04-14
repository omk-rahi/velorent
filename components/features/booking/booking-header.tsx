import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import type { BookingStep } from "@/hooks/use-booking-steps";

interface BookingHeaderProps {
  steps?: BookingStep[];
  currentStepKey?: string;
  car: any;
}

export function BookingHeader({ car }: BookingHeaderProps) {
  const primaryImage =
    car?.images?.find((i: any) => i.is_primary)?.image_url ||
    car?.images?.[0]?.image_url;

  const brandName = Array.isArray(car?.brand)
    ? car.brand[0]?.name
    : car?.brand?.name;
  const modelName = Array.isArray(car?.model)
    ? car.model[0]?.name
    : car?.model?.name;

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
      {/* Back button + title */}
      <HStack style={{ alignItems: "center", marginBottom: 20 }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.light.card,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: Colors.light.cardBorder,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 16,
            fontWeight: "700",
            color: Colors.light.text,
          }}
        >
          Book Car
        </Text>
        <View style={{ width: 36 }} />
      </HStack>

      {/* Car mini-card */}
      {car && (
        <View
          style={{
            backgroundColor: Colors.light.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: Colors.light.cardBorder,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 4,
          }}
        >
          {primaryImage && (
            <Image
              source={{ uri: primaryImage }}
              style={{ width: 64, height: 52, borderRadius: 10 }}
              resizeMode="cover"
            />
          )}
          <VStack style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: Colors.light.text,
              }}
            >
              {brandName} {modelName}
            </Text>
            <HStack style={{ alignItems: "center", gap: 4 }}>
              <Ionicons name="star" size={11} color="#F5A524" />
              <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
                {car.review_count > 0
                  ? car.average_rating?.toFixed(1)
                  : "New"}
                {car.review_count > 0 && ` · ${car.review_count} trips`}
              </Text>
            </HStack>
          </VStack>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: Colors.light.tint,
            }}
          >
            ₹{car.hourly_price}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "500",
                color: Colors.light.iconMuted,
              }}
            >
              /hr
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}
