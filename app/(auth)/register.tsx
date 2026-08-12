import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { router } from "expo-router";
import { AlertCircleIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { register, signInWithOAuth } from "@/api/auth";
import { Colors } from "@/constants/theme";

import { useMutation } from "@tanstack/react-query";

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#EA4335"
      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 15.02 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.91 3.03C6.23 7.56 8.87 5.04 12 5.04z"
    />
    <Path
      fill="#4285F4"
      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.54-5.19 3.54-8.71z"
    />
    <Path
      fill="#FBBC05"
      d="M5.3 14.59a7.16 7.16 0 010-4.18l-3.91-3.03A11.96 11.96 0 001 12c0 1.92.45 3.74 1.28 5.37l4.02-3.78z"
    />
    <Path
      fill="#34A853"
      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.89-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.77-2.12-6.72-4.98l-4.02 3.12C3.37 20.33 7.35 23 12 23z"
    />
  </Svg>
);

const FacebookIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#1877F2"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </Svg>
);

export default function RegisterWithOTP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [socialLoading, setSocialLoading] = useState<
    "google" | "facebook" | null
  >(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    setSocialLoading(provider);
    setSocialError(null);
    try {
      await signInWithOAuth(provider);
    } catch (err: any) {
      console.error(`${provider} sign in failed:`, err);
      setSocialError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  };

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
  });

  const { mutate, status, error } = useMutation({
    mutationFn: register,
    onSuccess() {
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phone },
      });
    },
  });

  const isNameValid = name.trim().length > 1;
  const isEmailValid = email.includes("@");
  const isPhoneValid = phone.length === 10;

  const isFormValid = isNameValid && isEmailValid && isPhoneValid;

  function handleSubmit() {
    mutate({ phone: `+91${phone}`, email: email, fullName: name });
  }

  const inputStyle = {
    borderRadius: 16,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    height: 56,
  };

  const labelStyle = {
    fontWeight: "600" as const,
    color: "#64748B",
    fontSize: 13,
    letterSpacing: 0.5,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <VStack className="flex-1 px-6 mt-12" space="lg">
            <VStack space="xs">
              <Heading
                size="3xl"
                style={{
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  color: Colors.light.text,
                }}
              >
                Create account
              </Heading>
              <Text
                size="md"
                style={{ color: Colors.light.iconMuted, marginTop: 4 }}
              >
                Sign up to get started
              </Text>
            </VStack>

            <FormControl isInvalid={touched.name && !isNameValid}>
              <FormControlLabel style={{ marginBottom: 6 }}>
                <FormControlLabelText style={labelStyle}>
                  FULL NAME
                </FormControlLabelText>
              </FormControlLabel>

              <Input variant="outline" size="xl" style={inputStyle}>
                <InputField
                  placeholder="John Doe"
                  value={name}
                  onChangeText={setName}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  style={{ fontSize: 16, color: Colors.light.text }}
                />
              </Input>

              <FormControlError>
                <FormControlErrorText>
                  Name must be at least 2 characters
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            <FormControl isInvalid={touched.email && !isEmailValid}>
              <FormControlLabel style={{ marginBottom: 6 }}>
                <FormControlLabelText style={labelStyle}>
                  EMAIL ADDRESS
                </FormControlLabelText>
              </FormControlLabel>

              <Input variant="outline" size="xl" style={inputStyle}>
                <InputField
                  placeholder="john@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                  style={{ fontSize: 16, color: Colors.light.text }}
                />
              </Input>

              <FormControlError>
                <FormControlErrorText>
                  Enter a valid email address
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            <FormControl isInvalid={touched.phone && !isPhoneValid}>
              <FormControlLabel style={{ marginBottom: 6 }}>
                <FormControlLabelText style={labelStyle}>
                  MOBILE NUMBER
                </FormControlLabelText>
              </FormControlLabel>

              <Input
                variant="outline"
                size="xl"
                style={{
                  ...inputStyle,
                  borderColor:
                    touched.phone && !isPhoneValid
                      ? Colors.light.error
                      : "#E2E8F0",
                }}
              >
                <InputSlot className="pl-4">
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: Colors.light.tint,
                    }}
                  >
                    +91
                  </Text>
                </InputSlot>

                <InputField
                  placeholder="Enter 10-digit number"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(v) => /^\d*$/.test(v) && setPhone(v)}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  style={{ fontSize: 16, color: Colors.light.text }}
                />
              </Input>

              <FormControlError>
                <FormControlErrorText>
                  Enter a valid 10-digit number
                </FormControlErrorText>
              </FormControlError>
            </FormControl>

            {error && (
              <Alert action="error">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>{error.message}</AlertText>
              </Alert>
            )}
          </VStack>

          <View className="px-5 pb-6 gap-4">
            <Button
              size="xl"
              isDisabled={
                !isFormValid || status === "pending" || socialLoading !== null
              }
              onPress={handleSubmit}
              style={{ borderRadius: 16 }}
            >
              {status === "pending" && (
                <ButtonSpinner className="mr-2" color="white" />
              )}
              <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                Register
              </ButtonText>
            </Button>

            {/* Or connect with divider */}
            <HStack className="items-center my-1 justify-center">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or connect with
              </Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </HStack>

            {/* Social Buttons */}
            <VStack space="md">
              <Button
                variant="outline"
                size="xl"
                isDisabled={socialLoading !== null || status === "pending"}
                onPress={() => handleSocialLogin("google")}
                style={{
                  borderRadius: 16,
                  borderColor: "#E2E8F0",
                  backgroundColor: "#FFFFFF",
                  height: 56,
                }}
              >
                <HStack space="md" className="items-center justify-center">
                  {socialLoading === "google" ? (
                    <ButtonSpinner color="#1E293B" />
                  ) : (
                    <GoogleIcon size={20} />
                  )}
                  <ButtonText
                    style={{
                      fontWeight: "600",
                      fontSize: 16,
                      color: "#1E293B",
                    }}
                  >
                    {socialLoading === "google"
                      ? "Connecting Google..."
                      : "Continue with Google"}
                  </ButtonText>
                </HStack>
              </Button>

              <Button
                variant="outline"
                size="xl"
                isDisabled={socialLoading !== null || status === "pending"}
                onPress={() => handleSocialLogin("facebook")}
                style={{
                  borderRadius: 16,
                  borderColor: "#E2E8F0",
                  backgroundColor: "#FFFFFF",
                  height: 56,
                }}
              >
                <HStack space="md" className="items-center justify-center">
                  {socialLoading === "facebook" ? (
                    <ButtonSpinner color="#1877F2" />
                  ) : (
                    <FacebookIcon size={20} />
                  )}
                  <ButtonText
                    style={{
                      fontWeight: "600",
                      fontSize: 16,
                      color: "#1E293B",
                    }}
                  >
                    {socialLoading === "facebook"
                      ? "Connecting Facebook..."
                      : "Continue with Facebook"}
                  </ButtonText>
                </HStack>
              </Button>
            </VStack>

            {socialError && (
              <Alert action="error" className="rounded-xl">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>{socialError}</AlertText>
              </Alert>
            )}
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
