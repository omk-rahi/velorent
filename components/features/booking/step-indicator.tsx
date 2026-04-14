import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

interface StepIndicatorProps {
  labels: string[];
  currentIndex: number;
}

export function StepIndicator({ labels, currentIndex }: StepIndicatorProps) {
  return (
    <VStack style={{ gap: 8 }}>
      <HStack style={{ alignItems: "center" }}>
        {labels.map((_, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor:
                    i <= currentIndex
                      ? Colors.light.tint
                      : Colors.light.cardBorder,
                }}
              />
            )}
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor:
                  i <= currentIndex ? Colors.light.tint : Colors.light.card,
                borderWidth: i > currentIndex ? 2 : 0,
                borderColor:
                  i === currentIndex
                    ? Colors.light.tint
                    : Colors.light.cardBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {i < currentIndex ? (
                <Ionicons name="checkmark" size={15} color="white" />
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      i === currentIndex ? "white" : Colors.light.iconMuted,
                  }}
                >
                  {i + 1}
                </Text>
              )}
            </View>
          </React.Fragment>
        ))}
      </HStack>

      <HStack style={{ justifyContent: "space-between" }}>
        {labels.map((label, i) => (
          <Text
            key={i}
            style={{
              fontSize: 10,
              fontWeight: i === currentIndex ? "700" : "500",
              color:
                i === currentIndex
                  ? Colors.light.tint
                  : i < currentIndex
                    ? Colors.light.icon
                    : Colors.light.iconMuted,
              textAlign: "center",
              flex: 1,
            }}
          >
            {label}
          </Text>
        ))}
      </HStack>
    </VStack>
  );
}
