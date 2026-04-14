import { Pressable, ScrollView } from "react-native";

import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";

export type BookingStatus = "active" | "upcoming" | "completed" | "cancelled";

type Props = {
  value: BookingStatus;
  onChange: (value: BookingStatus) => void;
};

export function BookingTabs({ value, onChange }: Props) {
  const tabs: { label: string; value: BookingStatus }[] = [
    { label: "On going", value: "active" },
    { label: "Upcoming", value: "upcoming" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 20 }}
      style={{ marginBottom: 4 }}
    >
      {tabs.map((tab) => {
        const isSelected = value === tab.value;
        return (
          <Pressable
            key={tab.value}
            onPress={() => onChange(tab.value)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: isSelected ? Colors.light.tint : Colors.light.cardBorder,
              backgroundColor: isSelected ? Colors.light.tint : Colors.light.card,
              shadowColor: isSelected ? Colors.light.tint : "transparent",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isSelected ? 0.25 : 0,
              shadowRadius: 6,
              elevation: isSelected ? 3 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: isSelected ? "#FFFFFF" : Colors.light.icon,
                letterSpacing: 0.1,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
