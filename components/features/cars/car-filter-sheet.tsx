import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useEffect, useMemo, useState } from "react";

import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";

export type FilterState = {
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
};

type Props = {
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
};

export const CarFilterSheet = forwardRef<BottomSheet, Props>(
  ({ initialFilters, onApply }, ref) => {
    const snapPoints = useMemo(() => ["55%"], []);
    const [localFilters, setLocalFilters] =
      useState<FilterState>(initialFilters);

    useEffect(() => {
      setLocalFilters(initialFilters);
    }, [initialFilters]);

    const handlePriceSelect = (min?: number, max?: number) => {
      setLocalFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
    };

    const handleSeatsSelect = (seats?: number) => {
      setLocalFilters((prev) => ({ ...prev, seats }));
    };

    const handleReset = () => {
      const resetFilters = {
        minPrice: undefined,
        maxPrice: undefined,
        seats: undefined,
      };
      setLocalFilters(resetFilters);
      onApply(resetFilters);
      // @ts-ignore
      ref?.current?.close();
    };

    const handleApply = () => {
      onApply(localFilters);
      // @ts-ignore
      ref?.current?.close();
    };

    return (
      <BottomSheet
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        index={-1}
        handleIndicatorStyle={{ backgroundColor: Colors.light.tint }}
        style={{
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          overflow: "hidden",
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        }}
      >
        <BottomSheetView className="flex-1 px-6 pt-2 pb-8">
          <VStack space="xl">
            <HStack className="justify-between items-center">
              <Heading size="lg">Filter Cars</Heading>
              <Button variant="link" size="sm" onPress={handleReset}>
                <ButtonText className="text-primary-500 font-semibold">
                  Reset All
                </ButtonText>
              </Button>
            </HStack>

            <VStack space="md">
              <Text className="text-typography-700 font-semibold text-base">
                Price Range (per hour)
              </Text>
              <HStack space="sm" className="flex-wrap">
                {[
                  { label: "Below ₹200", min: 0, max: 200 },
                  { label: "₹200 - ₹500", min: 200, max: 500 },
                  { label: "Above ₹500", min: 500, max: 10000 },
                ].map((range) => {
                  const isActive =
                    localFilters.minPrice === range.min &&
                    localFilters.maxPrice === range.max;
                  return (
                    <Button
                      key={range.label}
                      variant={isActive ? "solid" : "outline"}
                      size="sm"
                      className={`rounded-full px-4 ${isActive ? "bg-primary-500 border-primary-500" : "border-outline-200"}`}
                      onPress={() => handlePriceSelect(range.min, range.max)}
                    >
                      <ButtonText
                        className={
                          isActive ? "text-white" : "text-typography-600"
                        }
                      >
                        {range.label}
                      </ButtonText>
                    </Button>
                  );
                })}
              </HStack>
            </VStack>

            <VStack space="md">
              <Text className="text-typography-700 font-semibold text-base">
                Seat Capacity
              </Text>
              <HStack space="md">
                {[2, 4, 5, 7].map((s) => {
                  const isActive = localFilters.seats === s;
                  return (
                    <Button
                      key={s}
                      variant={isActive ? "solid" : "outline"}
                      size="md"
                      className={`w-14 h-14 rounded-2xl ${isActive ? "bg-primary-500 border-primary-500" : "border-outline-200"}`}
                      onPress={() =>
                        handleSeatsSelect(isActive ? undefined : s)
                      }
                    >
                      <ButtonText
                        className={
                          isActive ? "text-white" : "text-typography-600"
                        }
                      >
                        {s}
                      </ButtonText>
                    </Button>
                  );
                })}
              </HStack>
            </VStack>

            <Button
              size="xl"
              className="mt-6 rounded-2xl bg-primary-500 h-14"
              onPress={handleApply}
            >
              <ButtonText className="text-white font-bold">
                Apply Filters
              </ButtonText>
            </Button>
          </VStack>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

CarFilterSheet.displayName = "CarFilterSheet";
