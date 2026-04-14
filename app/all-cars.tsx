import BottomSheet from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useLocalSearchParams, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, Settings2Icon } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Image } from "expo-image";

import { getCars } from "@/api/cars";
import { CarCard } from "@/components/features/cars/car-card";
import { CarFilterSheet, FilterState } from "@/components/features/cars/car-filter-sheet";
import { Loader } from "@/components/shared/loader";
import { Colors } from "@/constants/theme";

export default function AllCarsScreen() {
  const { brand, brandId, brandName, q } = useLocalSearchParams<{
    brand?: string | string[];
    brandId?: string | string[];
    brandName?: string | string[];
    q?: string | string[];
  }>();
  const brandParam = Array.isArray(brand) ? brand[0] : brand;
  const brandIdParam = Array.isArray(brandId) ? brandId[0] : brandId;
  const brandNameParam = Array.isArray(brandName) ? brandName[0] : brandName;
  const qParam = Array.isArray(q) ? q[0] : q;

  const [searchQuery, setSearchQuery] = useState(() =>
    typeof qParam === "string" ? qParam : "",
  );
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const filterSheetRef = useRef<BottomSheet>(null);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 100 });
  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: any[] }) => {
    setVisibleIds(
      viewableItems.map(({ item }) => String(item?.id)).filter(Boolean),
    );
  });

  useEffect(() => {
    if (typeof qParam === "string") {
      setSearchQuery(qParam);
      return;
    }
    if (brandParam) {
      setSearchQuery("");
      return;
    }
    setSearchQuery("");
  }, [qParam, brandParam]);

  const pageTitle = brandNameParam ?? brandParam
    ? `${(brandNameParam ?? brandParam)!} Cars`
    : "All Cars";

  const {
    data: cars,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cars", brandIdParam ?? brandParam, searchQuery, filters],
    queryFn: () =>
      getCars({
        brand: brandParam,
        brandId: brandIdParam,
        search: searchQuery,
        ...filters,
      }),
  });

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <Loader />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: "rgba(239,68,68,0.1)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 28 }}>⚠️</Text>
        </View>
        <Text
          style={{ fontSize: 15, fontWeight: "600", color: Colors.light.text }}
        >
          Something went wrong
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            backgroundColor: Colors.light.tint + "12",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 20,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: Colors.light.tint,
            }}
          >
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.light.background }}
        edges={["bottom"]}
      >
        <Stack.Screen
          options={{
            title: pageTitle,
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
          data={cars ?? []}
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
                    {pageTitle}
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                    {(cars?.length ?? 0)} {(cars?.length ?? 0) === 1 ? "car" : "cars"} available
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

              <Input
                variant="outline"
                size="xl"
                style={{
                  borderRadius: 16,
                  borderWidth: 1.5,
                  backgroundColor: Colors.light.card,
                  borderColor: "transparent",
                  height: 52,
                  shadowColor: "#1A56FF",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.02,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                <InputSlot style={{ paddingLeft: 14 }}>
                  <InputIcon
                    as={SearchIcon}
                    style={{ color: Colors.light.iconMuted }}
                  />
                </InputSlot>
                <InputField
                  placeholder="Search any car..."
                  placeholderTextColor={Colors.light.iconMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ fontSize: 15, color: Colors.light.text }}
                />
              </Input>

              {searchQuery.length > 0 && (
                <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                  {cars?.length ?? 0} result{(cars?.length ?? 0) !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
                </Text>
              )}
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
                Try adjusting your search or filters
              </Text>
              {(searchQuery.length > 0 || Object.keys(filters).length > 0) && (
                <Pressable
                  onPress={() => {
                    setSearchQuery("");
                    setFilters({});
                  }}
                  style={{
                    marginTop: 4,
                    backgroundColor: Colors.light.tint + "12",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: Colors.light.tint,
                    }}
                  >
                    Clear Filters
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      </SafeAreaView>

      <CarFilterSheet
        ref={filterSheetRef}
        initialFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />
    </GestureHandlerRootView>
  );
}
