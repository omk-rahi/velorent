import { Colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { checkPhoneExists } from "@/api/auth";
import { Alert, AlertIcon, AlertText } from "@/components/ui/alert";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSendOTP } from "@/hooks/mutations/auth";
import { AlertCircleIcon } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const { mutate: sendOTP, status, error } = useSendOTP();
  const [userNotFound, setUserNotFound] = useState(false);
  const [checking, setChecking] = useState(false);

  const isInvalid = phone.length > 0 && phone.length !== 10;

  async function onSubmit() {
    setUserNotFound(false);
    setChecking(true);
    try {
      const exists = await checkPhoneExists(`+91${phone}`);
      if (!exists) {
        setUserNotFound(true);
        return;
      }
    } catch {
      setUserNotFound(true);
      return;
    } finally {
      setChecking(false);
    }

    sendOTP(`+91${phone}`, {
      onSuccess: () => {
        router.push({
          pathname: "/(auth)/verify-otp",
          params: { phone },
        });
      },
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="items-center mt-10">
            <Image
              source={require("@/assets/images/logo.png")}
              style={{ width: 160, height: 160 }}
              width={160}
              height={160}
            />
          </View>

          <VStack className="flex-1 px-6 gap-7">
            <VStack space="xs">
              <Heading
                size="3xl"
                className="text-center"
                style={{
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  color: Colors.light.text,
                }}
              >
                Welcome back 👋
              </Heading>
              <Text
                className="text-center"
                size="md"
                style={{ color: Colors.light.iconMuted, marginTop: 4 }}
              >
                Log in to your account
              </Text>
            </VStack>

            <FormControl
              isInvalid={isInvalid}
              isDisabled={false}
              isReadOnly={false}
              isRequired
            >
              <FormControlLabel>
                <FormControlLabelText
                  style={{
                    fontWeight: "600",
                    color: Colors.light.text,
                    fontSize: 14,
                  }}
                >
                  Mobile number
                </FormControlLabelText>
              </FormControlLabel>

              <Input
                variant="outline"
                size="xl"
                style={{
                  borderRadius: 16,
                  borderColor: isInvalid ? Colors.light.error : "#E2E8F0",
                  borderWidth: 1,
                  backgroundColor: "#FFFFFF",
                  height: 56,
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
                  onChangeText={(v) => {
                    setPhone(v);
                    setUserNotFound(false);
                  }}
                  style={{
                    fontSize: 15,
                    letterSpacing: 0.5,
                    color: Colors.light.text,
                  }}
                />
              </Input>

              {!isInvalid && (
                <FormControlHelper>
                  <FormControlHelperText>
                    We&apos;ll send you an OTP for verification
                  </FormControlHelperText>
                </FormControlHelper>
              )}

              {isInvalid && (
                <FormControlError>
                  <FormControlErrorText>
                    Please enter a valid 10-digit mobile number
                  </FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            {userNotFound && (
              <Alert action="error">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>
                  No account found with this number. Please register first.
                </AlertText>
              </Alert>
            )}

            {!userNotFound && error && (
              <Alert action="error">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>{error.message}</AlertText>
              </Alert>
            )}
          </VStack>

          <View className="px-5 pb-6 gap-4">
            <Button
              size="xl"
              isDisabled={phone.length !== 10 || status === "pending" || checking}
              onPress={onSubmit}
              style={{ borderRadius: 16 }}
            >
              {(status === "pending" || checking) && (
                <ButtonSpinner className="mr-2" color="white" />
              )}
              <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                Continue
              </ButtonText>
            </Button>

            <HStack className="justify-center items-center flex-wrap gap-1 px-4">
              <Text size="sm" className="text-typography-400 text-center">
                By continuing, you agree to our
              </Text>
              <Button variant="link" className="p-0" size="xs">
                <ButtonText className="text-primary-500">
                  Terms & Conditions
                </ButtonText>
              </Button>
            </HStack>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
