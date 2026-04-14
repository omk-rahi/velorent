import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

export function ProfileHeader({
  name,
  email,
  profile,
}: {
  name?: string;
  email?: string;
  profile?: string;
}) {
  return (
    <VStack className="items-center py-6">
      <HStack className="justify-center">
        <Avatar
          size="xl"
          style={{
            borderWidth: 3,
            borderColor: Colors.light.tint,
          }}
        >
          <AvatarFallbackText>
            {name
              ?.split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallbackText>
          <AvatarImage
            source={{
              uri: profile,
            }}
          />
        </Avatar>
      </HStack>

      <VStack className="items-center mt-5" space="xs">
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: Colors.light.text,
            letterSpacing: -0.5,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: Colors.light.iconMuted,
          }}
        >
          {email}
        </Text>
      </VStack>
    </VStack>
  );
}
