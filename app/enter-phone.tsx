import { Colors } from "@/constants/theme";
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
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { supabase } from "@/lib/supabase";
import useUser from "@/store/use-user";

export default function EnterPhoneScreen() {
  const profile = useUser((state) => state.profile);
  const updateProfile = useUser((state) => state.updateProfile);
  const clearProfile = useUser((state) => state.clearProfile);

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isInvalid = phone.length > 0 && phone.length !== 10;

  const handleSave = async () => {
    if (!profile) return;
    setErrorMsg(null);
    setLoading(true);

    try {
      const fullPhone = `+91${phone}`;

      // Check if phone number is already registered with another account
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", fullPhone)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        setErrorMsg("This mobile number is already in use by another account.");
        setLoading(false);
        return;
      }

      // Upsert the profile row — handles both new social users (no row yet)
      // and existing users who somehow ended up without a phone.
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: profile.id,
          full_name: profile.full_name ?? "",
          email: profile.email ?? "",
          avatar_url:
            profile.avatar_url ??
            "https://covwleocjigusbqbkxdj.supabase.co/storage/v1/object/public/default/user.png",
          role_id: 3,
          phone: fullPhone,
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Update local profile state
      updateProfile({ phone: fullPhone });
    } catch (err: any) {
      console.error("Failed to save phone number:", err);
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      clearProfile();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <VStack className="flex-1 px-6 mt-16 gap-8">
            <VStack space="xs">
              <Heading
                size="3xl"
                style={{
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  color: Colors.light.text,
                }}
              >
                One last step!
              </Heading>
              <Text
                size="md"
                style={{ color: Colors.light.iconMuted, marginTop: 4 }}
              >
                Please enter your mobile number to complete your profile registration.
              </Text>
            </VStack>

            <FormControl
              isInvalid={isInvalid}
              isDisabled={loading}
              isRequired
            >
              <FormControlLabel style={{ marginBottom: 6 }}>
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
                    if (/^\d*$/.test(v)) {
                      setPhone(v);
                      setErrorMsg(null);
                    }
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
                    We need your mobile number to coordinate car bookings.
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

            {errorMsg && (
              <Alert action="error" variant="solid" className="rounded-xl">
                <AlertIcon as={AlertCircleIcon} />
                <AlertText>{errorMsg}</AlertText>
              </Alert>
            )}
          </VStack>

          <View className="px-5 pb-8 gap-4">
            <Button
              size="xl"
              isDisabled={phone.length !== 10 || loading}
              onPress={handleSave}
              style={{ borderRadius: 16 }}
            >
              {loading && <ButtonSpinner className="mr-2" color="white" />}
              <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
                Save & Continue
              </ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
