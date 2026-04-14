import BottomSheet from "@gorhom/bottom-sheet";
import React, { forwardRef, useMemo, useState } from "react";
import { Calendar } from "react-native-calendars";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { TimeSlotPicker } from "./time-slot-picker";

export const CalenderPicker = forwardRef<BottomSheet>((_, ref) => {
  const snapPoints = useMemo(() => ["80%"], []);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <BottomSheet ref={ref} index={-1} snapPoints={snapPoints}>
      <VStack className="px-5 py-4" space="lg">
        <Heading size="lg">Select Date</Heading>

        <Calendar
          minDate={new Date().toISOString().split("T")[0]}
          onDayPress={(day) => {
            setDate(day.dateString);
            setSlot(null);
          }}
          markedDates={{
            [date ?? ""]: {
              selected: true,
              selectedColor: "#3083ff",
            },
          }}
        />

        {date && (
          <>
            <Heading size="md">Available Time Slots</Heading>
            <TimeSlotPicker value={slot} onChange={setSlot} />
          </>
        )}

        <Button isDisabled={!date || !slot}>
          <ButtonText>
            Confirm {date} • {slot}
          </ButtonText>
        </Button>
      </VStack>
    </BottomSheet>
  );
});

CalenderPicker.displayName = "CalenderPicker";
