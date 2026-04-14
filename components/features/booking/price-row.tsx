import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

interface PriceRowProps {
  label: string;
  value: string;
  sublabel?: string;
  valueColor?: string;
}

export function PriceRow({ label, value, sublabel, valueColor }: PriceRowProps) {
  return (
    <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
      <VStack style={{ gap: 1 }}>
        <Text style={{ fontSize: 13, color: Colors.light.icon }}>{label}</Text>
        {sublabel && (
          <Text style={{ fontSize: 11, color: Colors.light.success }}>
            {sublabel}
          </Text>
        )}
      </VStack>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: valueColor ?? Colors.light.text,
        }}
      >
        {value}
      </Text>
    </HStack>
  );
}
