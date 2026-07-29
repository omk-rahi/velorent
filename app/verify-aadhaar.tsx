import {
  createDigilockerURL,
  getDigilockerDocument,
  getDigilockerStatus,
} from "@/api/cashfree";
import { updateVerificationStatus } from "@/api/profile";
import {
  getManualVerificationStatus,
  submitManualVerification,
  uploadVerificationPhoto,
} from "@/api/verification";
import { useDigiLocker } from "@/components/providers/digilocker-provider";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ImageIcon,
  ShieldCheck,
} from "lucide-react-native";
import { useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type State = "idle" | "loading" | "success" | "error" | "pending_review";
type UploadStep = "idle" | "front" | "back" | "submitting";

export default function VerifyAadhaarScreen() {
  const { verify } = useDigiLocker();
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const updateProfile = useUser((s) => s.updateProfile);
  const profileId = useUser((s) => s.profile?.id);
  const aadhaarVerified = useUser((s) => s.profile?.aadhaar_verified);

  // Upload flow state
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);

  // Check for existing pending verification
  const { data: existingStatus } = useQuery({
    queryKey: ["manual-verification-status", profileId, "aadhaar"],
    queryFn: () => getManualVerificationStatus(profileId!, "aadhaar"),
    enabled: !!profileId,
  });

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

  // ── Manual upload flow ──────────────────────────────────────────────────────

  async function pickImage(side: "front" | "back") {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;

    if (side === "front") {
      setFrontUri(uri);
      setUploadStep("back");
    } else {
      setBackUri(uri);
    }
  }

  async function handleManualUpload() {
    if (!profileId || !frontUri || !backUri) return;

    setUploadStep("submitting");
    setState("loading");

    try {
      const [frontUrl, backUrl] = await Promise.all([
        uploadVerificationPhoto(profileId, "aadhaar", "front", frontUri),
        uploadVerificationPhoto(profileId, "aadhaar", "back", backUri),
      ]);

      await submitManualVerification(profileId, "aadhaar", frontUrl, backUrl);
      setState("pending_review");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Upload failed. Please try again.");
      setState("error");
      setUploadStep("idle");
    }
  }

  function startManualUpload() {
    setFrontUri(null);
    setBackUri(null);
    setUploadStep("front");
  }

  // ── Success state ───────────────────────────────────────────────────────────

  if (state === "success" || aadhaarVerified) {
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

  if (state === "pending_review") {
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
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: Colors.light.warning + "20",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={40} color={Colors.light.warning} />
          </View>
          <Heading size="2xl" style={{ marginTop: 24, textAlign: "center" }}>
            Under Review
          </Heading>
          <Text
            style={{
              color: Colors.light.iconMuted,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Your Aadhaar photos have been submitted for manual review. We'll
            verify them and update your profile shortly.
          </Text>
          <Button
            size="xl"
            style={{ marginTop: 40, width: "100%" }}
            onPress={() => router.back()}
          >
            <ButtonText>Back to Profile</ButtonText>
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // ── Already pending ─────────────────────────────────────────────────────────

  if (existingStatus === "pending") {
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

          <VStack
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.light.warning + "20",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={40} color={Colors.light.warning} />
            </View>
            <Heading size="xl" style={{ textAlign: "center" }}>
              Verification Pending
            </Heading>
            <Text
              style={{
                color: Colors.light.iconMuted,
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Your Aadhaar documents are under review. We'll notify you once
              verified.
            </Text>
          </VStack>
        </VStack>
      </SafeAreaView>
    );
  }

  // ── Manual upload steps ─────────────────────────────────────────────────────

  if (uploadStep !== "idle") {
    const isFrontDone = !!frontUri;
    const isBackDone = !!backUri;
    const canSubmit = isFrontDone && isBackDone;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }}>
        <VStack style={{ flex: 1, padding: 20, gap: 24 }}>
          <TouchableOpacity
            onPress={() => setUploadStep("idle")}
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
            <Heading
              size="2xl"
              style={{ fontWeight: "800", letterSpacing: -0.5 }}
            >
              Upload Aadhaar
            </Heading>
            <Text
              style={{
                color: Colors.light.iconMuted,
                lineHeight: 20,
                fontSize: 15,
              }}
            >
              Take clear photos of both sides of your Aadhaar card.
            </Text>
          </VStack>

          {/* Front photo */}
          <TouchableOpacity
            onPress={() => pickImage("front")}
            activeOpacity={0.8}
            style={{
              borderWidth: 2,
              borderColor: isFrontDone ? Colors.light.tint : "#E2E8F0",
              borderStyle: "dashed",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              gap: 10,
              backgroundColor: isFrontDone ? Colors.light.tint + "08" : "#fff",
            }}
          >
            {isFrontDone ? (
              <CheckCircle size={28} color={Colors.light.tint} />
            ) : (
              <ImageIcon size={28} color={Colors.light.icon} />
            )}
            <Text
              style={{
                fontWeight: "700",
                fontSize: 15,
                color: Colors.light.text,
              }}
            >
              {isFrontDone ? "Front Side" : "Tap to upload Front Side"}
            </Text>
            {!isFrontDone && (
              <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
                JPG, PNG · Max 10MB
              </Text>
            )}
          </TouchableOpacity>

          {/* Back photo */}
          <TouchableOpacity
            onPress={() => pickImage("back")}
            activeOpacity={0.8}
            style={{
              borderWidth: 2,
              borderColor: isBackDone ? Colors.light.tint : "#E2E8F0",
              borderStyle: "dashed",
              borderRadius: 16,
              padding: 20,
              alignItems: "center",
              gap: 10,
              backgroundColor: isBackDone ? Colors.light.tint + "08" : "#fff",
            }}
          >
            {isBackDone ? (
              <CheckCircle size={28} color={Colors.light.tint} />
            ) : (
              <ImageIcon size={28} color={Colors.light.icon} />
            )}
            <Text
              style={{
                fontWeight: "700",
                fontSize: 15,
                color: Colors.light.text,
              }}
            >
              {isBackDone ? "Back Side" : "Tap to upload Back Side"}
            </Text>
            {!isBackDone && (
              <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
                JPG, PNG · Max 10MB
              </Text>
            )}
          </TouchableOpacity>

          {state === "error" && (
            <VStack
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ color: "#DC2626", fontSize: 13 }}>
                {errorMsg || "Upload failed. Please try again."}
              </Text>
            </VStack>
          )}
        </VStack>

        <VStack style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Button
            size="xl"
            isDisabled={!canSubmit || uploadStep === "submitting"}
            onPress={handleManualUpload}
          >
            {uploadStep === "submitting" && <ButtonSpinner color="#fff" />}
            <ButtonText>Submit for Review</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  // ── Default screen ──────────────────────────────────────────────────────────

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
          <Heading
            size="2xl"
            style={{ fontWeight: "800", letterSpacing: -0.5 }}
          >
            Aadhaar Verification
          </Heading>
          <Text
            style={{
              color: Colors.light.iconMuted,
              lineHeight: 20,
              fontSize: 15,
            }}
          >
            Upload clear photos of your Aadhaar card for manual verification, or
            verify instantly using DigiLocker.
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

      <VStack style={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>
        <Button size="xl" onPress={startManualUpload}>
          <ButtonText>Upload Photos</ButtonText>
        </Button>

        {/* DigiLocker alternative */}
        <TouchableOpacity
          onPress={handleStart}
          disabled={state === "loading" || mutation.isPending}
          activeOpacity={0.7}
          style={{
            alignItems: "center",
            paddingVertical: 10,
            opacity: state === "loading" || mutation.isPending ? 0.5 : 1,
          }}
        >
          <Text
            style={{
              color: Colors.light.tint,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {state === "loading" || mutation.isPending
              ? "Connecting to DigiLocker..."
              : "Or verify instantly using DigiLocker"}
          </Text>
        </TouchableOpacity>
      </VStack>
    </SafeAreaView>
  );
}
