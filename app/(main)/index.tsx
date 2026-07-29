import { getCars } from "@/api/cars";
import { getActiveCoupons } from "@/api/coupons";
import { TopCars } from "@/components/features/cars/car-list";
import { CarCard } from "@/components/features/cars/car-card";
import { HomeAdsCarousel } from "@/components/features/home/home-ads-carousel";
import { Header } from "@/components/shared/header";
import { Loader } from "@/components/shared/loader";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const POPULAR_CARS_PAGE_SIZE = 5;

export default function HomeScreen() {
  const [visiblePopularIds, setVisiblePopularIds] = useState<string[]>([]);
  const popularViewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 100,
  });
  const visiblePopularIdSet = useMemo(
    () => new Set(visiblePopularIds),
    [visiblePopularIds],
  );
  const onPopularViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisiblePopularIds(
        viewableItems.map(({ item }) => String(item?.id)).filter(Boolean),
      );
    },
  );

  const { data: userLocation, isLoading: isLocationLoading } = useQuery({
    queryKey: ["user-location"],
    queryFn: async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return null;

        const lastKnownLocation = await Location.getLastKnownPositionAsync();
        const location =
          lastKnownLocation ??
          (await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }));

        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: nearbyCars, isLoading: isNearbyCarsLoading } = useQuery({
    queryKey: ["nearby-cars", userLocation?.latitude, userLocation?.longitude],
    queryFn: () =>
      getCars({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        sortByDistance: true,
      }),
    enabled: !isLocationLoading,
  });

  const { data: offers = [], isLoading: isOffersLoading } = useQuery({
    queryKey: ["active-coupons"],
    queryFn: getActiveCoupons,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: popularCarsPages,
    isLoading: isPopularCarsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["popular-cars", userLocation?.latitude, userLocation?.longitude],
    queryFn: ({ pageParam }) =>
      getCars({
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        limit: POPULAR_CARS_PAGE_SIZE,
        offset: pageParam,
        sortByDistance: true,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === POPULAR_CARS_PAGE_SIZE
        ? allPages.length * POPULAR_CARS_PAGE_SIZE
        : undefined,
    enabled: !isLocationLoading,
  });

  const popularCars = useMemo(
    () => popularCarsPages?.pages.flat() ?? [],
    [popularCarsPages],
  );

  const loadMorePopularCars = () => {
    if (!hasNextPage || isFetchingNextPage) return;
    fetchNextPage();
  };

  const isLoadingHome =
    isLocationLoading ||
    isNearbyCarsLoading ||
    isPopularCarsLoading ||
    isOffersLoading;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F7F8FC" }}
      edges={["top"]}
    >
      <VStack style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Header />

        {isLoadingHome ? (
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Loader />
          </View>
        ) : (
          <FlatList
            data={popularCars}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, marginTop: 20 }}
            contentContainerStyle={{ gap: 16, paddingBottom: 32 }}
            onEndReached={loadMorePopularCars}
            onEndReachedThreshold={0.2}
            onViewableItemsChanged={onPopularViewableItemsChangedRef.current}
            viewabilityConfig={popularViewabilityConfigRef.current}
            ListHeaderComponent={
              <VStack space="xl" style={{ marginBottom: 2 }}>
                <HomeAdsCarousel offers={offers} />
                <TopCars cars={nearbyCars} />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: Colors.light.text,
                    letterSpacing: -0.3,
                    paddingHorizontal: 2,
                    marginTop: 8,
                  }}
                >
                  Most Popular Cars
                </Text>
              </VStack>
            }
            renderItem={({ item }) => (
              <CarCard
                variant="vertical"
                car={item}
                isVisible={visiblePopularIdSet.has(String(item.id))}
              />
            )}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ paddingVertical: 18 }}>
                  <ActivityIndicator color={Colors.light.tint} />
                </View>
              ) : hasNextPage ? (
                <Pressable
                  onPress={loadMorePopularCars}
                  style={{
                    alignSelf: "center",
                    backgroundColor: Colors.light.tint + "12",
                    borderRadius: 20,
                    marginTop: 4,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.light.tint,
                      fontSize: 13,
                      fontWeight: "700",
                    }}
                  >
                    Load more cars
                  </Text>
                </Pressable>
              ) : null
            }
          />
        )}
      </VStack>
    </SafeAreaView>
  );
}
