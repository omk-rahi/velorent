import { router, useLocalSearchParams } from "expo-router";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { getCarById } from "@/api/cars";
import { BookingHeader } from "@/components/features/booking/booking-header";
import { OptionCard } from "@/components/features/booking/option-card";
import { StepTitle } from "@/components/features/booking/step-title";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useBookingSteps } from "@/hooks/use-booking-steps";
import { useBookingStore } from "@/store/use-booking-store";
import { useQuery } from "@tanstack/react-query";

export default function DeliveryStep() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const insets = useSafeAreaInsets();

  const { deliveryMethod, deliveryAddress, setDeliveryMethod, setDeliveryAddress } =
    useBookingStore();

  const { data: carData, isLoading } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => getCarById(carId as string),
    enabled: !!carId,
  });
  const car = carData as any;

  const steps = useBookingSteps(car?.delivery_enabled);

  const addressData = Array.isArray(car?.address) ? car.address[0] : car?.address;
  const pickupLocation = addressData
    ? `${addressData.address_line1}, ${addressData.city}`
    : "Location not available";

  const handleNext = () => {
    if (deliveryMethod === "delivery" && !deliveryAddress.trim()) {
      Alert.alert("Delivery Address", "Please enter a delivery address.");
      return;
    }
    router.push({ pathname: "/car-book/deposit", params: { carId } });
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <Loader />
      </View>
    );
  }

  if (!car) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <Text style={{ color: Colors.light.iconMuted }}>Car not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      edges={["top"]}
    >
      <BookingHeader steps={steps} currentStepKey="delivery" car={car} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        >
          <VStack style={{ gap: 16 }}>
            <StepTitle
              title="Delivery Method"
              subtitle="How would you like to receive the car?"
            />

            <OptionCard
              selected={deliveryMethod === "pickup"}
              onPress={() => setDeliveryMethod("pickup")}
              icon="location-outline"
              title="Self Pickup"
              badge="Free"
              subtitle={pickupLocation}
            />

            <OptionCard
              selected={deliveryMethod === "delivery"}
              onPress={() => setDeliveryMethod("delivery")}
              icon="car-outline"
              title="Home Delivery"
              badge={`₹${car.delivery_rate || 0}`}
              subtitle="Car delivered to your address"
            />

            {deliveryMethod === "delivery" && (
              <VStack style={{ gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.text }}>
                  Delivery Address
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.light.card,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: deliveryAddress
                      ? Colors.light.tint
                      : Colors.light.cardBorder,
                    padding: 14,
                  }}
                >
                  <TextInput
                    placeholder="Enter your full delivery address..."
                    placeholderTextColor={Colors.light.iconMuted}
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    multiline
                    numberOfLines={3}
                    style={{
                      fontSize: 14,
                      color: Colors.light.text,
                      textAlignVertical: "top",
                      minHeight: 72,
                    }}
                  />
                </View>
              </VStack>
            )}
          </VStack>
        </ScrollView>

        {/* Bottom bar */}
        <View
          style={{
            backgroundColor: Colors.light.card,
            borderTopWidth: 1,
            borderTopColor: Colors.light.cardBorder,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          <Button size="lg" style={{ borderRadius: 16 }} onPress={handleNext}>
            <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>Continue</ButtonText>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
