import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";

export function ProfileActionItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  isLast = false,
  isDestructive = false,
  iconColor,
  iconBg,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: any;
  isLast?: boolean;
  isDestructive?: boolean;
  iconColor?: string;
  iconBg?: string;
}) {
  const tintColor = isDestructive ? Colors.light.error : (iconColor || Colors.light.tint);
  const bgTint = isDestructive ? "rgba(239, 68, 68, 0.12)" : (iconBg || "rgba(26, 86, 255, 0.12)");
  const titleColor = isDestructive ? Colors.light.error : Colors.light.text;

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
            <Icon size={20} color={tintColor} strokeWidth={isDestructive ? 2.5 : 2} />
          </View>

          <VStack style={{ flex: 1, paddingRight: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: titleColor,
                letterSpacing: -0.2,
              }}
            >
              {title}
            </Text>

            {subtitle && (
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.light.iconMuted,
                  marginTop: 2,
                }}
              >
                {subtitle}
              </Text>
            )}
          </VStack>
        </HStack>

        {!isDestructive && (
          <ChevronRight size={20} color={Colors.light.iconMuted} />
        )}
      </HStack>
    </Pressable>
  );
}
