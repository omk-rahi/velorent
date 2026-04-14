import { getCarReviews } from "@/api/cars";
import { ReviewCard } from "@/components/features/cars/review-card";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AllReviewsScreen() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (carId) {
      fetchReviews();
    }
  }, [carId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getCarReviews(carId as string);
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>No reviews found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-0 px-5 ">
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 16,
          paddingBottom: 32,
        }}
        renderItem={({ item }) => <ReviewCard variant="vertical" review={item} />}
      />
    </SafeAreaView>
  );
}
