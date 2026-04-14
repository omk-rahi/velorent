import BottomSheet from "@gorhom/bottom-sheet";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";

import { Image } from "expo-image";
import { CarCard } from "@/components/features/cars/car-card";
import { CarFilterSheet } from "@/components/features/cars/car-filter-sheet";
import { TOP_RATED_CARS } from "@/components/features/cars/car-list";
import { Colors } from "@/constants/theme";
import { Settings2Icon } from "lucide-react-native";
import { Pressable } from "react-native";

export default function CarResultsScreen() {
  const { q, brand } = useLocalSearchParams<{
    q?: string;
    brand?: string;
  }>();

  const filterSheetRef = useRef<BottomSheet>(null);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 100 });
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    setVisibleIds(
      viewableItems
        .map(({ item }) => String(item?.id))
        .filter(Boolean),
    );
  });

  const title = brand ? `${brand} Cars` : q ? `"${q}"` : "All Cars";

  const cars = useMemo(() => {
    return TOP_RATED_CARS.filter((car) => {
      if (brand) return car.name.toLowerCase().includes(brand.toLowerCase());
      if (q) return car.name.toLowerCase().includes(q.toLowerCase());
      return true;
    });
  }, [brand, q]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.light.background }}
        edges={["bottom"]}
      >
        <Stack.Screen
          options={{
            title: brand ?? (q ? `Search` : "All Cars"),
            headerStyle: { backgroundColor: Colors.light.background },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: "700",
              color: Colors.light.text,
              fontSize: 17,
            },
            headerTintColor: Colors.light.tint,
          }}
        />

        <FlatList
          data={cars}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 12,
          }}
          onViewableItemsChanged={onViewableItemsChangedRef.current}
          viewabilityConfig={viewabilityConfigRef.current}
          ListHeaderComponent={
            <VStack style={{ paddingTop: 16, paddingBottom: 8, gap: 16 }}>
              <HStack style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <VStack style={{ gap: 4, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 26,
                      fontWeight: "800",
                      color: Colors.light.text,
                      letterSpacing: -0.5,
                    }}
                  >
                    {title}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                    {cars.length} {cars.length === 1 ? "car" : "cars"} available
                  </Text>
                </VStack>

                <Pressable
                  onPress={() => filterSheetRef.current?.expand()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: Colors.light.tint + "12",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 4,
                  }}
                >
                  <Settings2Icon size={18} color={Colors.light.tint} />
                </Pressable>
              </HStack>
            </VStack>
          }
          renderItem={({ item }) => (
            <CarCard
              variant="vertical"
              car={item}
              isVisible={visibleIds.includes(String(item.id))}
            />
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 64, gap: 12 }}>
              <Image
                source={require("@/assets/images/search.svg")}
                style={{ width: 120, height: 120 }}
                contentFit="contain"
              />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: Colors.light.text,
                }}
              >
                No cars found
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: Colors.light.iconMuted,
                  textAlign: "center",
                }}
              >
                Try a different search or filter
              </Text>
            </View>
          }
        />
      </SafeAreaView>

      <CarFilterSheet ref={filterSheetRef} />
    </GestureHandlerRootView>
  );
}
