import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import type { LucideIcon } from "lucide-react-native";

type DetailProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export function TableDetail({ label, value, icon: Icon }: DetailProps) {
  return (
    <HStack className="items-center justify-between py-2">
      <HStack className="items-center gap-2">
        <Icon size={16} color="#9CA3AF" />
        <Text className="text-typography-500">{label}</Text>
      </HStack>

      <Text
        className="text-right max-w-[55%]"
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {value}
      </Text>
    </HStack>
  );
}
