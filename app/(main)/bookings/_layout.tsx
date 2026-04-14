import { Stack } from "expo-router";

export default function BookingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "My Bookings" }} />
      <Stack.Screen name="[id]" options={{ title: "Booking Details" }} />
      <Stack.Screen name="otp" options={{ title: "Booking OTP" }} />
      <Stack.Screen name="dispute" options={{ title: "Raise Dispute" }} />
      <Stack.Screen name="review" options={{ title: "Leave Review" }} />
    </Stack>
  );
}
