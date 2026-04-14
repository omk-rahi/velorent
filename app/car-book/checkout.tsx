import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { createBooking } from "@/api/bookings";
import { getCarById } from "@/api/cars";
import { createCashfreeOrder, verifyCashfreeOrder } from "@/api/cashfree";
import { BookingHeader } from "@/components/features/booking/booking-header";
import { PriceRow } from "@/components/features/booking/price-row";
import { StepTitle } from "@/components/features/booking/step-title";
import { SummaryRow } from "@/components/features/booking/summary-row";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useBookingSteps } from "@/hooks/use-booking-steps";
import { parseDateTime } from "@/lib/booking-utils";
import { useBookingStore } from "@/store/use-booking-store";
import useUser from "@/store/use-user";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CFDropCheckoutPayment,
  CFEnvironment,
  CFSession,
  CFThemeBuilder,
} from "cashfree-pg-api-contract";
import {
  CFErrorResponse,
  CFPaymentGatewayService,
} from "react-native-cashfree-pg-sdk";

const CASHFREE_ENVIRONMENT =
  process.env.EXPO_PUBLIC_CASHFREE_ENV?.toUpperCase() === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
const CASHFREE_CANCEL_ERROR_CODE = "action_cancelled";
const PAYMENT_VERIFY_MAX_ATTEMPTS = 4;
const PAYMENT_VERIFY_DELAY_MS = 2000;

