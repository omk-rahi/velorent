import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { getCarById } from "@/api/cars";
import { SummaryRow } from "@/components/features/booking/summary-row";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";

export default function SuccessScreen() {
  const {
    carId,
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    totalAmount,
  } = useLocalSearchParams<{
    carId: string;
    bookedId: string;
    pickupDate: string;
    pickupTime: string;
    dropoffDate: string;
    dropoffTime: string;
    totalAmount: string;
  }>();

  const insets = useSafeAreaInsets();

  const { data: carData, isLoading } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => getCarById(carId as string),
    enabled: !!carId,
  });
  const car = carData as any;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <Loader />
      </View>
    );
  }

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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <VStack style={{ alignItems: "center", gap: 20 }}>
          {/* Success icon */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: Colors.light.success + "18",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: Colors.light.success + "30",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="checkmark"
                size={36}
                color={Colors.light.success}
              />
            </View>
          </View>

          <VStack style={{ alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "800",
                color: Colors.light.text,
                letterSpacing: -0.5,
              }}
            >
              Booking Requested!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: Colors.light.iconMuted,
                textAlign: "center",
              }}
            >
              Your request has been sent to the host.{"\n"}You will be notified
              once confirmed.
            </Text>
          </VStack>

          {/* Trip summary card */}
          {car && (
            <View
              style={{
                width: "100%",
                backgroundColor: Colors.light.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                padding: 20,
                gap: 16,
              }}
            >
              <HStack style={{ gap: 14, alignItems: "center" }}>
                {primaryImage && (
                  <Image
                    source={{ uri: primaryImage }}
                    style={{ width: 64, height: 52, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                )}
                <VStack style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: Colors.light.text,
                    }}
                  >
                    {brandName} {modelName}
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
                    ₹{car.hourly_price}/hr
                  </Text>
                </VStack>
              </HStack>

              <View
                style={{ height: 1, backgroundColor: Colors.light.cardBorder }}
              />

              <VStack style={{ gap: 10 }}>
                <SummaryRow
                  icon="calendar-outline"
                  label="Pick-up"
                  value={`${pickupDate} · ${pickupTime}`}
                />
                <SummaryRow
                  icon="flag-outline"
                  label="Drop-off"
                  value={`${dropoffDate} · ${dropoffTime}`}
                />
                {totalAmount && (
                  <SummaryRow
                    icon="cash-outline"
                    label="Total"
                    value={`₹${totalAmount}`}
                    valueColor={Colors.light.tint}
                  />
                )}
              </VStack>
            </View>
          )}
        </VStack>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          paddingTop: 16,
          gap: 12,
        }}
      >
        <Button
          size="lg"
          style={{ borderRadius: 16 }}
          onPress={() => router.replace("/(main)/bookings")}
        >
          <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
            View My Bookings
          </ButtonText>
        </Button>
        <Pressable
          onPress={() => router.replace("/(main)")}
          style={{ alignItems: "center", paddingVertical: 8 }}
        >
          <Text
            style={{
              fontSize: 14,
              color: Colors.light.iconMuted,
              fontWeight: "500",
            }}
          >
            Back to Home
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
