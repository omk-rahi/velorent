import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { ArrowLeft, ImagePlus } from "lucide-react-native";
import { useState } from "react";
import {
    Image,
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

import { uploadAvatarAndUpdateProfile } from "@/api/profile";
import useUser from "@/store/use-user";
import { router } from "expo-router";

export default function AddProfileImageScreen() {
  const user = useUser();
  const [image, setImage] = useState<string | null>(
    user.profile?.avatar_url ?? null,
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!user.profile?.id || !image) return null;

      return await uploadAvatarAndUpdateProfile({
        userId: user.profile.id,
        avatarUri: image,
      });
    },
    onSuccess: (updatedProfile) => {
      if (updatedProfile) {
        user.updateProfile({
          avatar_url: updatedProfile.avatar_url ?? null,
        });
      }
      router.back();
    },

    onError(err) {
      console.log(err);
    },
  });

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
                Profile photo
              </Heading>
              <Text className="text-typography-500" style={{ fontSize: 15 }}>
                Upload or update your profile image
              </Text>
            </VStack>
          </VStack>

          <VStack className="items-center mt-12" space="md">
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.75}
              style={{
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
                position: "relative",
              }}
            >
              {image ? (
                <>
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: 164,
                      height: 164,
                      borderRadius: 82,
                    }}
                  />
                  <VStack
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      height: 44,
                      width: 44,
                      borderRadius: 22,
                      backgroundColor: "#1A56FF",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "#fff",
                    }}
                  >
                    <ImagePlus size={20} color="#fff" />
                  </VStack>
                </>
              ) : (
                <VStack space="sm" className="items-center">
                  <VStack
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 28,
                      backgroundColor: "rgba(26, 86, 255, 0.1)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 4,
                    }}
                  >
                    <ImagePlus size={24} color="#1A56FF" />
                  </VStack>
                  <Text style={{ fontWeight: "600", fontSize: 16, color: "#0F172A" }}>
                    Add photo
                  </Text>
                </VStack>
              )}
            </TouchableOpacity>

            <Text style={{ fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 12 }}>
              {image ? "Tap your photo to change it" : "Tap to select a new profile photo"}
            </Text>
          </VStack>
        </ScrollView>

        <VStack space="md" className="px-5 pb-6 pt-3 bg-transparent">
          <Button
            size="xl"
            onPress={() => mutate()}
            disabled={!image || isPending}
            style={{ borderRadius: 16 }}
          >
            {isPending && <ButtonSpinner color="#fff" />}
            <ButtonText style={{ fontWeight: "600", fontSize: 16 }}>
              Save photo
            </ButtonText>
          </Button>
        </VStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
