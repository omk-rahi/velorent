import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

export function VerificationItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  iconColor,
  iconBg,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: any;
  isLast?: boolean;
  iconColor?: string;
  iconBg?: string;
}) {
  const tintColor = iconColor || Colors.light.warning;
  const bgTint = iconBg || "rgba(245, 158, 11, 0.12)";

  return (
    <Pressable
      className="bg-white active:bg-gray-50"
      onPress={onPress}
      style={{ paddingHorizontal: 16 }}
    >
      <HStack
        className="items-center justify-between"
        style={{
          paddingVertical: 14,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: Colors.light.cardBorder,
        }}
      >
        <HStack space="md" className="items-center flex-1">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: bgTint,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={tintColor} strokeWidth={2} />
          </View>

          <VStack style={{ flex: 1, paddingRight: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: Colors.light.text,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.light.iconMuted,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          </VStack>
        </HStack>

        <HStack space="xs" className="items-center">
          <ChevronRight size={20} color={Colors.light.iconMuted} />
        </HStack>
      </HStack>
    </Pressable>
  );
}
