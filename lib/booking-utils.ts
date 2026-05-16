import type { CarAvailability } from "@/api/cars";

export const TIME_SLOTS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`,
);

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseTimeString(timeStr: string) {
  const trimmed = String(timeStr ?? "").trim();
  const twelveHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const period = twelveHourMatch[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return { hours, minutes };
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHourMatch) {
    return {
      hours: Number(twentyFourHourMatch[1]),
      minutes: Number(twentyFourHourMatch[2]),
    };
  }

  throw new Error(`Unsupported time format: ${timeStr}`);
}

export function normalizeTimeString(timeStr: string): string {
  try {
    const { hours, minutes } = parseTimeString(timeStr);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch {
    return timeStr;
  }
}

export function formatBookingTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatBookingDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${formatBookingTime(date)}`;
}

/** Parse a "14 Mar, 2026" date + "10:00" or "10:00 AM" time into a Date object */
export function parseDateTime(dateStr: string, timeStr: string): Date {
  try {
    const parts = dateStr.split(" ");
    const day = parseInt(parts[0]);
    const monthStr = parts[1].replace(",", "");
    const year = parseInt(parts[2]);
    const month = MONTHS[monthStr];
    const { hours, minutes } = parseTimeString(timeStr);
    return new Date(year, month, day, hours, minutes, 0, 0);
  } catch {
    return new Date();
  }
}

/** Parse a "2026-03-14" ISO date string + "10:00" or "10:00 AM" time into a Date */
function parseISODateAndTime(isoDate: string, timeStr: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const { hours, minutes } = parseTimeString(timeStr);
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

  const now = new Date();

  return TIME_SLOTS.filter((time) => {
    if (isTimeSlotBlocked(isoDate, time, availability)) return false;

    const slotStart = parseISODateAndTime(isoDate, time);
    if (slotStart <= now) return false;

    return true;
  });
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


  for (let i = 0; i <= 90; i++) {
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