export default function CheckoutStep() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const queryClient = useQueryClient();

  const {
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    deliveryMethod,
    deliveryAddress,
    depositMethod,
    reset,
  } = useBookingStore();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: "percent" | "flat";
    value: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const { data: carData, isLoading } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => getCarById(carId as string),
    enabled: !!carId,
  });
  const car = carData as any;

  const steps = useBookingSteps(car?.delivery_enabled);

  const costs = useMemo(() => {
    if (!car) return null;
    const pickup = parseDateTime(pickupDate, pickupTime);
    const dropoff = parseDateTime(dropoffDate, dropoffTime);
    const durationMs = dropoff.getTime() - pickup.getTime();
    const hours = Math.max(0, Math.ceil(durationMs / (1000 * 60 * 60)));
    const rentalCost = car.hourly_price * hours;
    const deposit = depositMethod === "pay" ? car.deposit_amount || 0 : 0;
    const deliveryCharge =
      deliveryMethod === "delivery" ? car.delivery_rate || 0 : 0;
    const subtotal = rentalCost + deposit + deliveryCharge;
    const discount = appliedCoupon
      ? appliedCoupon.type === "percent"
        ? subtotal * (appliedCoupon.value / 100)
        : appliedCoupon.value
      : 0;
    const cappedDiscount = Math.min(discount, subtotal);
    return {
      hours,
      rentalCost,
      deposit,
      deliveryCharge,
      discount: cappedDiscount,
      total: subtotal - cappedDiscount,
    };
  }, [
    car,
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    deliveryMethod,
    depositMethod,
    appliedCoupon,
  ]);

  useEffect(() => {
    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  const applyCoupon = () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) {
      setCouponError("Enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }
    if (normalized === "SAVE10") {
      setAppliedCoupon({ code: normalized, type: "percent", value: 10 });
      setCouponError(null);
      return;
    }
    if (normalized === "FLAT200") {
      setAppliedCoupon({ code: normalized, type: "flat", value: 200 });
      setCouponError(null);
      return;
    }
    setAppliedCoupon(null);
    setCouponError("Invalid coupon code.");
  };

  const startCashfreeCheckout = (orderId: string, paymentSessionId: string) =>
    new Promise<string>((resolve, reject) => {
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        CFPaymentGatewayService.removeCallback();
        fn();
      };

      try {
        CFPaymentGatewayService.setCallback({
          onVerify: (verifiedOrderId: string) => {
            settle(() => resolve(verifiedOrderId || orderId));
          },
          onError: (error: CFErrorResponse, failedOrderId: string) => {
            const errorOrderId = failedOrderId || orderId;
            const code = error?.getCode?.();
            const message =
              error?.getMessage?.() || `Payment failed for ${errorOrderId}.`;
            const err: Error & { code?: string } = new Error(message);
            if (typeof code === "string") err.code = code;
            settle(() => reject(err));
          },
        });

        const session = new CFSession(
          paymentSessionId,
          orderId,
          CASHFREE_ENVIRONMENT,
        );
        const theme = new CFThemeBuilder()
          .setNavigationBarBackgroundColor("#1A56FF")
          .setNavigationBarTextColor("#FFFFFF")
          .setButtonBackgroundColor("#1A56FF")
          .setButtonTextColor("#FFFFFF")
          .setPrimaryTextColor("#0F172A")
          .setSecondaryTextColor("#64748B")
          .setBackgroundColor("#FFFFFF")
          .build();
        const checkout = new CFDropCheckoutPayment(session, null, theme);
        CFPaymentGatewayService.doPayment(checkout);
      } catch (error: any) {
        settle(() =>
          reject(new Error(error?.message ?? "Failed to start payment.")),
        );
      }
    });

  const verifyCashfreeOrderWithRetry = async (orderId: string) => {
    let lastResult: Awaited<ReturnType<typeof verifyCashfreeOrder>> | null =
      null;
    for (let attempt = 1; attempt <= PAYMENT_VERIFY_MAX_ATTEMPTS; attempt++) {
      const result = await verifyCashfreeOrder(orderId);
      lastResult = result;
      if (result.isPaid) return result;
      if (attempt < PAYMENT_VERIFY_MAX_ATTEMPTS) {
        await new Promise((resolve) =>
          setTimeout(resolve, PAYMENT_VERIFY_DELAY_MS),
        );
      }
    }
    return lastResult;
  };

  const handleBook = async () => {
    if (!profile) {
      Alert.alert("Login Required", "Please login to book a car.", [
        { text: "Login", onPress: () => router.push("/(auth)/login") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    if (!costs || !car) return;
    if (!car?.host_id) {
      Alert.alert(
        "Booking Error",
        "Host id is missing for this car. Please refresh and try again.",
      );
      return;
    }
    if (costs.hours < 6) {
      Alert.alert(
        "Minimum Booking Duration",
        "You must book this car for at least 6 hours.",
      );
      return;
    }
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Supported",
        "Cashfree checkout is only available on Android and iOS.",
      );
      return;
    }

    try {
      setIsBooking(true);
      const order = await createCashfreeOrder({
        amount: costs.total,
        currency: "INR",
        customerId: profile.id,
        customerName: profile.full_name,
        customerEmail: profile.email,
        customerPhone: profile.phone,
        orderNote: `Car booking for ${car.id}`,
        metadata: {
          car_id: car.id,
          host_id: car.host_id,
          pickup_type:
            deliveryMethod === "pickup" ? "self_pickup" : "home_delivery",
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          dropoff_date: dropoffDate,
          dropoff_time: dropoffTime,
        },
      });

      const completedOrderId = await startCashfreeCheckout(
        order.orderId,
        order.paymentSessionId,
      );

      const paymentVerification =
        await verifyCashfreeOrderWithRetry(completedOrderId);
      if (!paymentVerification?.isPaid) {
        Alert.alert(
          "Payment Pending",
          "Payment was not confirmed. Please try again or check your payment status.",
        );
        return;
      }

      const result = await createBooking({
        car_id: car.id,
        customer_id: profile.id,
        host_id: car.host_id,
        start_time: parseDateTime(pickupDate, pickupTime).toISOString(),
        end_time: parseDateTime(dropoffDate, dropoffTime).toISOString(),
        total_hours: costs.hours,
        base_amount: costs.rentalCost,
        delivery_amount: costs.deliveryCharge,
        commission_percentage: car.commission_percentage || 0,
        commission_amount:
          (costs.total * (car.commission_percentage || 0)) / 100,
        deposit_amount: costs.deposit,
        deposit_status: costs.deposit > 0 ? "paid" : "pending",
        total_amount: costs.total,
        pickup_type:
          deliveryMethod === "pickup" ? "self_pickup" : "home_delivery",
        delivery_address:
          deliveryMethod === "delivery"
            ? deliveryAddress || undefined
            : undefined,
        status: "pending",
      });

      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "car-availability" &&
          q.queryKey[1] === car.id,
      });
      queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "car" &&
          q.queryKey[1] === car.id,
      });
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "cars",
      });

      const successParams = {
        carId,
        bookedId: result?.id ?? "",
        pickupDate,
        pickupTime,
        dropoffDate,
        dropoffTime,
        totalAmount: costs.total.toFixed(2),
      };
      reset();
      router.replace({
        pathname: "/car-book/success",
        params: successParams,
      } as any);
    } catch (error: any) {
      if (error?.code === CASHFREE_CANCEL_ERROR_CODE) {
        Alert.alert("Payment Cancelled", "You cancelled the payment.");
      } else {
        console.log(error);
        Alert.alert(
          "Error",
          error?.message ?? "Failed to complete booking. Please try again.",
        );
      }
    } finally {
      CFPaymentGatewayService.removeCallback();
      setIsBooking(false);
    }
  };

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

  if (!car || !costs) {
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
      <BookingHeader steps={steps} currentStepKey="checkout" car={car} />

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
              title="Review & Pay"
              subtitle="Apply a coupon and confirm your booking"
            />

            {/* Coupon */}
            <VStack style={{ gap: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: Colors.light.text,
                }}
              >
                Coupon Code
              </Text>
              <HStack style={{ gap: 10 }}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: Colors.light.card,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: appliedCoupon
                      ? Colors.light.success
                      : Colors.light.cardBorder,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    height: 48,
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={
                      appliedCoupon
                        ? Colors.light.success
                        : Colors.light.iconMuted
                    }
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    placeholder="Enter coupon code"
                    placeholderTextColor={Colors.light.iconMuted}
                    value={couponCode}
                    onChangeText={(t) => {
                      setCouponCode(t);
                      if (couponError) setCouponError(null);
                    }}
                    autoCapitalize="characters"
                    style={{ flex: 1, fontSize: 14, color: Colors.light.text }}
                  />
                  {appliedCoupon && (
                    <Pressable
                      onPress={() => {
                        setAppliedCoupon(null);
                        setCouponCode("");
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={Colors.light.iconMuted}
                      />
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={applyCoupon}
                  style={{
                    backgroundColor: Colors.light.tint,
                    borderRadius: 12,
                    paddingHorizontal: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    height: 48,
                  }}
                >
                  <Text
                    style={{ color: "white", fontWeight: "700", fontSize: 14 }}
                  >
                    Apply
                  </Text>
                </Pressable>
              </HStack>

              {appliedCoupon && (
                <HStack style={{ alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={Colors.light.success}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.light.success,
                      fontWeight: "600",
                    }}
                  >
                    {appliedCoupon.code} applied
                  </Text>
                </HStack>
              )}
              {couponError && (
                <HStack style={{ alignItems: "center", gap: 6 }}>
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={Colors.light.error}
                  />
                  <Text style={{ fontSize: 12, color: Colors.light.error }}>
                    {couponError}
                  </Text>
                </HStack>
              )}
            </VStack>

            {/* Price breakdown */}
            <View
              style={{
                backgroundColor: Colors.light.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                padding: 18,
                gap: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Colors.light.text,
                }}
              >
                Price Breakdown
              </Text>

              <PriceRow
                label={`₹${car.hourly_price} × ${costs.hours} hr${costs.hours !== 1 ? "s" : ""}`}
                value={`₹${costs.rentalCost.toFixed(2)}`}
              />

              {depositMethod === "pay" && costs.deposit > 0 && (
                <PriceRow
                  label="Security Deposit"
                  value={`₹${costs.deposit.toFixed(2)}`}
                  sublabel="Refundable"
                />
              )}

              {deliveryMethod === "delivery" && costs.deliveryCharge > 0 && (
                <PriceRow
                  label="Delivery Charge"
                  value={`₹${costs.deliveryCharge.toFixed(2)}`}
                />
              )}

              {costs.discount > 0 && (
                <PriceRow
                  label="Coupon Discount"
                  value={`-₹${costs.discount.toFixed(2)}`}
                  valueColor={Colors.light.success}
                />
              )}

              <View
                style={{ height: 1, backgroundColor: Colors.light.cardBorder }}
              />

              <HStack
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: Colors.light.text,
                  }}
                >
                  Total
                </Text>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: Colors.light.tint,
                  }}
                >
                  ₹{costs.total.toFixed(2)}
                </Text>
              </HStack>
            </View>

            {/* Trip summary */}
            <View
              style={{
                backgroundColor: Colors.light.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                padding: 18,
                gap: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: Colors.light.text,
                  marginBottom: 2,
                }}
              >
                Trip Summary
              </Text>
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
              <SummaryRow
                icon={
                  deliveryMethod === "pickup"
                    ? "location-outline"
                    : "car-outline"
                }
                label="Method"
                value={
                  deliveryMethod === "pickup" ? "Self Pickup" : "Home Delivery"
                }
              />
              <SummaryRow
                icon="shield-checkmark-outline"
                label="Deposit"
                value={
                  depositMethod === "pay"
                    ? "Pay Online"
                    : "Two-Wheeler Collateral"
                }
              />
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
          <HStack
            style={{
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <VStack style={{ gap: 1 }}>
              <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
                Total Amount
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: Colors.light.tint,
                  letterSpacing: -0.3,
                }}
              >
                ₹{costs.total.toFixed(2)}
              </Text>
            </VStack>
            <Button
              size="lg"
              style={{ paddingHorizontal: 20, borderRadius: 16 }}
              isDisabled={isBooking}
              onPress={handleBook}
            >
              <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
                {isBooking ? "Processing Payment..." : "Pay & Confirm Booking"}
              </ButtonText>
            </Button>
          </HStack>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
