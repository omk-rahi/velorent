import { Ionicons } from "@expo/vector-icons";
import { Image } from "react-native";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

type Variant = "horizontal" | "vertical";

type Review = {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
};

type Props = {
  variant?: Variant;
  review?: Review;
};

export function ReviewCard({ variant = "vertical", review }: Props) {
  const isHorizontal = variant === "horizontal";

  if (!review) return null;

  return (
    <Card
      className={`
        ${isHorizontal ? "w-[300px]" : "w-full"}
        rounded-3xl p-5
        bg-white
      `}
    >
      <VStack space="md">
        <HStack className="items-center justify-between">
          <HStack space="sm" className="items-center">
            <Image
              source={{
                uri:
                  review.profiles.avatar_url ||
                  "https://randomuser.me/api/portraits/women/44.jpg",
              }}
              className="h-11 w-11 rounded-full"
            />

            <VStack>
              <Heading size="sm" className="font-semibold">
                {review.profiles.full_name}
              </Heading>
              <Text className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </Text>
            </VStack>
          </HStack>

          <HStack
            space="xs"
            className="items-center bg-muted px-2.5 py-1 rounded-full"
          >
            <Ionicons name="star" size={14} color="#F5A524" />
            <Text className="text-xs font-medium">{review.rating}.0</Text>
          </HStack>
        </HStack>

        <Text
          className="text-sm text-muted-foreground leading-6"
          numberOfLines={isHorizontal ? 4 : undefined}
        >
          {review.review_text}
        </Text>
      </VStack>
    </Card>
  );
}
