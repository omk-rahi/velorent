import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { getCarAvailability, getCarById } from "@/api/cars";
import { BookingHeader } from "@/components/features/booking/booking-header";
import { Loader } from "@/components/shared/loader";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Colors } from "@/constants/theme";
import { useBookingSteps } from "@/hooks/use-booking-steps";
import {
  buildMarkedDates,
  formatDateToISO,
  getAvailableTimeSlots,
  parseDateTime,
  TIME_SLOTS,
} from "@/lib/booking-utils";
import { useBookingStore } from "@/store/use-booking-store";
import { useQuery } from "@tanstack/react-query";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toDisplayDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function findFirstAvailable(
  minISO: string,
  availability: any[],
  filterAfter?: Date,
): { iso: string; time: string } | null {
  for (let i = 0; i < 90; i++) {
    const d = new Date(minISO + "T12:00:00");
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    let slots = getAvailableTimeSlots(iso, availability);
    if (filterAfter) {
      slots = slots.filter(
        (s) => parseDateTime(toDisplayDate(iso), s) > filterAfter,
      );
    }
    if (slots.length > 0) return { iso, time: slots[0] };
  }
  return null;
}

function findFirstAvailable24HourWindow(
  minISO: string,
  availability: any[],
): { pickup: { iso: string; time: string }; dropoff: { iso: string; time: string } } | null {
  const pickup = findFirstAvailable(minISO, availability);
  if (!pickup) return null;

  const pickupDT = parseDateTime(toDisplayDate(pickup.iso), pickup.time);
  const minDropoffDT = new Date(pickupDT.getTime() + 24 * 60 * 60 * 1000);

  for (let i = 0; i < 90; i++) {
    const d = new Date(pickup.iso + "T12:00:00");
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const slots = getAvailableTimeSlots(iso, availability).filter((s) => {
      const slotDT = parseDateTime(toDisplayDate(iso), s);
      return slotDT >= minDropoffDT;
    });
    if (slots.length > 0) {
      return { pickup, dropoff: { iso, time: slots[0] } };
    }
  }

  return null;
}

function InlineCalendar({
  markedDates,
  minDateISO,
  selectedISO,
  onSelectDate,
}: {
  markedDates: Record<string, any>;
  minDateISO: string;
  selectedISO: string | null;
  onSelectDate: (iso: string) => void;
}) {
  const [viewYear, setViewYear] = useState(() => {
    const d = selectedISO ? new Date(selectedISO + "T12:00:00") : new Date();
    return d.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedISO ? new Date(selectedISO + "T12:00:00") : new Date();
    return d.getMonth();
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const canGoPrev = () => {
    const min = new Date(minDateISO);
    return (
      viewYear > min.getFullYear() ||
      (viewYear === min.getFullYear() && viewMonth > min.getMonth())
    );
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <HStack
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {canGoPrev() ? (
          <TouchableOpacity
            onPress={prevMonth}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: Colors.light.background,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="chevron-left" size={18} color={Colors.light.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36, height: 36 }} />
        )}

        <Text
          style={{ fontSize: 16, fontWeight: "700", color: Colors.light.text }}
        >
          {MONTH_LABELS[viewMonth]} {viewYear}
        </Text>

        <TouchableOpacity
          onPress={nextMonth}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: Colors.light.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="chevron-right" size={18} color={Colors.light.text} />
        </TouchableOpacity>
      </HStack>

      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        {DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: Colors.light.iconMuted,
              }}
            >
              {d}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: "row", marginBottom: 2 }}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={{ flex: 1 }} />;

            const iso = toISO(viewYear, viewMonth, day);
            const mark = markedDates[iso];
            const isDisabled = iso < minDateISO || mark?.disabled === true;
            const isSelected = iso === selectedISO;
            const isPartial = mark?.marked && !mark?.disabled;
            const isBlocked = mark?.disabled === true;

            return (
              <TouchableOpacity
                key={colIdx}
                onPress={() => !isDisabled && onSelectDate(iso)}
                disabled={isDisabled}
                style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected
                      ? Colors.light.tint
                      : isBlocked
                        ? Colors.light.cardBorder + "55"
                        : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected
                        ? "#fff"
                        : isDisabled
                          ? Colors.light.iconMuted
                          : Colors.light.text,
                      textDecorationLine:
                        isBlocked && !isSelected ? "line-through" : "none",
                    }}
                  >
                    {day}
                  </Text>
                  {isPartial && !isSelected && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 5,
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#F5A524",
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <HStack style={{ gap: 16, marginTop: 14, justifyContent: "center" }}>
        <HStack style={{ alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#F5A524",
            }}
          />
          <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
            Partial availability
          </Text>
        </HStack>
        <HStack style={{ alignItems: "center", gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: Colors.light.cardBorder,
            }}
          />
          <Text style={{ fontSize: 11, color: Colors.light.iconMuted }}>
            Unavailable
          </Text>
        </HStack>
      </HStack>
    </View>
  );
}

