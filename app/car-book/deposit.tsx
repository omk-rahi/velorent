import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

export default function DepositStep() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const insets = useSafeAreaInsets();

  const { depositMethod, setDepositMethod } = useBookingStore();

  const { data: carData, isLoading } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => getCarById(carId as string),
    enabled: !!carId,
  });
  const car = carData as any;

  const steps = useBookingSteps(car?.delivery_enabled);

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

  if (!car) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <Text style={{ color: Colors.light.iconMuted }}>Car not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      edges={["top"]}
    >
      <BookingHeader steps={steps} currentStepKey="deposit" car={car} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        <VStack style={{ gap: 16 }}>
          <StepTitle
            title="Security Deposit"
            subtitle="Choose how you want to provide the refundable deposit."
          />

          <OptionCard
            selected={depositMethod === "pay"}
            onPress={() => setDepositMethod("pay")}
            icon="card-outline"
            title="Pay Online"
            badge={`Rs ${car.deposit_amount || 0} refundable`}
            subtitle="Instant confirmation and fully refundable after your trip ends."
          />

          <OptionCard
            selected={depositMethod === "two_wheeler"}
            onPress={() => setDepositMethod("two_wheeler")}
            icon="bicycle-outline"
            title="Handover Two Wheeler"
            badge="Collateral option"
            subtitle="Hand over your two wheeler to the host as refundable collateral."
          />

          {/* Info note */}
          <View
            style={{
              backgroundColor: Colors.light.warning + "12",
              borderRadius: 12,
              padding: 12,
              flexDirection: "row",
              gap: 10,
              alignItems: "flex-start",
              borderWidth: 1,
              borderColor: Colors.light.warning + "30",
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors.light.warning}
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: Colors.light.warning,
                lineHeight: 18,
              }}
            >
              The deposit or collateral is returned once the car is returned in
              the same condition.
            </Text>
          </View>
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
        <Button
          size="lg"
          style={{ borderRadius: 16 }}
          onPress={() =>
            router.push({ pathname: "/car-book/checkout", params: { carId } })
          }
        >
          <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
            Continue
          </ButtonText>
        </Button>
      </View>
    </SafeAreaView>
  );
}
