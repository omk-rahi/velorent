import { getCarBrands } from "@/api/brands";
import { Loader } from "@/components/shared/loader";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { PressableCard } from "@/components/ui/pressable-card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { router, Stack } from "expo-router";
import { ChevronRight, SearchIcon } from "lucide-react-native";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AllBrandsScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: carBrands,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["car-brands"],
    queryFn: getCarBrands,
  });

  const filteredBrands = carBrands?.filter((brand) =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  if (error || !carBrands) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <Text style={{ color: Colors.light.iconMuted }}>
          Error loading brands. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: Colors.light.background }}
      edges={["bottom"]}
    >
      <Stack.Screen
        options={{
          title: "All Brands",
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
        data={filteredBrands}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 40,
          gap: 12,
        }}
        ListHeaderComponent={
          <VStack style={{ paddingTop: 16, paddingBottom: 8, gap: 16 }}>
            {/* Page title */}
            <VStack style={{ gap: 4 }}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: Colors.light.text,
                  letterSpacing: -0.5,
                }}
              >
                Browse Brands
              </Text>
              <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                {carBrands.length} brands available
              </Text>
            </VStack>

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
                placeholder="Search brand..."
                placeholderTextColor={Colors.light.iconMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ fontSize: 15, color: Colors.light.text }}
              />
            </Input>

            {searchQuery.length > 0 && (
              <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                {filteredBrands?.length ?? 0} result
                {filteredBrands?.length !== 1 ? "s" : ""} for &quot;
                {searchQuery}&quot;
              </Text>
            )}
          </VStack>
        }
        renderItem={({ item }) => (
          <PressableCard
            onPress={() =>
              router.push({
                pathname: "/all-cars",
                params: { brandId: item.id, brandName: item.name },
              })
            }
          >
            <View
              style={{
                backgroundColor: Colors.light.card,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#1A56FF",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.02,
                shadowRadius: 8,
                elevation: 1,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 16,
                    backgroundColor: Colors.light.background,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    source={{ uri: item.logo_url }}
                    contentFit="contain"
                    style={{ width: 40, height: 40 }}
                  />
                </View>

                <VStack style={{ gap: 5, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: Colors.light.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    {item.name}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      alignSelf: "flex-start",
                      backgroundColor:
                        item.carCount > 0
                          ? "rgba(26,86,255,0.08)"
                          : "rgba(100,116,139,0.08)",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 20,
                    }}
                  >
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor:
                          item.carCount > 0
                            ? Colors.light.tint
                            : Colors.light.iconMuted,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color:
                          item.carCount > 0
                            ? Colors.light.tint
                            : Colors.light.iconMuted,
                      }}
                    >
                      {item.carCount} {item.carCount === 1 ? "car" : "cars"}{" "}
                      available
                    </Text>
                  </View>
                </VStack>
              </View>

              {/* Arrow */}
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(26,86,255,0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ChevronRight size={16} color={Colors.light.tint} />
              </View>
            </View>
          </PressableCard>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingVertical: 48, gap: 10 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(26,86,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 28 }}>🚗</Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: Colors.light.text,
              }}
            >
              No brands found
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.light.iconMuted,
                textAlign: "center",
              }}
            >
              Try a different search term
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
