import { useMemo, useRef, useState } from "react";
import { FlatList } from "react-native";

import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { Link } from "expo-router";

import { CarCard } from "./car-card";

export function TopCars({ cars }) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 100 });
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    setVisibleIds(
      viewableItems.map(({ item }) => String(item?.id)).filter(Boolean),
    );
  });

  return (
    <VStack style={{ gap: 14 }}>
      <HStack
        style={{
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 2,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: Colors.light.text,
            letterSpacing: -0.3,
          }}
        >
          Top Rated Cars
        </Text>

        <Link href="/all-cars" asChild>
          <Button variant="link" size="sm">
            <ButtonText
              style={{
                color: Colors.light.tint,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              View All
            </ButtonText>
          </Button>
        </Link>
      </HStack>

      {cars && (
        <FlatList
          data={cars.slice(0, 5)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChangedRef.current}
          viewabilityConfig={viewabilityConfigRef.current}
          contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
          renderItem={({ item }) => (
            <CarCard
              variant="horizontal"
              car={item}
              isVisible={visibleIdSet.has(String(item.id))}
            />
          )}
        />
      )}
    </VStack>
  );
}

export function MostPopularCars({ cars }) {
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 100 });
  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    setVisibleIds(
      viewableItems.map(({ item }) => String(item?.id)).filter(Boolean),
    );
  });

  return (
    <VStack style={{ gap: 14, marginTop: 8 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: Colors.light.text,
          letterSpacing: -0.3,
          paddingHorizontal: 2,
        }}
      >
        Most Popular Cars
      </Text>

      {cars && (
        <FlatList
          data={cars.slice(0, 5)}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          onViewableItemsChanged={onViewableItemsChangedRef.current}
          viewabilityConfig={viewabilityConfigRef.current}
          contentContainerStyle={{ gap: 16, paddingBottom: 4 }}
          renderItem={({ item }) => (
            <CarCard
              variant="vertical"
              car={item}
              isVisible={visibleIdSet.has(String(item.id))}
            />
          )}
        />
      )}
    </VStack>
  );
}
