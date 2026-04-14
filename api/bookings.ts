import { supabase } from "@/lib/supabase";
import * as Crypto from "expo-crypto";

const BOOKING_PROOFS_BUCKET = "booking-proofs";
const CANCELLATION_CUTOFF_HOURS = 12;

type BookingStatusDb =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "ongoing"
  | "completed";

type BookingStatusUi =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "rejected"
  | "ongoing"
  | "completed";

export type Booking = {
  id: string;
  car_id: string;
  customer_id: string;
  host_id: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  base_amount: number;
  delivery_amount: number;
  commission_percentage: number;
  commission_amount: number;
  deposit_amount: number;
  deposit_status: "pending" | "paid" | "refunded" | "forfeited";
  total_amount: number;
  pickup_type: "self_pickup" | "home_delivery";
  delivery_address?: string;
  otp?: string;
  status: BookingStatusUi;
  created_at: string;
  updated_at: string;
};

export type CreateBookingParams = Omit<
  Booking,
  "id" | "created_at" | "updated_at"
>;

function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBooking(row: any) {
  return {
    ...row,
    base_amount: toNumber(row.base_amount),
    delivery_amount: toNumber(row.delivery_amount),
    commission_percentage: toNumber(row.commission_percentage),
    commission_amount: toNumber(row.commission_amount),
    deposit_amount: toNumber(row.deposit_amount),
    total_amount: toNumber(row.total_amount),
  };
}

async function createAvailabilityBlockForBooking(booking: {
  id: string;
  car_id: string;
  start_time: string;
  end_time: string;
}) {
  const { error } = await supabase.from("car_availability").insert({
    car_id: booking.car_id,
    start_time: booking.start_time,
    end_time: booking.end_time,
    status: "blocked",
    reason: `booking:${booking.id}`,
  });

  if (error) {
    console.warn("[availability] create block failed", {
      bookingId: booking.id,
      carId: booking.car_id,
      message: error.message,
      code: (error as any).code,
    });
  }
}

async function removeAvailabilityBlockForBooking(bookingId: string) {
  const { error } = await supabase
    .from("car_availability")
    .delete()
    .eq("reason", `booking:${bookingId}`);

  if (error) {
    console.warn("[availability] remove block failed", {
      bookingId,
      message: error.message,
      code: (error as any).code,
    });
  }
}

