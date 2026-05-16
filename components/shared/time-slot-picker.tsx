import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Pressable } from "react-native";

const SLOTS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`,
);

export function TimeSlotPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (slot: string) => void;
}) {
  return (
    <HStack className="flex-wrap gap-3">
      {SLOTS.map((slot) => {
        const selected = value === slot;

        return (
          <Pressable
            key={slot}
            onPress={() => onChange(slot)}
            className={`px-4 py-2 rounded-full border ${
              selected ? "bg-primary-500 border-primary-500" : "border-gray-300"
            }`}
          >
            <Text className={selected ? "text-white" : ""}>{slot}</Text>
          </Pressable>
        );
      })}
    </HStack>
  );
}
