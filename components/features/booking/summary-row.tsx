import { Ionicons } from "@expo/vector-icons";

import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}

export function SummaryRow({ icon, label, value, valueColor }: SummaryRowProps) {
  return (
    <HStack style={{ alignItems: "center", gap: 10 }}>
      <Ionicons name={icon as any} size={14} color={Colors.light.iconMuted} />
      <Text style={{ fontSize: 12, color: Colors.light.iconMuted, width: 60 }}>
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: "600",
          color: valueColor ?? Colors.light.text,
        }}
      >
        {value}
      </Text>
    </HStack>
  );
}