export default function DatetimeStep() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const insets = useSafeAreaInsets();

  const {
    pickupDate,
    pickupTime,
    dropoffDate,
    dropoffTime,
    setPickupDate,
    setPickupTime,
    setDropoffDate,
    setDropoffTime,
  } = useBookingStore();

  const [openFor, setOpenFor] = useState<"pickup" | "dropoff" | null>(null);
  const [modalISO, setModalISO] = useState<string | null>(null);

  const { data: carData, isLoading: isCarLoading } = useQuery({
    queryKey: ["car", carId],
    queryFn: () => getCarById(carId as string),
    enabled: !!carId,
  });
  const car = carData as any;

  const { data: availability = [], isLoading: isAvailabilityLoading } =
    useQuery({
      queryKey: ["car-availability", carId],
      queryFn: () => getCarAvailability(carId as string),
      enabled: !!carId,
    });

  const steps = useBookingSteps(car?.delivery_enabled);
  const markedDates = useMemo(
    () => buildMarkedDates(availability),
    [availability],
  );

  const costs = useMemo(() => {
    if (!car) return null;
    const pickup = parseDateTime(pickupDate, pickupTime);
    const dropoff = parseDateTime(dropoffDate, dropoffTime);
    const hours = Math.max(
      0,
      Math.ceil((dropoff.getTime() - pickup.getTime()) / 3_600_000),
    );
    return { hours, rentalCost: car.hourly_price * hours };
  }, [car, pickupDate, pickupTime, dropoffDate, dropoffTime]);

  const tomorrowISO = new Date(Date.now() + 86_400_000)
    .toISOString()
    .split("T")[0];
  const pickupISO = formatDateToISO(pickupDate);
  const minDropoffISO = pickupISO > tomorrowISO ? pickupISO : tomorrowISO;

  const modalSlots = useMemo(() => {
    if (!modalISO) return [];
    const base = getAvailableTimeSlots(modalISO, availability);
    if (openFor === "dropoff") {
      const pickupDT = parseDateTime(pickupDate, pickupTime);
      return base.filter(
        (s) => parseDateTime(toDisplayDate(modalISO), s) > pickupDT,
      );
    }
    return base;
  }, [modalISO, openFor, availability, pickupDate, pickupTime]);

  const currentModalTime = openFor === "pickup" ? pickupTime : dropoffTime;
  const isPickupModal = openFor === "pickup";
  const minDateISO = isPickupModal ? tomorrowISO : minDropoffISO;

  useEffect(() => {
    if (isCarLoading || isAvailabilityLoading || !car) return;

    const pickupISOCurrent = formatDateToISO(pickupDate);
    const dropoffISOCurrent = formatDateToISO(dropoffDate);
    const pickupValid = getAvailableTimeSlots(pickupISOCurrent, availability).includes(
      pickupTime,
    );
    const dropoffValid = getAvailableTimeSlots(dropoffISOCurrent, availability).includes(
      dropoffTime,
    );

    const pickupDT = parseDateTime(pickupDate, pickupTime);
    const dropoffDT = parseDateTime(dropoffDate, dropoffTime);
    const durationHours = Math.ceil(
      (dropoffDT.getTime() - pickupDT.getTime()) / (1000 * 60 * 60),
    );
    const hasPastPickup = pickupISOCurrent < tomorrowISO;
    const needsInit = !pickupValid || !dropoffValid || hasPastPickup || durationHours <= 0;

    if (!needsInit) return;

    const window = findFirstAvailable24HourWindow(tomorrowISO, availability);
    if (!window) return;

    setPickupDate(toDisplayDate(window.pickup.iso));
    setPickupTime(window.pickup.time);
    setDropoffDate(toDisplayDate(window.dropoff.iso));
    setDropoffTime(window.dropoff.time);
  }, [
    availability,
    car,
    dropoffDate,
    dropoffTime,
    isAvailabilityLoading,
    isCarLoading,
    pickupDate,
    pickupTime,
    setDropoffDate,
    setDropoffTime,
    setPickupDate,
    setPickupTime,
    tomorrowISO,
  ]);

  const openPicker = (for_: "pickup" | "dropoff") => {
    const existingISO =
      for_ === "pickup"
        ? formatDateToISO(pickupDate)
        : formatDateToISO(dropoffDate);
    const minISO = for_ === "pickup" ? tomorrowISO : minDropoffISO;

    if (existingISO && existingISO >= minISO) {
      setModalISO(existingISO);
      setOpenFor(for_);
      return;
    }

    const pickupDT =
      for_ === "dropoff" ? parseDateTime(pickupDate, pickupTime) : undefined;
    const first = findFirstAvailable(minISO, availability, pickupDT);
    if (first) {
      setModalISO(first.iso);
      const formatted = toDisplayDate(first.iso);
      if (for_ === "pickup") {
        setPickupDate(formatted);
        setPickupTime(first.time);
      } else {
        setDropoffDate(formatted);
        setDropoffTime(first.time);
      }
    } else {
      setModalISO(null);
    }
    setOpenFor(for_);
  };

  const closePicker = () => {
    setOpenFor(null);
    setModalISO(null);
  };

  const onSelectDate = (iso: string) => {
    setModalISO(iso);
    const formatted = toDisplayDate(iso);

    const pickupDT =
      openFor === "dropoff" ? parseDateTime(pickupDate, pickupTime) : undefined;
    let slots = getAvailableTimeSlots(iso, availability);
    if (pickupDT)
      slots = slots.filter((s) => parseDateTime(formatted, s) > pickupDT);
    const autoTime = slots.length > 0 ? slots[0] : undefined;

    if (openFor === "pickup") {
      setPickupDate(formatted);
      if (autoTime) setPickupTime(autoTime);
    } else {
      setDropoffDate(formatted);
      if (autoTime) setDropoffTime(autoTime);
    }
  };

  const onSelectTime = (slot: string) => {
    if (openFor === "pickup") setPickupTime(slot);
    else setDropoffTime(slot);
  };

  const handleNext = () => {
    if (!costs || costs.hours < 6) {
      Alert.alert(
        "Minimum Booking Duration",
        "You must book this car for at least 6 hours.",
      );
      return;
    }
    if (car?.delivery_enabled) {
      router.push({ pathname: "/car-book/delivery", params: { carId } });
    } else {
      router.push({ pathname: "/car-book/deposit", params: { carId } });
    }
  };

  if (isCarLoading) {
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

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.light.background }}
        edges={["top"]}
      >
        <BookingHeader steps={steps} currentStepKey="datetime" car={car} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          >
            <VStack style={{ gap: 16 }}>
              <VStack style={{ gap: 4 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: Colors.light.text,
                    letterSpacing: -0.3,
                  }}
                >
                  Choose Your Trip Dates
                </Text>
                <Text style={{ fontSize: 13, color: Colors.light.iconMuted }}>
                  Tap pick-up or drop-off to set date & time
                </Text>
              </VStack>

              {/* Route card */}
              <View
                style={{
                  backgroundColor: Colors.light.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: Colors.light.cardBorder,
                }}
              >
                <TouchableOpacity
                  onPress={() => openPicker("pickup")}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: Colors.light.tint + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={19}
                      color={Colors.light.tint}
                    />
                  </View>

                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: Colors.light.iconMuted,
                        fontWeight: "700",
                        letterSpacing: 0.8,
                      }}
                    >
                      PICK-UP
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: Colors.light.text,
                      }}
                    >
                      {pickupDate}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.light.icon }}>
                      {pickupTime}
                    </Text>
                  </VStack>

                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.light.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={Colors.light.iconMuted}
                    />
                  </View>
                </TouchableOpacity>

                <View
                  style={{
                    height: 1,
                    backgroundColor: Colors.light.cardBorder,
                    marginHorizontal: 18,
                  }}
                />

                <TouchableOpacity
                  onPress={() => openPicker("dropoff")}
                  activeOpacity={0.7}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      backgroundColor: Colors.light.success + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="flag-outline"
                      size={19}
                      color={Colors.light.success}
                    />
                  </View>

                  <VStack style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        fontSize: 10,
                        color: Colors.light.iconMuted,
                        fontWeight: "700",
                        letterSpacing: 0.8,
                      }}
                    >
                      DROP-OFF
                    </Text>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: Colors.light.text,
                      }}
                    >
                      {dropoffDate}
                    </Text>
                    <Text style={{ fontSize: 12, color: Colors.light.icon }}>
                      {dropoffTime}
                    </Text>
                  </VStack>

                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.light.background,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={Colors.light.iconMuted}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {costs && costs.hours > 0 && (
                <View
                  style={{
                    backgroundColor: Colors.light.card,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: Colors.light.cardBorder,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <HStack
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: Colors.light.iconMuted,
                        letterSpacing: 0.6,
                      }}
                    >
                      SELECTED HOURS
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: Colors.light.text,
                      }}
                    >
                      {costs.hours} {costs.hours === 1 ? "hour" : "hours"}
                    </Text>
                  </HStack>
                </View>
              )}

              {/* Minimum warning */}
              {costs && costs.hours > 0 && costs.hours < 6 && (
                <HStack
                  style={{
                    gap: 10,
                    alignItems: "center",
                    backgroundColor: Colors.light.warning + "12",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: Colors.light.warning + "30",
                  }}
                >
                  <Ionicons
                    name="warning-outline"
                    size={16}
                    color={Colors.light.warning}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.light.warning,
                      fontWeight: "600",
                      flex: 1,
                    }}
                  >
                    Minimum booking duration is 6 hours
                  </Text>
                </HStack>
              )}
            </VStack>
          </ScrollView>

          {/* Continue button */}
          <View
            style={{
              backgroundColor: Colors.light.card,
              borderTopWidth: 1,
              borderTopColor: Colors.light.cardBorder,
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.05,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <Button size="lg" style={{ borderRadius: 16 }} onPress={handleNext}>
              <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
                Continue
              </ButtonText>
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Picker Modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={!!openFor}
        transparent
        animationType="slide"
        onRequestClose={closePicker}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <Pressable
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            onPress={closePicker}
          />

          {/* Sheet */}
          <View
            style={{
              backgroundColor: Colors.light.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              maxHeight: "93%",
              overflow: "hidden",
            }}
          >
            {/* Handle */}
            <View
              style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: Colors.light.cardBorder,
                }}
              />
            </View>

            {/* Header */}
            <HStack
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: Colors.light.cardBorder,
              }}
            >
              <VStack style={{ gap: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: isPickupModal
                      ? Colors.light.tint
                      : Colors.light.success,
                    fontWeight: "700",
                    letterSpacing: 0.8,
                  }}
                >
                  {isPickupModal ? "PICK-UP" : "DROP-OFF"}
                </Text>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: Colors.light.text,
                  }}
                >
                  {isPickupModal
                    ? "Select pick-up date & time"
                    : "Select drop-off date & time"}
                </Text>
              </VStack>
              <TouchableOpacity
                onPress={closePicker}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: Colors.light.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="x" size={17} color={Colors.light.text} />
              </TouchableOpacity>
            </HStack>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
              keyboardShouldPersistTaps="handled"
            >
              {isAvailabilityLoading ? (
                <View
                  style={{
                    height: 280,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Loader />
                </View>
              ) : (
                <>
                  <InlineCalendar
                    markedDates={markedDates}
                    minDateISO={minDateISO}
                    selectedISO={modalISO}
                    onSelectDate={onSelectDate}
                  />

                  <View
                    style={{
                      height: 1,
                      backgroundColor: Colors.light.cardBorder,
                      marginVertical: 20,
                    }}
                  />

                  {/* Time section header */}
                  <HStack
                    style={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: Colors.light.text,
                      }}
                    >
                      Select time
                    </Text>
                    {modalISO && (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          backgroundColor: Colors.light.background,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: Colors.light.cardBorder,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color: Colors.light.icon,
                          }}
                        >
                          {toDisplayDate(modalISO)}
                        </Text>
                      </View>
                    )}
                  </HStack>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.light.iconMuted,
                      marginBottom: 14,
                    }}
                  >
                    {modalISO
                      ? "Tap a slot to select your time"
                      : "Choose a date above first"}
                  </Text>

                  {!modalISO ? (
                    <View
                      style={{
                        paddingVertical: 24,
                        alignItems: "center",
                        backgroundColor: Colors.light.background,
                        borderRadius: 14,
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={28}
                        color={Colors.light.iconMuted}
                      />
                      <Text
                        style={{
                          marginTop: 8,
                          color: Colors.light.iconMuted,
                          fontSize: 13,
                        }}
                      >
                        Pick a date first
                      </Text>
                    </View>
                  ) : modalSlots.length === 0 ? (
                    <View
                      style={{
                        paddingVertical: 24,
                        alignItems: "center",
                        backgroundColor: Colors.light.background,
                        borderRadius: 14,
                      }}
                    >
                      <Ionicons
                        name="ban-outline"
                        size={28}
                        color={Colors.light.error}
                      />
                      <Text
                        style={{
                          marginTop: 8,
                          color: Colors.light.iconMuted,
                          fontSize: 13,
                        }}
                      >
                        No available slots on this day
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        {TIME_SLOTS.map((slot) => {
                          const blocked = !modalSlots.includes(slot);
                          const isSelected = currentModalTime === slot;
                          return (
                            <TouchableOpacity
                              key={slot}
                              onPress={() => !blocked && onSelectTime(slot)}
                              disabled={blocked}
                              style={{
                                width: "31%",
                                paddingVertical: 12,
                                borderRadius: 12,
                                alignItems: "center",
                                backgroundColor: isSelected
                                  ? Colors.light.tint
                                  : blocked
                                    ? Colors.light.cardBorder + "35"
                                    : Colors.light.background,
                                borderWidth: 1.5,
                                borderColor: isSelected
                                  ? Colors.light.tint
                                  : blocked
                                    ? Colors.light.cardBorder
                                    : Colors.light.cardBorder,
                                opacity: blocked ? 0.4 : 1,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: isSelected
                                    ? "#fff"
                                    : blocked
                                      ? Colors.light.iconMuted
                                      : Colors.light.text,
                                }}
                              >
                                {slot}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <HStack style={{ gap: 16, marginTop: 14 }}>
                        <HStack style={{ alignItems: "center", gap: 6 }}>
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              backgroundColor: Colors.light.tint,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              color: Colors.light.iconMuted,
                            }}
                          >
                            Selected
                          </Text>
                        </HStack>
                        <HStack style={{ alignItems: "center", gap: 6 }}>
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 3,
                              backgroundColor: Colors.light.cardBorder,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              color: Colors.light.iconMuted,
                            }}
                          >
                            Blocked
                          </Text>
                        </HStack>
                      </HStack>
                    </>
                  )}
                </>
              )}
            </ScrollView>

            {/* Done button */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: (insets.bottom > 0 ? insets.bottom : 12) + 8,
                borderTopWidth: 1,
                borderTopColor: Colors.light.cardBorder,
                backgroundColor: Colors.light.card,
              }}
            >
              <Button
                size="lg"
                style={{ borderRadius: 16 }}
                onPress={closePicker}
                isDisabled={!modalISO || !modalSlots.includes(currentModalTime)}
              >
                <ButtonText style={{ fontWeight: "700", fontSize: 16 }}>
                  Confirm {isPickupModal ? "Pick-up" : "Drop-off"}
                </ButtonText>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
