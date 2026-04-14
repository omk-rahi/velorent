import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

interface StepTitleProps {
  title: string;
  subtitle: string;
}

export function StepTitle({ title, subtitle }: StepTitleProps) {
  return (
    <VStack style={{ gap: 4, marginBottom: 4 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "800",
          color: Colors.light.text,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
        {subtitle}
      </Text>
    </VStack>
  );
}
