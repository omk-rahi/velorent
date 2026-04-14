import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";

import { BookingCard } from "@/components/features/bookings/booking-card";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { BookingStatus, BookingTabs } from "./bookings-tabs";

type Props = {
  bookings: any[];
};

export function BookingList({ bookings }: Props) {
  const [tab, setTab] = useState<BookingStatus>("active");

  const filtered = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter((b: any) => {
      const status = b.status;
      if (tab === "active") return status === "ongoing" || status === "confirmed";
      if (tab === "upcoming") return status === "pending";
      if (tab === "completed") return status === "completed";
      if (tab === "cancelled") return status === "cancelled";
      return false;
    });
  }, [bookings, tab]);

  return (
    <VStack style={{ marginTop: 20, gap: 16 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "800",
          color: Colors.light.text,
          letterSpacing: -0.5,
        }}
      >
        My Bookings
      </Text>

      <BookingTabs value={tab} onChange={setTab} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={{ gap: 14 }}
        renderItem={({ item }) => <BookingCard booking={item} status={tab} />}
        ListEmptyComponent={
          <VStack style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
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
              <Text style={{ fontSize: 28 }}>📋</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.light.text }}>
              No {tab} bookings
            </Text>
            <Text style={{ fontSize: 13, color: Colors.light.iconMuted, textAlign: "center" }}>
              Your {tab} bookings will appear here
            </Text>
          </VStack>
        }
      />
    </VStack>
  );
}
