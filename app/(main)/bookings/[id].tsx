import { cancelBooking, getBookingById } from "@/api/bookings";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Car, User } from "lucide-react-native";
import {
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  pending: {
    label: "Pending Approval",
    color: "#B45309",
    bg: "rgba(245,158,11,0.1)",
  },
  confirmed: {
    label: "Confirmed",
    color: Colors.light.tint,
    bg: "rgba(26,86,255,0.1)",
  },
  ongoing: {
    label: "Trip Ongoing",
    color: Colors.light.success,
    bg: "rgba(16,185,129,0.1)",
  },
  completed: {
    label: "Completed",
    color: Colors.light.icon,
    bg: "rgba(100,116,139,0.1)",
  },
  rejected: {
    label: "Rejected",
    color: "#B91C1C",
    bg: "rgba(185,28,28,0.1)",
  },
  cancelled: {
    label: "Cancelled",
    color: Colors.light.error,
    bg: "rgba(239,68,68,0.1)",
  },
};

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(str: string) {
  return new Date(str).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDateTime(str: string) {
  return `${fmtDate(str)}, ${fmtTime(str)}`;
}

function formatDisputeType(type?: string | null) {
  if (!type) return "Dispute";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDisputeStatus(status?: string | null) {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatPickupType(pickupType?: string | null) {
  if (!pickupType) return "Self Pickup";
  if (pickupType === "self_pickup") return "Self Pickup";
  if (pickupType === "home_delivery") return "Home Delivery";
  return pickupType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getBookingEventUi(eventType?: string | null) {
  switch (String(eventType ?? "").toLowerCase()) {
    case "created":
      return {
        label: "Booking Created",
        icon: "checkmark-outline",
        color: Colors.light.success,
        bg: "rgba(16,185,129,0.12)",
      };
    case "handover_confirmed":
      return {
        label: "Handover Confirmed",
        icon: "car-outline",
        color: Colors.light.tint,
        bg: "rgba(26,86,255,0.12)",
      };
    case "trip_started":
      return {
        label: "Trip Started",
        icon: "play-outline",
        color: Colors.light.success,
        bg: "rgba(16,185,129,0.12)",
      };
    case "trip_ended":
      return {
        label: "Trip Ended",
        icon: "flag-outline",
        color: Colors.light.tint,
        bg: "rgba(26,86,255,0.12)",
      };
    case "returned":
      return {
        label: "Vehicle Returned",
        icon: "checkmark-done-outline",
        color: Colors.light.success,
        bg: "rgba(16,185,129,0.12)",
      };
    case "cancelled_by_customer":
      return {
        label: "Cancelled by You",
        icon: "close-circle-outline",
        color: Colors.light.error,
        bg: "rgba(239,68,68,0.12)",
      };
    case "rejected_by_host":
      return {
        label: "Rejected by Host",
        icon: "ban-outline",
        color: Colors.light.error,
        bg: "rgba(239,68,68,0.12)",
      };
    default:
      return {
        label: String(eventType ?? "Activity")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: "time-outline",
        color: Colors.light.icon,
        bg: "rgba(100,116,139,0.12)",
      };
  }
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <VStack style={{ gap: 8, marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: Colors.light.iconMuted,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 18,
          borderWidth: 1,
          borderColor: Colors.light.cardBorder,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </VStack>
  );
}

function InfoRow({
  label,
  value,
  valueColor,
  bold,
  last,
}: {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
  last?: boolean;
}) {
  return (
    <>
      <HStack
        style={{
          paddingHorizontal: 16,
          paddingVertical: 13,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 14, color: Colors.light.icon }}>{label}</Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: bold ? "700" : "600",
            color: valueColor ?? "#0F172A",
          }}
        >
          {value}
        </Text>
      </HStack>
      {!last && (
        <View
          style={{
            height: 1,
            backgroundColor: Colors.light.cardBorder,
            marginLeft: 16,
          }}
        />
      )}
    </>
  );
}

function ProofRow({
  label,
  onPress,
  last,
}: {
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <HStack
          style={{
            paddingHorizontal: 16,
            paddingVertical: 13,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, color: Colors.light.icon }}>
            {label}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.light.tint }}>View</Text>
        </HStack>
      </TouchableOpacity>
      {!last && (
        <View
          style={{
            height: 1,
            backgroundColor: Colors.light.cardBorder,
            marginLeft: 16,
          }}
        />
      )}
    </>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bottom } = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const logQueryError = (scope: string, err: any) => {
    console.error(`[booking-detail:${scope}]`, {
      bookingId: id,
      message: err?.message,
      code: err?.code,
      details: err?.details,
      hint: err?.hint,
      raw: err,
    });
  };

  const {
    data: booking,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id!),
    enabled: !!id,
    onError: (err) => logQueryError("booking", err),
  });

  const { data: disputesData } = useQuery({
    queryKey: ["booking-disputes", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("id, dispute_type, description, status, created_at")
        .eq("booking_id", id!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    onError: (err) => logQueryError("disputes", err),
  });

  const { data: bookingEventsData } = useQuery({
    queryKey: ["booking-events", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_events")
        .select("id, event_type, created_at")
        .eq("booking_id", id!)
        .order("created_at", { ascending: true });

      if (error) {
        const message = String(error.message ?? "").toLowerCase();
        if (message.includes("booking_events")) return [];
        throw error;
      }
      return data ?? [];
    },
    onError: (err) => logQueryError("events", err),
  });

  const { data: handoverDetailData } = useQuery({
    queryKey: ["booking-handover-details", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_handover_details")
        .select(
          "id, start_odometer_km, odometer_proof_url, customer_photo_url, handover_proof_url, created_at",
        )
        .eq("booking_id", id!)
        .maybeSingle();

      if (error) {
        const message = String(error.message ?? "").toLowerCase();
        if (message.includes("booking_handover_details")) return null;
        throw error;
      }
      return data;
    },
    onError: (err) => logQueryError("handover", err),
  });

  const { data: returnDetailData } = useQuery({
    queryKey: ["booking-return-details", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_return_details")
        .select(
          "id, end_odometer_km, odometer_proof_url, return_proof_url, created_at",
        )
        .eq("booking_id", id!)
        .maybeSingle();

      if (error) {
        const message = String(error.message ?? "").toLowerCase();
        if (message.includes("booking_return_details")) return null;
        throw error;
      }
      return data;
    },
    onError: (err) => logQueryError("return", err),
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: () => cancelBooking(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking-events", id] });
      Alert.alert("Booking Cancelled", "Your booking has been cancelled.");
    },
    onError: (error: any) => {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Failed to cancel booking.";
      Alert.alert("Error", message);
    },
  });

  if (!id) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F8FC",
        }}
      >
        <VStack
          style={{ alignItems: "center", gap: 10, paddingHorizontal: 24 }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>
            Missing booking id
          </Text>
          <Button size="md" onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  if (isLoading) return <Loader />;

  if (isError) {
    const message =
      typeof (error as any)?.message === "string"
        ? (error as any).message
        : "Could not load booking details.";
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F8FC",
        }}
      >
        <VStack
          style={{ alignItems: "center", gap: 10, paddingHorizontal: 24 }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>
            Failed to load booking
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: Colors.light.iconMuted,
              textAlign: "center",
            }}
          >
            {message}
          </Text>
          <HStack style={{ gap: 10, marginTop: 4 }}>
            <Button size="md" variant="outline" onPress={() => router.back()}>
              <ButtonText>Go Back</ButtonText>
            </Button>
            <Button size="md" onPress={() => refetch()}>
              <ButtonText>Retry</ButtonText>
            </Button>
          </HStack>
        </VStack>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F8FC",
        }}
      >
        <VStack
          style={{ alignItems: "center", gap: 10, paddingHorizontal: 24 }}
        >
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>
            Booking not found
          </Text>
          <Button size="md" onPress={() => router.back()}>
            <ButtonText>Go Back</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const car = booking.car as any;
  const brandName = car?.car_brands?.name ?? "";
  const modelName = car?.car_models?.name ?? "";
  const carName = `${brandName} ${modelName}`.trim() || "—";
  const hostName = car?.host?.full_name ?? "Host";
  const hostPhone = car?.host?.phone ?? "";
  const hasHostPhone = !!hostPhone;
  const primaryImg =
    car?.car_images?.find((i: any) => i.is_primary)?.image_url ??
    car?.car_images?.[0]?.image_url ??
    null;

  const pickupAddress = car?.car_pickup_addresses?.[0];
  const fullAddress = pickupAddress
    ? `${pickupAddress.address_line1}, ${pickupAddress.city}`
    : null;

  const deliveryAddress =
    typeof booking.delivery_address === "string"
      ? booking.delivery_address.trim()
      : "";

  const rawBookingEvents = Array.isArray(bookingEventsData)
    ? bookingEventsData
    : [];
  const fallbackBookingEvents = [
    {
      id: "fallback-created",
      event_type: "created",
      created_at: booking.created_at,
    },
    ...(booking.status === "ongoing" || booking.status === "completed"
      ? [
          {
            id: "fallback-handover-confirmed",
            event_type: "handover_confirmed",
            created_at: booking.start_time,
          },
          {
            id: "fallback-trip-started",
            event_type: "trip_started",
            created_at: booking.start_time,
          },
        ]
      : []),
    ...(booking.status === "completed"
      ? [
          {
            id: "fallback-trip-ended",
            event_type: "trip_ended",
            created_at: booking.end_time,
          },
          {
            id: "fallback-returned",
            event_type: "returned",
            created_at: booking.end_time,
          },
        ]
      : []),
    ...(booking.status === "cancelled"
      ? [
          {
            id: "fallback-cancelled",
            event_type: "cancelled_by_customer",
            created_at: booking.updated_at,
          },
        ]
      : []),
    ...(booking.status === "rejected"
      ? [
          {
            id: "fallback-rejected",
            event_type: "rejected_by_host",
            created_at: booking.updated_at,
          },
        ]
      : []),
  ];
  const bookingEvents =
    rawBookingEvents.length > 0 ? rawBookingEvents : fallbackBookingEvents;
  const handoverDetails = (handoverDetailData as any) ?? null;
  const returnDetails = (returnDetailData as any) ?? null;
  const disputes = Array.isArray(disputesData) ? disputesData : [];
  const cancellationCutoffHours = 12;
  const msUntilPickup = new Date(booking.start_time).getTime() - Date.now();
  const canCancelByTime = msUntilPickup >= cancellationCutoffHours * 60 * 60 * 1000;
  const cancelBlockedReason = canCancelByTime
    ? ""
    : `Cancellation is only allowed at least ${cancellationCutoffHours} hours before pickup.`;

  const handleCancelPress = () => {
    if (!canCancelByTime) {
      Alert.alert("Cancellation Not Allowed", cancelBlockedReason);
      return;
    }
    Alert.alert("Cancel Booking?", "Are you sure you want to cancel this booking?", [
      { text: "Keep Booking", style: "cancel" },
      {
        text: "Cancel Booking",
        style: "destructive",
        onPress: () => cancel(),
      },
    ]);
  };

  const openProof = async (url?: string | null) => {
    const cleanUrl = typeof url === "string" ? url.trim() : "";
    if (!cleanUrl) {
      Alert.alert("Missing Proof", "Proof image is not available.");
      return;
    }
    try {
      await Linking.openURL(cleanUrl);
    } catch {
      Alert.alert("Open Failed", "Could not open proof image.");
    }
  };

  const handleCallHost = async () => {
    if (!hasHostPhone) return;
    try {
      await Linking.openURL(`tel:${hostPhone}`);
    } catch {
      Alert.alert("Call Failed", "Unable to place a call right now.");
    }
  };

  const openMap = () => {
    if (pickupAddress?.latitude && pickupAddress?.longitude) {
      const scheme = Platform.select({
        ios: "maps:0,0?q=",
        android: "geo:0,0?q=",
      });
      const latLng = `${pickupAddress.latitude},${pickupAddress.longitude}`;
      const label = "Car Pickup Location";
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
      });
      if (url) Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F7F8FC" }}
      edges={["top"]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        style={{
          marginHorizontal: 20,
          marginTop: 12,
          marginBottom: 8,
          paddingVertical: 10,
          alignSelf: "flex-start",
        }}
      >
        <HStack style={{ gap: 6, alignItems: "center" }}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: Colors.light.text,
            }}
          >
            Back to Bookings
          </Text>
        </HStack>
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: bottom + 110,
        }}
      >
        {/* Car image */}
        <View
          style={{
            height: 190,
            borderRadius: 18,
            overflow: "hidden",
            backgroundColor: "#E2E8F0",
          }}
        >
          {primaryImg ? (
            <Image
              source={{ uri: primaryImg }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Car size={48} color={Colors.light.iconMuted} />
            </View>
          )}
          <View
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: cfg.color }}>
              {cfg.label}
            </Text>
          </View>
        </View>

        {/* Title */}
        <VStack style={{ gap: 4, marginVertical: 24 }}>
          <HStack
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Heading
              size="xl"
              style={{
                fontWeight: "800",
                color: "#0F172A",
                flex: 1,
                letterSpacing: -0.4,
              }}
            >
              {carName}
            </Heading>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: Colors.light.iconMuted,
                marginTop: 3,
              }}
            >
              #{booking.id.slice(-8).toUpperCase()}
            </Text>
          </HStack>
          <Text style={{ fontSize: 14, color: Colors.light.iconMuted }}>
            {car?.registration_number ?? ""}
          </Text>
        </VStack>

        {/* OTP Banner for confirmed bookings */}
        {booking.status === "confirmed" && booking.otp && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/bookings/otp",
                params: { bookingId: booking.id, otp: booking.otp },
              })
            }
            style={{
              backgroundColor: Colors.light.tint,
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#fff"
              />
            </View>
            <VStack style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}>
                Show OTP to Host
              </Text>
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)" }}>
                Tap to view your 6-digit handover OTP
              </Text>
            </VStack>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        )}

        {/* Booking Overview */}
        <SectionCard title="Booking Overview">
          <InfoRow label="Pickup" value={fmtDateTime(booking.start_time)} />
          <InfoRow label="Drop-off" value={fmtDateTime(booking.end_time)} />
          <InfoRow label="Duration" value={`${booking.total_hours} hrs`} />
          <InfoRow
            label="Pickup Type"
            value={formatPickupType(booking.pickup_type)}
            last
          />
        </SectionCard>

        {/* Location */}
        {deliveryAddress ? (
          <SectionCard title="Delivery Location">
            <InfoRow label="Address" value={deliveryAddress} last />
          </SectionCard>
        ) : fullAddress ? (
          <SectionCard title="Pickup Location">
            <View style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
              <HStack
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <VStack style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, color: Colors.light.icon }}>
                    Address
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#0F172A",
                    }}
                  >
                    {fullAddress}
                  </Text>
                </VStack>
                {pickupAddress?.latitude && (
                  <TouchableOpacity
                    onPress={openMap}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                      borderRadius: 10,
                      backgroundColor: "rgba(26,86,255,0.1)",
                    }}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={14}
                      color={Colors.light.tint}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: Colors.light.tint,
                      }}
                    >
                      Navigate
                    </Text>
                  </TouchableOpacity>
                )}
              </HStack>
            </View>
          </SectionCard>
        ) : null}

        {/* Host Details */}
        <SectionCard title="Host Details">
          <HStack
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 12,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(26,86,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <User size={18} color={Colors.light.tint} />
            </View>
            <VStack style={{ flex: 1, gap: 2 }}>
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}
              >
                {hostName}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                {hostPhone || "—"}
              </Text>
            </VStack>
            {hasHostPhone && (
              <TouchableOpacity
                onPress={handleCallHost}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: "rgba(26,86,255,0.1)",
                }}
              >
                <Ionicons
                  name="call-outline"
                  size={14}
                  color={Colors.light.tint}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: Colors.light.tint,
                  }}
                >
                  Call
                </Text>
              </TouchableOpacity>
            )}
          </HStack>
        </SectionCard>

        {/* Payment Breakdown */}
        <SectionCard title="Payment Breakdown">
          <InfoRow
            label="Base Amount"
            value={`₹${booking.base_amount.toLocaleString("en-IN")}`}
          />
          {booking.delivery_amount > 0 && (
            <InfoRow
              label="Delivery Charge"
              value={`₹${booking.delivery_amount.toLocaleString("en-IN")}`}
            />
          )}
          {booking.deposit_amount > 0 && (
            <InfoRow
              label="Security Deposit"
              value={`₹${booking.deposit_amount.toLocaleString("en-IN")}`}
            />
          )}
          <HStack
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(26,86,255,0.04)",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
              Total Paid
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: Colors.light.tint,
              }}
            >
              ₹{booking.total_amount.toLocaleString("en-IN")}
            </Text>
          </HStack>
        </SectionCard>

        {/* Activity Timeline */}
        <SectionCard title="Activity">
          {bookingEvents.map((event: any, index: number) => {
            const eventUi = getBookingEventUi(event?.event_type);
            return (
              <View
                key={event?.id ?? `${event?.event_type ?? "event"}-${index}`}
              >
                <HStack
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: eventUi.bg,
                    }}
                  >
                    <Ionicons
                      name={eventUi.icon as any}
                      size={16}
                      color={eventUi.color}
                    />
                  </View>
                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "#0F172A",
                      }}
                    >
                      {eventUi.label}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: Colors.light.iconMuted }}
                    >
                      {fmtDateTime(event?.created_at ?? booking.created_at)}
                    </Text>
                  </VStack>
                </HStack>
                {index !== bookingEvents.length - 1 && (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: Colors.light.cardBorder,
                      marginLeft: 16,
                    }}
                  />
                )}
              </View>
            );
          })}
        </SectionCard>

        {/* Handover Details */}
        {handoverDetails ? (
          <SectionCard title="Handover Details">
            <InfoRow
              label="Start Odometer"
              value={`${handoverDetails.start_odometer_km} km`}
            />
            <InfoRow
              label="Handover At"
              value={fmtDateTime(
                handoverDetails.created_at ?? booking.start_time,
              )}
            />
            <ProofRow
              label="Odometer Proof"
              onPress={() => openProof(handoverDetails.odometer_proof_url)}
            />
            <ProofRow
              label="Customer Photo"
              onPress={() => openProof(handoverDetails.customer_photo_url)}
            />
            <ProofRow
              label="Handover Proof"
              onPress={() => openProof(handoverDetails.handover_proof_url)}
              last
            />
          </SectionCard>
        ) : null}

        {/* Return Details */}
        {returnDetails ? (
          <SectionCard title="Return Details">
            <InfoRow
              label="End Odometer"
              value={`${returnDetails.end_odometer_km} km`}
            />
            <InfoRow
              label="Returned At"
              value={fmtDateTime(returnDetails.created_at ?? booking.end_time)}
              last
            />
            <ProofRow
              label="Odometer Proof"
              onPress={() => openProof(returnDetails.odometer_proof_url)}
            />
            <ProofRow
              label="Return Proof"
              onPress={() => openProof(returnDetails.return_proof_url)}
              last
            />
          </SectionCard>
        ) : null}

        {/* Disputes */}
        {disputes.length > 0 && (
          <SectionCard title="Disputes">
            {disputes.map((dispute: any, index: number) => {
              const disputeStatus = String(dispute?.status ?? "").toLowerCase();
              const statusConfig =
                disputeStatus === "in_review"
                  ? { bg: "rgba(245,158,11,0.12)", color: Colors.light.warning }
                  : disputeStatus === "resolved"
                    ? {
                        bg: "rgba(16,185,129,0.12)",
                        color: Colors.light.success,
                      }
                    : disputeStatus === "rejected"
                      ? {
                          bg: "rgba(239,68,68,0.12)",
                          color: Colors.light.error,
                        }
                      : disputeStatus === "open"
                        ? {
                            bg: "rgba(26,86,255,0.12)",
                            color: Colors.light.tint,
                          }
                        : {
                            bg: "rgba(100,116,139,0.12)",
                            color: Colors.light.icon,
                          };

              return (
                <View key={dispute.id ?? `${index}`}>
                  <HStack
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <VStack style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#0F172A",
                        }}
                      >
                        {formatDisputeType(dispute?.dispute_type)}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={{ fontSize: 12, color: Colors.light.iconMuted }}
                      >
                        {dispute?.description ?? "Dispute details"}
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: Colors.light.iconMuted }}
                      >
                        {fmtDateTime(dispute?.created_at ?? booking.created_at)}
                      </Text>
                    </VStack>
                    <View
                      style={{
                        paddingHorizontal: 9,
                        paddingVertical: 4,
                        borderRadius: 999,
                        backgroundColor: statusConfig.bg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: statusConfig.color,
                        }}
                      >
                        {formatDisputeStatus(disputeStatus)}
                      </Text>
                    </View>
                  </HStack>
                  {index !== disputes.length - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: Colors.light.cardBorder,
                        marginLeft: 16,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </SectionCard>
        )}
      </ScrollView>

      {/* Bottom CTAs */}
      {booking.status === "pending" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: Colors.light.cardBorder,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: bottom + 14,
          }}
        >
          <Button
            size="xl"
            style={{ borderRadius: 16, backgroundColor: Colors.light.error }}
            isDisabled={cancelling || !canCancelByTime}
            onPress={handleCancelPress}
          >
            {cancelling && <ButtonSpinner color="#fff" />}
            <ButtonText style={{ fontWeight: "700", fontSize: 15 }}>
              Cancel Booking
            </ButtonText>
          </Button>
          {!canCancelByTime && (
            <Text style={{ marginTop: 8, fontSize: 12, color: Colors.light.error }}>
              {cancelBlockedReason}
            </Text>
          )}
        </View>
      )}

      {booking.status === "confirmed" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: Colors.light.cardBorder,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: bottom + 14,
          }}
        >
          <HStack style={{ gap: 10 }}>
            <Button
              size="xl"
              style={{
                borderRadius: 16,
                backgroundColor: Colors.light.error,
                flex: 1,
              }}
              isDisabled={cancelling || !canCancelByTime}
              onPress={handleCancelPress}
            >
              {cancelling && <ButtonSpinner color="#fff" />}
              <ButtonText style={{ fontWeight: "700", fontSize: 15 }}>
                Cancel
              </ButtonText>
            </Button>
            <Button
              size="xl"
              style={{ borderRadius: 16, flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/bookings/otp",
                  params: {
                    bookingId: booking.id,
                    otp: booking.handover_otp ?? "",
                  },
                })
              }
            >
              <ButtonText style={{ fontWeight: "700", fontSize: 15 }}>
                Show OTP
              </ButtonText>
            </Button>
          </HStack>
          {!canCancelByTime && (
            <Text style={{ marginTop: 8, fontSize: 12, color: Colors.light.error }}>
              {cancelBlockedReason}
            </Text>
          )}
        </View>
      )}

      {booking.status === "completed" && (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: Colors.light.cardBorder,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: bottom + 14,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Button
            size="xl"
            style={{
              borderRadius: 16,
              flex: 1,
              backgroundColor: Colors.light.success,
            }}
            onPress={() =>
              router.push({
                pathname: "/bookings/review",
                params: { bookingId: booking.id, carId: booking.car_id },
              })
            }
          >
            <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
              Leave Review
            </ButtonText>
          </Button>
          <Button
            size="xl"
            style={{ borderRadius: 16, flex: 1 }}
            onPress={() =>
              router.push({
                pathname: "/bookings/dispute",
                params: { bookingId: booking.id },
              })
            }
          >
            <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
              Raise Dispute
            </ButtonText>
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
