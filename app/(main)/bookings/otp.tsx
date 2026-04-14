import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function OtpScreen() {
  const { bookingId, otp } = useLocalSearchParams<{
    bookingId: string;
    otp: string;
  }>();
  const { bottom } = useSafeAreaInsets();

  const rawOtp = String(otp ?? "").trim();
  const hasOtp = /^\d{6}$/.test(rawOtp);
  const digits = rawOtp.split("");

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F7F8FC" }}
      edges={["top"]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <VStack style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#0F172A" }}>
            Handover OTP
          </Text>
          <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
            Booking #{(bookingId ?? "").slice(-8).toUpperCase()}
          </Text>
        </VStack>
      </View>

      <VStack
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: bottom + 20,
          gap: 16,
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: Colors.light.cardBorder,
            paddingHorizontal: 14,
            paddingVertical: 18,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: Colors.light.iconMuted,
              marginBottom: 14,
              fontWeight: 800,
            }}
          >
            Your booking OTP
          </Text>

          {hasOtp ? (
            <HStack style={{ gap: 10, justifyContent: "center" }}>
              {digits.map((digit, i) => (
                <View
                  key={i}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    borderWidth: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    borderColor: Colors.light.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: "#0F172A",
                    }}
                  >
                    {digit}
                  </Text>
                </View>
              ))}
            </HStack>
          ) : (
            <Text
              style={{
                fontSize: 14,
                color: Colors.light.iconMuted,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              OTP not available. Please contact support.
            </Text>
          )}
        </View>

        <HStack
          style={{
            gap: 10,
            alignItems: "flex-start",
            backgroundColor: "rgba(26,86,255,0.06)",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(26,86,255,0.15)",
            padding: 14,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.light.tint}
            style={{ marginTop: 1 }}
          />
          <Text
            style={{ flex: 1, fontSize: 13, color: "#374151", lineHeight: 20 }}
          >
            Keep this screen open while handover is being confirmed. Do not
            share this OTP with anyone else.
          </Text>
        </HStack>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: Colors.light.cardBorder,
            paddingHorizontal: 14,
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: Colors.light.iconMuted,
              marginBottom: 6,
            }}
          >
            Quick Steps
          </Text>
          <Text style={{ fontSize: 13, color: "#334155", lineHeight: 20 }}>
            1. Meet host at pickup point.
          </Text>
          <Text style={{ fontSize: 13, color: "#334155", lineHeight: 20 }}>
            2. Share this OTP with host.
          </Text>
          <Text style={{ fontSize: 13, color: "#334155", lineHeight: 20 }}>
            3. Wait until host confirms handover.
          </Text>
        </View>
      </VStack>
    </SafeAreaView>
  );
}
