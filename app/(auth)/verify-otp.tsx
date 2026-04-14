import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useSendOTP, useVerifyOTP } from "@/hooks/mutations/auth";
import { AlertCircle } from "lucide-react-native";

export default function VerifyOtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const { mutate: verifyOTP, status, error } = useVerifyOTP();
  const { mutate: sendOTP } = useSendOTP();

  function onSubmit() {
    verifyOTP({ phone: `+91${phone}`, token: otp });
  }

  const resendOtp = () => {
    sendOTP(`+91${phone}`, {
      onSuccess() {
        setTimer(30);
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="items-center mt-12 mb-4">
            <LottieView
              source={require("@/assets/animations/otp.json")}
              autoPlay
              loop={false}
              style={{ width: 180, height: 180 }}
            />
          </View>

          <VStack className="flex-1 px-6 gap-8">
            <VStack space="xs">
              <Heading
                size="2xl"
                style={{
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  color: Colors.light.text,
                }}
              >
                Enter verification code
              </Heading>
              <Text
                size="md"
                style={{ color: Colors.light.iconMuted, marginTop: 4 }}
              >
                We sent a 6-digit code to{" "}
                <Text
                  size="md"
                  style={{ fontWeight: "700", color: Colors.light.text }}
                >
                  +91 {phone}
                </Text>
              </Text>
            </VStack>

            <OtpInput
              numberOfDigits={6}
              autoFocus
              hideStick
              blurOnFilled
              type="numeric"
              focusColor={Colors.light.tint}
              onTextChange={setOtp}
              onFilled={(value) => setOtp(value)}
              theme={{
                containerStyle: {
                  justifyContent: "space-between",
                },
                pinCodeContainerStyle: {
                  width: 48,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                },
                focusedPinCodeContainerStyle: {
                  borderColor: Colors.light.tint,
                },
                filledPinCodeContainerStyle: {
                  borderColor: Colors.light.tint,
                },
                pinCodeTextStyle: {
                  fontSize: 22,
                  fontWeight: "600",
                  color: Colors.light.text,
                },
                placeholderTextStyle: {
                  color: Colors.light.iconMuted,
                },
              }}
            />

            {error && (
              <Alert action="error" variant="solid" className="rounded-xl">
                <AlertIcon as={AlertCircle} size="lg" />
                <AlertText className="text-sm">
                  This verification code is invalid or has expired.
                </AlertText>
              </Alert>
            )}

            <HStack className="justify-center items-center gap-2">
              <Text size="sm" style={{ color: Colors.light.iconMuted }}>
                Didn&apos;t receive the code?
              </Text>

              <Button variant="link" isDisabled={timer > 0} onPress={resendOtp}>
                <ButtonText
                  style={{
                    color: timer > 0 ? Colors.light.iconMuted : Colors.light.tint,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
                </ButtonText>
              </Button>
            </HStack>
          </VStack>

          <View className="px-5 pb-6">
            <Button
              size="xl"
              isDisabled={otp.length !== 6 || status === "pending"}
              onPress={onSubmit}
              style={{ borderRadius: 16 }}
            >
              {status === "pending" && (
                <ButtonSpinner className="mr-2" color="white" />
              )}
              <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                Verify & Continue
              </ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
