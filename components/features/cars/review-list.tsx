import { FlatList, View } from "react-native";

import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { ReviewCard } from "./review-card";

import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { HStack } from "@/components/ui/hstack";
import { Ionicons } from "@expo/vector-icons";

import { Link } from "expo-router";

type Props = {
  reviews?: any[];
  carId?: string;
};

export function ReviewList({ reviews = [], carId }: Props) {
  const displayReviews = reviews.slice(0, 3);
  const hasReviews = reviews.length > 0;

  return (
    <VStack space="md">
      <HStack className="items-center justify-between px-1">
        <Heading size="md">Reviews</Heading>

        {hasReviews && (
          <Link href={{ pathname: "/all-review", params: { carId } }} asChild>
            <Button variant="link" size="sm">
              <ButtonText className="text-typography-400">View All</ButtonText>
            </Button>
          </Link>
        )}
      </HStack>

      {hasReviews ? (
        <FlatList
          data={displayReviews}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            gap: 16,
          }}
          renderItem={({ item }) => (
            <ReviewCard variant="horizontal" review={item} />
          )}
        />
      ) : (
        <View className="bg-muted/30 p-8 rounded-3xl items-center border border-dashed border-outline-200">
          <View className="h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
            <Ionicons name="chatbubble-ellipses-outline" size={28} color="#9ca3af" />
          </View>
          <Text className="font-semibold text-foreground">No reviews yet</Text>
          <Text className="text-sm text-muted-foreground text-center mt-1">
            Be the first to share your experience with this car!
          </Text>
        </View>
      )}
    </VStack>
  );
}
