import {
  createDigilockerURL,
  getDigilockerDocument,
  getDigilockerStatus,
} from "@/api/cashfree";
import { updateVerificationStatus } from "@/api/profile";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import {
  extractIdentityAddress,
  extractIdentityField,
} from "@/lib/verification-identity";
import useUser from "@/store/use-user";
import { useDigiLocker } from "@cashfreepayments/react-native-digilocker";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type State = "idle" | "loading" | "success" | "error";

export default function VerifyAadhaarScreen() {
  const { verify } = useDigiLocker();
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const updateProfile = useUser((s) => s.updateProfile);
  const profileId = useUser((s) => s.profile?.id);

  const mutation = useMutation({
    mutationFn: () => createDigilockerURL(["AADHAAR"], "signin"),
    onSuccess: ({ url, verification_id }) => {
      verify(url, undefined, {
        userFlow: "signin",
        onSuccess: async () => {
          let aadhaarNumber: string | null = null;
          let aadhaarName: string | null = null;
          let aadhaarAddress: string | null = null;

          try {
            const status = await getDigilockerStatus(verification_id);
            aadhaarName =
              extractIdentityField(status.data, [
                "name",
                "full_name",
                "holder_name",
              ]) ?? null;
            aadhaarAddress = extractIdentityAddress(status.data);
            if (status.data.status === "AUTHENTICATED") {
              const document = await getDigilockerDocument(
                "AADHAAR",
                verification_id,
              );
              aadhaarNumber = extractIdentityField(document.data, [
                "aadhaar_number",
                "aadhaar_no",
                "uid",
                "eaadhaar",
                "masked_aadhaar",
                "aadhaar",
              ]);
              aadhaarName =
                aadhaarName ??
                extractIdentityField(document.data, [
                  "name",
                  "full_name",
                  "holder_name",
                ]);
              aadhaarAddress =
                aadhaarAddress ?? extractIdentityAddress(document.data);
            }
          } catch {
            // proceed even if document fetch fails
          }
          if (profileId) {
            try {
              const isVerified = await updateVerificationStatus(
                profileId,
                "aadhaar_verified",
                {
                  aadhaar_number: aadhaarNumber,
                  aadhaar_name: aadhaarName,
                  aadhaar_address: aadhaarAddress,
                },
              );
              updateProfile({ aadhaar_verified: isVerified });
            } catch (error: any) {
              setErrorMsg(error?.message ?? "Failed to save verification");
              setState("error");
              return;
            }
          }
          setState("success");
        },
        onError: (error: any) => {
          setErrorMsg(error?.message ?? "Verification failed");
          setState("error");
        },
        onCancel: () => setState("idle"),
      });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message);
    },
  });

  const handleStart = () => {
    setState("loading");
    mutation.mutate();
  };

  if (state === "success") {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.light.background }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <CheckCircle size={72} color={Colors.light.tint} />
          <Heading size="2xl" style={{ marginTop: 24, textAlign: "center" }}>
            Aadhaar Verified!
          </Heading>
          <Text
            style={{
              color: Colors.light.iconMuted,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Your Aadhaar has been successfully verified via DigiLocker.
          </Text>
          <Button
            size="xl"
            style={{ marginTop: 40, width: "100%" }}
            onPress={() => router.back()}
          >
            <ButtonText>Done</ButtonText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }}>
      <VStack style={{ flex: 1, padding: 20, gap: 24 }}>
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

        <VStack style={{ gap: 4 }}>
          <Heading size="2xl" style={{ fontWeight: "800", letterSpacing: -0.5 }}>
            Aadhaar Verification
          </Heading>
          <Text style={{ color: Colors.light.iconMuted, lineHeight: 20, fontSize: 15 }}>
            Verify your identity securely using DigiLocker. You will be redirected
            to log in with your Aadhaar number and OTP.
          </Text>
        </VStack>

        <VStack
          style={{
            backgroundColor: "rgba(26,86,255,0.06)",
            borderRadius: 16,
            padding: 16,
            gap: 10,
          }}
        >
          {[
            "Government-issued Aadhaar data",
            "Secured by DigiLocker (Govt. of India)",
            "No data stored without your consent",
          ].map((point) => (
            <HStack key={point} style={{ alignItems: "center", gap: 10 }}>
              <ShieldCheck size={16} color={Colors.light.tint} />
              <Text style={{ fontSize: 13, color: Colors.light.text, flex: 1 }}>
                {point}
              </Text>
            </HStack>
          ))}
        </VStack>

        {state === "error" && (
          <VStack
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ color: "#DC2626", fontSize: 13 }}>
              {errorMsg || "Verification failed. Please try again."}
            </Text>
          </VStack>
        )}
      </VStack>

      <VStack style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Button
          size="xl"
          isDisabled={state === "loading" || mutation.isPending}
          onPress={handleStart}
        >
          {(state === "loading" || mutation.isPending) && (
            <ButtonSpinner color="#fff" />
          )}
          <ButtonText>Verify with DigiLocker</ButtonText>
        </Button>
      </VStack>
    </SafeAreaView>
  );
}
