import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { HStack } from "@/components/ui/hstack";
import { Image } from "@/components/ui/image";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { BookingStatus } from "./bookings-tabs";

type Props = {
  booking: any;
  status: BookingStatus;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "In Use", color: Colors.light.tint, bg: "rgba(26,86,255,0.10)" },
  upcoming: { label: "Upcoming", color: "#0F766E", bg: "rgba(15,118,110,0.10)" },
  completed: { label: "Completed", color: Colors.light.icon, bg: "rgba(100,116,139,0.10)" },
  cancelled: { label: "Cancelled", color: Colors.light.error, bg: "rgba(239,68,68,0.10)" },
};

export function BookingCard({ booking, status }: Props) {
  const car = booking.car;
  const endDate = new Date(booking.end_time);
  const startDate = new Date(booking.start_time);

  const formattedEnd = endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const formattedStart = startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const statusConf = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;

  return (
    <Link href={`/(main)/bookings/${booking.id}`} asChild>
      <Pressable>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: Colors.light.card,
            borderRadius: 20,
            padding: 14,
            borderWidth: 1,
            borderColor: Colors.light.cardBorder,
            shadowColor: "#1A56FF",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.07,
            shadowRadius: 10,
            elevation: 3,
            gap: 14,
            alignItems: "center",
          }}
        >
          {/* Car Image */}
          <Image
            source={{
              uri: car?.image_url || "https://images.unsplash.com/photo-1619767886558-efdc259cde1a",
            }}
            alt="Car"
            resizeMode="cover"
            style={{
              width: 110,
              height: 110,
              borderRadius: 16,
            }}
          />

          {/* Content */}
          <VStack style={{ flex: 1, justifyContent: "space-between", height: 110, paddingVertical: 2 }}>
            <VStack style={{ gap: 2 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: Colors.light.text,
                  letterSpacing: -0.2,
                }}
                numberOfLines={1}
              >
                {car?.car_models?.name || "Unknown Model"}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.light.iconMuted }}>
                {formattedStart} → {formattedEnd}
              </Text>
            </VStack>

            <VStack style={{ gap: 6 }}>
              <HStack style={{ gap: 6, alignItems: "center" }}>
                <Ionicons name="person-outline" size={13} color={Colors.light.tint} />
                <Text
                  style={{ fontSize: 12, fontWeight: "500", color: Colors.light.icon }}
                  numberOfLines={1}
                >
                  {car?.host_name || "Host"}
                </Text>
              </HStack>

              <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
                <HStack style={{ gap: 5, alignItems: "center" }}>
                  <Ionicons name="call-outline" size={13} color={Colors.light.tint} />
                  <Text style={{ fontSize: 12, color: Colors.light.icon }} numberOfLines={1}>
                    {car?.host_phone || "N/A"}
                  </Text>
                </HStack>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    backgroundColor: statusConf.bg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: statusConf.color,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: statusConf.color,
                      letterSpacing: 0.2,
                    }}
                  >
                    {statusConf.label}
                  </Text>
                </View>
              </HStack>
            </VStack>
          </VStack>
        </View>
      </Pressable>
    </Link>
  );
}
