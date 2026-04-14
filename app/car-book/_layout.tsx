import { Stack } from "expo-router";

export default function CarBookLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: "Book Car" }} />
      <Stack.Screen name="pickup" options={{ title: "Pickup Location" }} />
      <Stack.Screen name="delivery" options={{ title: "Delivery Option" }} />
      <Stack.Screen name="datetime" options={{ title: "Select Date & Time" }} />
      <Stack.Screen name="dropoff" options={{ title: "Drop-off Location" }} />
      <Stack.Screen name="deposit" options={{ title: "Security Deposit" }} />
      <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
      <Stack.Screen name="success" options={{ title: "Booking Success" }} />
    </Stack>
  );
}
