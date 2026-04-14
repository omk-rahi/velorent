import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
} from "@/components/ui/form-control";

import { Input, InputField } from "@/components/ui/input";

import { upsertProfile } from "@/api/profile";
import useUser from "@/store/use-user";
import { router } from "expo-router";

export default function EditProfileScreen() {
  const user = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user?.profile) {
      setName(user.profile.full_name ?? "");
      setEmail(user.profile.email ?? "");
    }
  }, [user?.profile]);

  const { mutate, isPending } = useMutation({
    mutationFn: upsertProfile,
    onSuccess: (data: any) => {
      if (data) {
        user.updateProfile({
          full_name: data.full_name,
          email: data.email,
          avatar_url: data.avatar_url,
        });
      }
      router.back();
    },
  });

  const handleSave = () => {
    if (!user.profile?.id) return;
    mutate({ id: user.profile.id, name, email });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FC]">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160 }}
        >
          <VStack className="gap-6 mt-4">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <VStack space="xs">
              <Heading size="2xl" style={{ fontWeight: "800", letterSpacing: -0.5 }}>
                Edit profile
              </Heading>
              <Text className="text-typography-500" style={{ fontSize: 15 }}>
                Update your personal information
              </Text>
            </VStack>
          </VStack>

          <FormControl size="md" className="mt-8">
            <FormControlLabel style={{ marginBottom: 6 }}>
              <FormControlLabelText
                style={{ color: "#64748B", fontWeight: "600", fontSize: 13, letterSpacing: 0.5 }}
              >
                FULL NAME
              </FormControlLabelText>
            </FormControlLabel>

            <Input
              size="xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                height: 56,
              }}
            >
              <InputField
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                style={{ fontSize: 16, color: "#0F172A" }}
              />
            </Input>
          </FormControl>

          <FormControl size="md" className="mt-4">
            <FormControlLabel style={{ marginBottom: 6 }}>
              <FormControlLabelText
                style={{ color: "#64748B", fontWeight: "600", fontSize: 13, letterSpacing: 0.5 }}
              >
                EMAIL ADDRESS
              </FormControlLabelText>
            </FormControlLabel>

            <Input
              size="xl"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                height: 56,
              }}
            >
              <InputField
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                style={{ fontSize: 16, color: "#0F172A" }}
              />
            </Input>
          </FormControl>
        </ScrollView>

        <VStack space="md" className="px-5 pb-6 pt-3 bg-transparent">
          <Button
            size="xl"
            onPress={handleSave}
            disabled={isPending}
            style={{ borderRadius: 16 }}
          >
            {isPending && <ButtonSpinner color="#fff" />}
            <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
              Save changes
            </ButtonText>
          </Button>
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
