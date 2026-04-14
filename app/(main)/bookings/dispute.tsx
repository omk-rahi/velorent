import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { submitCustomerDispute } from "@/api/bookings";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  CircleDollarSign,
  FileText,
  ShieldAlert,
  Wrench,
} from "lucide-react-native";

const DISPUTE_TYPES = [
  { id: "vehicle_condition", label: "Vehicle Condition Issue", icon: Wrench },
  { id: "trip_issue", label: "Trip Issue", icon: AlertTriangle },
  { id: "unsafe_behavior", label: "Safety / Behavior Concern", icon: ShieldAlert },
  { id: "billing_refund", label: "Billing or Refund Issue", icon: CircleDollarSign },
  { id: "other", label: "Other", icon: FileText },
] as const;

type DisputeType = (typeof DISPUTE_TYPES)[number]["id"];
const DISPUTE_TYPE_SET = new Set<DisputeType>(DISPUTE_TYPES.map((t) => t.id));

export default function CustomerDisputeScreen() {
  const {
    bookingId,
    disputeType: prefillDisputeType,
    description: prefillDescription,
  } = useLocalSearchParams<{
    bookingId: string;
    disputeType?: string;
    description?: string;
  }>();
  const { bottom } = useSafeAreaInsets();

  const initialDisputeType =
    typeof prefillDisputeType === "string" &&
    DISPUTE_TYPE_SET.has(prefillDisputeType as DisputeType)
      ? (prefillDisputeType as DisputeType)
      : null;
  const initialDescription =
    typeof prefillDescription === "string" ? prefillDescription : "";

  const [disputeType, setDisputeType] = useState<DisputeType | null>(initialDisputeType);
  const [description, setDescription] = useState(initialDescription);
  const [photo, setPhoto] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const trimmedDescription = description.trim();
  const isIssueTypeValid = !!disputeType;
  const isDescriptionValid = trimmedDescription.length >= 10;

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      submitCustomerDispute({
        bookingId: bookingId!,
        disputeType: disputeType!,
        description: description.trim(),
        photoUri: photo,
      }),
    onSuccess: () => {
      Alert.alert(
        "Dispute Submitted",
        "Our support team will review your issue and get back to you within 24 hours.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
    onError: (error: any) => {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to submit dispute. Please try again.";
      Alert.alert("Error", message);
    },
  });

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhoto(result.assets[0].uri);
    }
  };

  const removePhoto = () => setPhoto(null);

  const handleSubmit = () => {
    if (!bookingId) {
      Alert.alert("Missing Booking", "Booking id is missing.");
      return;
    }

    setShowValidation(true);

    if (!disputeType) {
      Alert.alert("Missing Issue Type", "Please select the issue type.");
      return;
    }

    if (trimmedDescription.length < 10) {
      Alert.alert("Description Too Short", "Please enter at least 10 characters.");
      return;
    }

    submit();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F1F5F9",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.light.text} />
        </TouchableOpacity>
        <VStack style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>
            Raise a Dispute
          </Text>
          <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
            Booking #{(bookingId ?? "").slice(-8).toUpperCase()}
          </Text>
        </VStack>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: bottom + 100, gap: 24 }}
        >
          {/* Dispute type selection */}
          <VStack style={{ gap: 12 }}>
            <VStack style={{ gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
                What happened?
              </Text>
              <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                Select the issue you faced during this booking
              </Text>
            </VStack>
            <VStack style={{ gap: 8 }}>
              {DISPUTE_TYPES.map((type) => {
                const selected = disputeType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setDisputeType(type.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: selected ? "rgba(26,86,255,0.04)" : "#fff",
                      borderRadius: 14,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? Colors.light.tint : Colors.light.cardBorder,
                      paddingHorizontal: 16,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: selected ? Colors.light.tint : "#CBD5E1",
                        backgroundColor: selected ? Colors.light.tint : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <View
                          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: selected ? "700" : "500",
                        color: selected ? Colors.light.tint : "#0F172A",
                        flex: 1,
                      }}
                    >
                      {type.label}
                    </Text>
                    <type.icon
                      size={18}
                      color={selected ? Colors.light.tint : Colors.light.iconMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </VStack>
            {showValidation && !isIssueTypeValid && (
              <Text style={{ fontSize: 12, color: Colors.light.error }}>
                Please select an issue type.
              </Text>
            )}
          </VStack>

          {/* Description + Photo */}
          <VStack style={{ gap: 10 }}>
            <VStack style={{ gap: 2 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
                Description
              </Text>
              <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                Share clear details so support can help faster
              </Text>
            </VStack>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor:
                  showValidation && !isDescriptionValid
                    ? Colors.light.error
                    : Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Explain what happened, when it happened, and what resolution you expect..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{
                  fontSize: 14,
                  color: "#0F172A",
                  lineHeight: 22,
                  minHeight: 120,
                  padding: 14,
                }}
              />
              {/* Toolbar */}
              <HStack
                style={{
                  alignItems: "center",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderTopWidth: 1,
                  borderTopColor: Colors.light.cardBorder,
                  gap: 8,
                }}
              >
                {photo && (
                  <View style={{ position: "relative" }}>
                    <Image
                      source={{ uri: photo }}
                      style={{ width: 38, height: 38, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={removePhoto}
                      style={{
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: Colors.light.error,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={9} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={pickPhoto}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: photo
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(26,86,255,0.08)",
                  }}
                >
                  <Ionicons
                    name={photo ? "image-outline" : "camera-outline"}
                    size={16}
                    color={photo ? Colors.light.success : Colors.light.tint}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: photo ? Colors.light.success : Colors.light.tint,
                    }}
                  >
                    {photo ? "1 photo" : "Add photo"}
                  </Text>
                </TouchableOpacity>
              </HStack>
            </View>
            <HStack style={{ justifyContent: "space-between" }}>
              <Text
                style={{
                  fontSize: 12,
                  color:
                    showValidation && !isDescriptionValid
                      ? Colors.light.error
                      : Colors.light.iconMuted,
                }}
              >
                {showValidation && !isDescriptionValid
                  ? "Minimum 10 characters required"
                  : "Minimum 10 characters"}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: isDescriptionValid ? Colors.light.success : Colors.light.iconMuted,
                }}
              >
                {trimmedDescription.length} chars
              </Text>
            </HStack>
          </VStack>

          {/* Info note */}
          <HStack
            style={{
              gap: 10,
              alignItems: "flex-start",
              backgroundColor: "#F8FAFC",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              padding: 14,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={Colors.light.iconMuted}
              style={{ marginTop: 1 }}
            />
          <Text style={{ flex: 1, fontSize: 13, color: Colors.light.iconMuted, lineHeight: 20 }}>
            Disputes are reviewed within{" "}
            <Text style={{ fontWeight: "700", color: "#0F172A" }}>24 hours</Text>. Our team
            will contact you on your registered phone number with next steps.
          </Text>
        </HStack>
        </ScrollView>

        {/* Submit button */}
        <View
          style={{
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: Colors.light.cardBorder,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: bottom + 14,
          }}
        >
          <Button
            size="xl"
            isDisabled={isPending}
            onPress={handleSubmit}
            style={{ borderRadius: 16 }}
          >
            {isPending && <ButtonSpinner color="#fff" />}
            <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>Submit Dispute</ButtonText>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
