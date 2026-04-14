import { getBookings } from "@/api/bookings";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import useUser from "@/store/use-user";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Calendar,
  CalendarX2,
  Car,
  Check,
  ChevronDown,
  Flag,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_FILTERS = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
] as const;

type FilterValue = (typeof STATUS_FILTERS)[number]["value"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "#B45309", bg: "rgba(245,158,11,0.1)" },
  confirmed: { label: "Confirmed", color: Colors.light.tint, bg: "rgba(26,86,255,0.1)" },
  ongoing: { label: "Ongoing", color: Colors.light.success, bg: "rgba(16,185,129,0.1)" },
  completed: { label: "Completed", color: Colors.light.icon, bg: "rgba(100,116,139,0.1)" },
  rejected: { label: "Rejected", color: "#B91C1C", bg: "rgba(185,28,28,0.1)" },
  cancelled: { label: "Cancelled", color: Colors.light.error, bg: "rgba(239,68,68,0.1)" },
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

function BookingCard({ item }: { item: any }) {
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
  const carName = item.car?.name ?? "Car";
  const regNo = item.car?.registration_number ?? "-";
  const primaryImg = item.car?.image_url ?? null;
  const hostName = item.car?.host_name ?? "Host";
  const bookingRef = `#${item.id.slice(-8).toUpperCase()}`;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() =>
        router.push({ pathname: "/bookings/[id]", params: { id: item.id } })
      }
      style={{
        backgroundColor: "#fff",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: Colors.light.cardBorder,
        overflow: "hidden",
        marginHorizontal: 20,
      }}
    >
      <HStack style={{ padding: 14, gap: 12, alignItems: "center" }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            backgroundColor: "#F1F5F9",
            overflow: "hidden",
          }}
        >
          {primaryImg ? (
            <Image
              source={{ uri: primaryImg }}
              style={{ width: 52, height: 52 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Car size={20} color={Colors.light.iconMuted} />
            </View>
          )}
        </View>

        <VStack style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }} numberOfLines={1}>
            {carName}
          </Text>
          <Text style={{ fontSize: 12, color: Colors.light.iconMuted, fontWeight: "500" }}>
            {regNo}
          </Text>
        </VStack>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 20,
            backgroundColor: cfg.bg,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: cfg.color }}>
            {cfg.label}
          </Text>
        </View>
      </HStack>

      <View style={{ height: 1, backgroundColor: Colors.light.cardBorder, marginHorizontal: 14 }} />

      <VStack style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 6 }}>
        <HStack style={{ justifyContent: "space-between", alignItems: "center" }}>
          <HStack style={{ alignItems: "center", gap: 6 }}>
            <User size={14} color={Colors.light.iconMuted} />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#0F172A" }} numberOfLines={1}>
              {hostName}
            </Text>
          </HStack>
          <Text style={{ fontSize: 11, color: Colors.light.iconMuted, fontWeight: "500" }}>
            {bookingRef}
          </Text>
        </HStack>
        <HStack style={{ alignItems: "center", gap: 6 }}>
          <Calendar size={13} color={Colors.light.iconMuted} />
          <Text style={{ fontSize: 12, color: Colors.light.icon, fontWeight: "500" }}>
            {fmtDate(item.start_time)}, {fmtTime(item.start_time)}
          </Text>
        </HStack>
        <HStack style={{ alignItems: "center", gap: 6 }}>
          <Flag size={13} color={Colors.light.iconMuted} />
          <Text style={{ fontSize: 12, color: Colors.light.icon, fontWeight: "500" }}>
            {fmtDate(item.end_time)}, {fmtTime(item.end_time)}
          </Text>
        </HStack>
      </VStack>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: Colors.light.cardBorder,
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <VStack style={{ gap: 1 }}>
          <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>Total Paid</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>
            Rs {Number(item.total_amount ?? 0).toLocaleString("en-IN")}
          </Text>
        </VStack>
        <View style={{ width: 1, height: 28, backgroundColor: Colors.light.cardBorder }} />
        <VStack style={{ gap: 1, alignItems: "flex-end" }}>
          <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>Deposit</Text>
          <Text style={{ fontSize: 15, fontWeight: "800", color: Colors.light.tint }}>
            Rs {Number(item.deposit_amount ?? 0).toLocaleString("en-IN")}
          </Text>
        </VStack>
      </View>
    </TouchableOpacity>
  );
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const profile = useUser((u) => u.profile);

  const { data, isLoading } = useQuery({
    queryKey: ["bookings", profile?.id],
    queryFn: () => getBookings(profile!.id),
    enabled: !!profile?.id,
  });

  const periodOptions = [
    { label: "All time", value: "all" },
    ...Array.from(
      new Set(
        (data ?? []).map((b: any) => {
          const d = new Date(b.start_time);
          return `${d.getFullYear()}-${d.getMonth() + 1}`;
        }),
      ),
    )
      .sort((a, b) => b.localeCompare(a))
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        return {
          label: new Date(year, month - 1).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          }),
          value: key,
        };
      }),
  ];

  const filtered = (data ?? []).filter((b: any) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (periodFilter !== "all") {
      const [y, m] = periodFilter.split("-").map(Number);
      const d = new Date(b.start_time);
      if (d.getFullYear() !== y || d.getMonth() + 1 !== m) return false;
    }
    return true;
  });

  const activeStatusLabel =
    STATUS_FILTERS.find((f) => f.value === filter)?.label ?? "All statuses";
  const activePeriodLabel =
    periodOptions.find((o) => o.value === periodFilter)?.label ?? "All time";
  const isFiltered = filter !== "all";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F8FC" }} edges={["top"]}>
      <Heading
        size="2xl"
        style={{
          fontWeight: "800",
          color: "#0F172A",
          letterSpacing: -0.5,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 14,
        }}
      >
        Bookings
      </Heading>

      <HStack style={{ paddingHorizontal: 20, paddingBottom: 14, gap: 10 }}>
        {[
          {
            label: activePeriodLabel,
            active: periodFilter !== "all",
            onPress: () => setPeriodSheetOpen(true),
          },
          {
            label: activeStatusLabel,
            active: isFiltered,
            onPress: () => setSheetOpen(true),
          },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.label}
            onPress={btn.onPress}
            activeOpacity={0.8}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: btn.active ? Colors.light.tint : Colors.light.cardBorder,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: btn.active ? "700" : "500",
                color: btn.active ? Colors.light.tint : Colors.light.icon,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {btn.label}
            </Text>
            <ChevronDown size={14} color={btn.active ? Colors.light.tint : Colors.light.iconMuted} />
          </TouchableOpacity>
        ))}
      </HStack>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      ) : filtered.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 40,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(26,86,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <CalendarX2 size={34} color={Colors.light.tint} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A", marginBottom: 6 }}>
            No bookings {isFiltered ? `(${activeStatusLabel})` : "yet"}
          </Text>
          <Text style={{ fontSize: 14, color: Colors.light.iconMuted, textAlign: "center" }}>
            {!isFiltered
              ? "Your bookings will appear here once you make one."
              : `No ${activeStatusLabel.toLowerCase()} bookings at the moment.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BookingCard item={item} />}
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        visible={periodSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPeriodSheetOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}
          onPress={() => setPeriodSheetOpen(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 44,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#E2E8F0",
                  alignSelf: "center",
                  marginBottom: 18,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: Colors.light.iconMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Filter by Period
              </Text>
              {periodOptions.map((item, i) => {
                const isActive = periodFilter === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => {
                      setPeriodFilter(item.value);
                      setPeriodSheetOpen(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 15,
                      borderBottomWidth: i < periodOptions.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.light.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "700" : "400",
                        color: isActive ? Colors.light.tint : Colors.light.text,
                      }}
                    >
                      {item.label}
                    </Text>
                    {isActive && <Check size={16} color={Colors.light.tint} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}
          onPress={() => setSheetOpen(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: "#fff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 44,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "#E2E8F0",
                  alignSelf: "center",
                  marginBottom: 18,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: Colors.light.iconMuted,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Filter by Status
              </Text>

              {STATUS_FILTERS.map((item, i) => {
                const isActive = filter === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => {
                      setFilter(item.value);
                      setSheetOpen(false);
                    }}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 15,
                      borderBottomWidth: i < STATUS_FILTERS.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.light.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isActive ? "700" : "400",
                        color: isActive ? Colors.light.tint : Colors.light.text,
                      }}
                    >
                      {item.label}
                    </Text>
                    {isActive && <Check size={16} color={Colors.light.tint} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
