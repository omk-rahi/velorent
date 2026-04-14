import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getCarById } from "@/api/cars";
import { ImageSlider } from "@/components/features/cars/image-slider";
import { PickupLocationCard } from "@/components/features/cars/pickup-location-card";
import { ReviewList } from "@/components/features/cars/review-list";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import useUser from "@/store/use-user";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { AlertTriangle, CreditCard, FileText } from "lucide-react-native";

const FUEL_ICONS: Record<string, string> = {
  petrol: "flame-outline",
  diesel: "speedometer-outline",
  electric: "flash-outline",
  hybrid: "leaf-outline",
  cng: "cloud-outline",
};

export default function CarDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const profile = useUser((s) => s.profile);
  // const aadhaarVerified = profile?.aadhaar_verified === true;
  // const dlVerified = profile?.dl_verified === true;
  const aadhaarVerified = true;
  const dlVerified = true;

  const handleBookNow = () => {
    if (!aadhaarVerified || !dlVerified) {
      setShowVerifyModal(true);
      return;
    }
    router.push({ pathname: "/car-book", params: { carId: car?.id } });
  };

  const { data: car, isLoading } = useQuery({
    queryKey: ["car", id],
    queryFn: () => getCarById(id as string),
    enabled: !!id,
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

  if (!car) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.background,
        }}
      >
        <Text style={{ color: Colors.light.iconMuted }}>Car not found</Text>
      </View>
    );
  }

  const images = car.images?.map((img: any) => img.image_url) || [];
  const pickupAddress = car.address?.[0];
  const brand = (Array.isArray(car.brand) ? car.brand[0] : car.brand) as {
    name: string;
  };
  const model = (Array.isArray(car.model) ? car.model[0] : car.model) as {
    name: string;
  };

  const specs = [
    {
      icon: "calendar-outline",
      label: car.manufacturing_year?.toString() ?? "—",
      sublabel: "Year",
    },
    {
      icon: "people-outline",
      label: `${car.vehicle_seat_capacity ?? "—"}`,
      sublabel: "Seats",
    },
    {
      icon: FUEL_ICONS[car.fuel_type?.toLowerCase()] ?? "water-outline",
      label: car.fuel_type?.toUpperCase() ?? "—",
      sublabel: "Fuel",
    },
    {
      icon: "car-sport-outline",
      label: car.body_type?.toUpperCase() ?? "—",
      sublabel: "Type",
    },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
          <View>
            <ImageSlider images={images} />
            <Pressable
              onPress={() => router.back()}
              style={{
                position: "absolute",
                top: insets.top + 10,
                left: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255,255,255,0.95)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 5,
              }}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={Colors.light.text}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title + price */}
            <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
              <HStack
                style={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <VStack style={{ flex: 1, marginRight: 12, gap: 6 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: Colors.light.text,
                      letterSpacing: -0.4,
                    }}
                  >
                    {brand.name} {model.name}
                  </Text>

                  <HStack style={{ alignItems: "center", gap: 5 }}>
                    <Ionicons name="star" size={13} color="#F5A524" />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "#F5A524",
                      }}
                    >
                      {car.review_count > 0
                        ? car.average_rating.toFixed(1)
                        : "New"}
                    </Text>
                    {car.review_count > 0 && (
                      <Text
                        style={{ fontSize: 13, color: Colors.light.iconMuted }}
                      >
                        · {car.review_count} reviews
                      </Text>
                    )}
                  </HStack>
                </VStack>

                <VStack style={{ alignItems: "flex-end", gap: 1 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: Colors.light.tint,
                      letterSpacing: -0.4,
                    }}
                  >
                    ₹{car.hourly_price}
                  </Text>
                  <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
                    per hour
                  </Text>
                </VStack>
              </HStack>
            </View>

            {/* Specs 2×2 grid */}
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 24,
                backgroundColor: Colors.light.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.light.cardBorder,
                overflow: "hidden",
              }}
            >
              {[
                [specs[0], specs[1]],
                [specs[2], specs[3]],
              ].map((row, rowIdx) => (
                <View key={rowIdx}>
                  {rowIdx > 0 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: Colors.light.cardBorder,
                      }}
                    />
                  )}
                  <HStack>
                    {row.map((spec, colIdx) => (
                      <React.Fragment key={spec.sublabel}>
                        {colIdx > 0 && (
                          <View
                            style={{
                              width: 1,
                              backgroundColor: Colors.light.cardBorder,
                            }}
                          />
                        )}
                        <HStack
                          style={{
                            flex: 1,
                            alignItems: "center",
                            gap: 12,
                            paddingVertical: 16,
                            paddingHorizontal: 16,
                          }}
                        >
                          <View
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: Colors.light.tint + "12",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Ionicons
                              name={spec.icon as any}
                              size={18}
                              color={Colors.light.tint}
                            />
                          </View>
                          <VStack style={{ gap: 2 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: Colors.light.text,
                              }}
                            >
                              {spec.label}
                            </Text>
                            <Text
                              style={{
                                fontSize: 11,
                                color: Colors.light.iconMuted,
                              }}
                            >
                              {spec.sublabel}
                            </Text>
                          </VStack>
                        </HStack>
                      </React.Fragment>
                    ))}
                  </HStack>
                </View>
              ))}
            </View>

            {/* Pickup + Features + Reviews */}
            <VStack style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
              <PickupLocationCard
                address={pickupAddress}
                latitude={pickupAddress?.latitude}
                longitude={pickupAddress?.longitude}
              />

              {car.features?.length > 0 && (
                <VStack style={{ gap: 12 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: Colors.light.text,
                      letterSpacing: -0.2,
                    }}
                  >
                    Features
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {car.features.map((f: any) => (
                      <View
                        key={f.feature.id}
                        style={{
                          backgroundColor: Colors.light.tint + "12",
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 100,
                          borderWidth: 1,
                          borderColor: Colors.light.tint + "20",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: Colors.light.tint,
                          }}
                        >
                          {f.feature.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                </VStack>
              )}

              <ReviewList reviews={car.reviews} carId={car.id} />
            </VStack>
          </ScrollView>

          {/* Bottom bar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: Colors.light.card,
              borderTopWidth: 1,
              borderTopColor: Colors.light.cardBorder,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
              paddingTop: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <HStack
              style={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <VStack style={{ gap: 2 }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: Colors.light.tint,
                    letterSpacing: -0.4,
                  }}
                >
                  ₹{car.hourly_price}
                </Text>
                <HStack style={{ alignItems: "center", gap: 5 }}>
                  <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
                    per hour
                  </Text>
                  <View
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: Colors.light.iconMuted,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: Colors.light.success,
                      fontWeight: "600",
                    }}
                  >
                    Free cancellation
                  </Text>
                </HStack>
              </VStack>

              <Button
                size="lg"
                style={{ paddingHorizontal: 36 }}
                onPress={handleBookNow}
              >
                <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
                  Book Now
                </ButtonText>
              </Button>
            </HStack>
          </View>
        </View>
      </GestureHandlerRootView>

      {/* Verification required modal */}
      <Modal
        visible={showVerifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerifyModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowVerifyModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 32,
            }}
            onPress={() => {}}
          >
            <VStack style={{ gap: 20 }}>
              <HStack style={{ alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: "#FFFBEB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={24} color="#D97706" />
                </View>
                <VStack style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: "700",
                      color: Colors.light.text,
                    }}
                  >
                    Verify Your Profile
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                    Required before making a booking
                  </Text>
                </VStack>
              </HStack>

              <VStack style={{ gap: 10 }}>
                {!aadhaarVerified && (
                  <HStack
                    style={{
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: "#FEF2F2",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <FileText size={18} color="#DC2626" />
                    <VStack style={{ flex: 1, gap: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: Colors.light.text,
                        }}
                      >
                        Aadhaar Verification
                      </Text>
                      <Text style={{ fontSize: 12, color: "#DC2626" }}>
                        Not verified
                      </Text>
                    </VStack>
                  </HStack>
                )}
                {!dlVerified && (
                  <HStack
                    style={{
                      alignItems: "center",
                      gap: 12,
                      backgroundColor: "#FEF2F2",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <CreditCard size={18} color="#DC2626" />
                    <VStack style={{ flex: 1, gap: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: Colors.light.text,
                        }}
                      >
                        Driving License
                      </Text>
                      <Text style={{ fontSize: 12, color: "#DC2626" }}>
                        Not verified
                      </Text>
                    </VStack>
                  </HStack>
                )}
              </VStack>

              <VStack style={{ gap: 10 }}>
                <Button
                  size="xl"
                  onPress={() => {
                    setShowVerifyModal(false);
                    router.push("/(main)/profile");
                  }}
                >
                  <ButtonText>Go to Profile & Verify</ButtonText>
                </Button>
                <TouchableOpacity
                  onPress={() => setShowVerifyModal(false)}
                  style={{ alignItems: "center", paddingVertical: 8 }}
                >
                  <Text style={{ fontSize: 14, color: Colors.light.iconMuted }}>
                    Not now
                  </Text>
                </TouchableOpacity>
              </VStack>
            </VStack>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