async function uploadBookingProof({
  bookingId,
  fileUri,
  prefix,
}: {
  bookingId: string;
  fileUri: string;
  prefix: string;
}) {
  const ext = fileUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `bookings/${bookingId}/${prefix}-${Crypto.randomUUID()}.${ext}`;

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: path.split("/").pop(),
    type: `image/${ext === "jpg" ? "jpeg" : ext}`,
  } as any);

  const { error: uploadError } = await supabase.storage
    .from(BOOKING_PROOFS_BUCKET)
    .upload(path, formData, { upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload booking proof");
  }

  const { data } = supabase.storage
    .from(BOOKING_PROOFS_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function createBooking(booking: CreateBookingParams) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  await createAvailabilityBlockForBooking(data as any);
  return data;
}

export async function getBookings(customerId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      car_id,
      customer_id,
      host_id,
      start_time,
      end_time,
      total_hours,
      base_amount,
      delivery_amount,
      commission_percentage,
      commission_amount,
      deposit_amount,
      deposit_status,
      total_amount,
      pickup_type,
      delivery_address,
      status,
      created_at,
      updated_at,
      car:cars(
        id,
        registration_number,
        car_brands(name),
        car_models(name),
        car_images(image_url, is_primary),
        host:profiles!host_id(full_name, phone)
      )
    `,
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data as any[]) ?? []).map((booking: any) => {
    const car = booking.car;
    const primaryImage =
      car?.car_images?.find((img: any) => img.is_primary)?.image_url ||
      car?.car_images?.[0]?.image_url ||
      null;

    return normalizeBooking({
      ...booking,
      car: {
        ...car,
        name: `${car?.car_brands?.name ?? ""} ${car?.car_models?.name ?? ""}`.trim(),
        image_url: primaryImage,
        host_name: car?.host?.full_name ?? "Unknown Host",
        host_phone: car?.host?.phone ?? "N/A",
      },
    });
  });
}

export async function getBookingById(bookingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      car_id,
      customer_id,
      host_id,
      start_time,
      end_time,
      total_hours,
      base_amount,
      delivery_amount,
      commission_percentage,
      commission_amount,
      deposit_amount,
      deposit_status,
      total_amount,
      pickup_type,
      delivery_address,
      handover_otp,
      status,
      created_at,
      updated_at,
      car:cars(
        id,
        registration_number,
        hourly_price,
        car_brands(name),
        car_models(name),
        car_images(image_url, is_primary),
        host:profiles!host_id(full_name, phone),
        car_pickup_addresses(address_line1, city, state)
      )
    `,
    )
    .eq("id", bookingId)
    .single();

  if (error) {
    console.error("[getBookingById] query failed", {
      bookingId,
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    throw error;
  }
  return normalizeBooking(data);
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"],
) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw error;

  if (["cancelled", "rejected", "completed"].includes(status)) {
    await removeAvailabilityBlockForBooking(bookingId);
  } else if (["pending", "confirmed", "ongoing"].includes(status)) {
    await createAvailabilityBlockForBooking(data as any);
  }

  return data;
}

export async function cancelBooking(bookingId: string) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    throw new Error("You must be signed in to cancel a booking");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id, status, start_time")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message || "Booking not found");
  }

  if (booking.customer_id !== user.id) {
    throw new Error("You can only cancel your own bookings");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new Error("This booking cannot be cancelled at this stage");
  }

  const startTimeMs = new Date(booking.start_time).getTime();
  const cutoffMs = CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
  const msUntilStart = startTimeMs - Date.now();
  if (msUntilStart < cutoffMs) {
    throw new Error(
      `You can only cancel at least ${CANCELLATION_CUTOFF_HOURS} hours before pickup`,
    );
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (error) throw error;
  await removeAvailabilityBlockForBooking(bookingId);
}

export async function submitCustomerDispute({
  bookingId,
  disputeType,
  description,
  photoUri,
}: {
  bookingId: string;
  disputeType: string;
  description: string;
  photoUri?: string | null;
}) {
  const cleanDescription = description.trim();
  if (cleanDescription.length < 10) {
    throw new Error("Description must be at least 10 characters");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    throw new Error("You must be signed in to raise a dispute");
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, customer_id")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(bookingError?.message || "Booking not found");
  }

  if (booking.customer_id !== user.id) {
    throw new Error("You can only raise disputes for your own bookings");
  }

  let imageUrl: string | null = null;

  if (photoUri) {
    const ext = photoUri.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `disputes/${bookingId}/${Crypto.randomUUID()}.${ext}`;
    const formData = new FormData();
    formData.append("file", {
      uri: photoUri,
      name: path,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    } as any);

    const { error: uploadError } = await supabase.storage
      .from("dispute-photos")
      .upload(path, formData, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message || "Failed to upload dispute image");
    }

    const { data } = supabase.storage.from("dispute-photos").getPublicUrl(path);
    imageUrl = data.publicUrl;
  }

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .insert({
      booking_id: bookingId,
      raised_by: user.id,
      dispute_type: disputeType,
      description: cleanDescription,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (disputeError) {
    throw new Error(disputeError.message || "Failed to create dispute");
  }

  const { notifyToAdmin } = await import("./notify");
  try {
    await notifyToAdmin({
      type: "dispute",
      title: `Customer Dispute - ${disputeType}`,
      message: `Booking #${bookingId.slice(-8).toUpperCase()} | Dispute #${dispute.id.slice(-8).toUpperCase()} | ${disputeType}: ${cleanDescription}${
        imageUrl ? ` | Photo: ${imageUrl}` : ""
      }`,
    });
  } catch (notifyError) {
    console.warn("[dispute] admin notify failed:", notifyError);
  }

  return dispute;
}
