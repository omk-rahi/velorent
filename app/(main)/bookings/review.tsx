import { getMyCarReview, submitCarReview } from "@/api/cars";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function BookingReviewScreen() {
  const { bookingId, carId } = useLocalSearchParams<{ bookingId: string; carId: string }>();
  const { bottom } = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");

  const { data: existingReview, isLoading: loadingExistingReview } = useQuery({
    queryKey: ["my-car-review", carId],
    queryFn: () => getMyCarReview(carId!),
    enabled: !!carId,
  });

  const isEditing = !!existingReview?.id;

  useEffect(() => {
    if (!existingReview) return;
    setRating(Number(existingReview.rating ?? 0));
    setReviewText(String(existingReview.review_text ?? ""));
  }, [existingReview]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () =>
      submitCarReview({
        carId: carId!,
        rating,
        reviewText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car", carId] });
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      Alert.alert(isEditing ? "Review Updated" : "Review Submitted", "Thanks for sharing your experience.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      const message =
        typeof error?.message === "string" ? error.message : "Failed to submit review.";
      Alert.alert("Error", message);
    },
  });

  const handleSubmit = () => {
    if (!bookingId || !carId) {
      Alert.alert("Missing Details", "Booking or car details are missing.");
      return;
    }
    if (rating < 1 || rating > 5) {
      Alert.alert("Missing Rating", "Please select a rating.");
      return;
    }
    submit();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }} edges={["top"]}>
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
          <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>Leave a Review</Text>
          <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
            Booking #{(bookingId ?? "").slice(-8).toUpperCase()}
          </Text>
        </VStack>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: bottom + 100, gap: 18 }}
        >
          {loadingExistingReview && (
            <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
              Checking existing review...
            </Text>
          )}
          <VStack style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Rate your trip</Text>
            <HStack style={{ gap: 10 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= rating;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setRating(value)}
                    activeOpacity={0.8}
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? "rgba(245,158,11,0.14)" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#F59E0B" : Colors.light.cardBorder,
                    }}
                  >
                    <Ionicons name={active ? "star" : "star-outline"} size={22} color="#F59E0B" />
                  </TouchableOpacity>
                );
              })}
            </HStack>
          </VStack>

          <VStack style={{ gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Your review (optional)</Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                padding: 12,
              }}
            >
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience with this car..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                style={{ minHeight: 120, fontSize: 14, color: "#0F172A", lineHeight: 20 }}
              />
            </View>
          </VStack>
        </ScrollView>

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
          <Button size="xl" onPress={handleSubmit} isDisabled={isPending} style={{ borderRadius: 16 }}>
            {isPending && <ButtonSpinner color="#fff" />}
            <ButtonText style={{ fontSize: 16, fontWeight: "700" }}>
              {isEditing ? "Update Review" : "Submit Review"}
            </ButtonText>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
