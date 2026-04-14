import { router } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { AlertCircleIcon } from "lucide-react-native";

import { register } from "@/api/auth";
import { Colors } from "@/constants/theme";

import { useMutation } from "@tanstack/react-query";

export default function RegisterWithOTP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

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

          <View className="px-5 pb-6">
            <Button
              size="xl"
              isDisabled={!isFormValid || status === "pending"}
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
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
