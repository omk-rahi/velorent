import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "lucide-react-native";

export function ReviewsHeader() {
  return (
    <VStack space="lg" className="mt-4 mb-6">
      <Heading size="xl">All Reviews</Heading>

      <HStack space="sm" className="items-center">
        <Heading size="lg">4.8</Heading>
        <Text className="text-typography-400">(124 reviews)</Text>
      </HStack>

      <Text className="text-typography-400">
        Honest feedback from verified renters
      </Text>
    </VStack>
  );
}
