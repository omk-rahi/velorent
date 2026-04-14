import type { CarAvailability } from "@/api/cars";

export const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
];

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** Parse a "14 Mar, 2026" date + "10:00 AM" time into a Date object */
export function parseDateTime(dateStr: string, timeStr: string): Date {
  try {
    const parts = dateStr.split(" ");
    const day = parseInt(parts[0]);
    const monthStr = parts[1].replace(",", "");
    const year = parseInt(parts[2]);
    const month = MONTHS[monthStr];
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return new Date(year, month, day, hours, minutes, 0, 0);
  } catch {
    return new Date();
  }
}

/** Parse a "2026-03-14" ISO date string + "10:00 AM" time into a Date */
function parseISODateAndTime(isoDate: string, timeStr: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [time, period] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/** Check if a given time slot start is within any blocked availability period */
export function isTimeSlotBlocked(
  isoDate: string,
  timeStr: string,
  availability: CarAvailability[],
): boolean {
  const slotStart = parseISODateAndTime(isoDate, timeStr);
  return availability.some((block) => {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return slotStart >= blockStart && slotStart < blockEnd;
  });
}

/** Check if any part of a day is blocked by an availability period */
function isDateBlocked(isoDate: string, availability: CarAvailability[]): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const dayEnd = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return availability.some((block) => {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    return blockStart < dayEnd && blockEnd > dayStart;
  });
}

/** Returns all available time slots for a given ISO date, filtered by car_availability */
export function getAvailableTimeSlots(
  isoDate: string,
  availability: CarAvailability[],
): string[] {
  // Product rule: if any booking/availability overlaps a date, the whole date is unavailable.
  if (isDateBlocked(isoDate, availability)) return [];

  return TIME_SLOTS.filter(
    (time) => !isTimeSlotBlocked(isoDate, time, availability),
  );
}

/**
 * Build react-native-calendars markedDates for the next 90 days.
 * - Fully blocked days (all slots taken): disabled
 * - Partially blocked days: marked with a dot
 */
export function buildMarkedDates(
  availability: CarAvailability[],
): Record<string, any> {
  const marks: Record<string, any> = {};
  if (!availability.length) return marks;

  for (let i = 1; i <= 90; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const isoDate = date.toISOString().split("T")[0];

    const available = getAvailableTimeSlots(isoDate, availability);

    if (available.length === 0) {
      marks[isoDate] = { disabled: true, disableTouchEvent: true };
    } else if (available.length < TIME_SLOTS.length) {
      marks[isoDate] = { marked: true, dotColor: "#F5A524" };
    }
  }

  return marks;
}

/** Format a "14 Mar, 2026" date string to ISO "2026-03-14" for Calendar minDate */
export function formatDateToISO(dateStr: string): string {
  try {
    const parts = dateStr.split(" ");
    const day = parseInt(parts[0]).toString().padStart(2, "0");
    const monthStr = parts[1].replace(",", "");
    const year = parts[2];
    const month = (MONTHS[monthStr] + 1).toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}
