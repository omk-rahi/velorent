import { supabase } from "@/lib/supabase";

export type CarBrand = {
  id: string;
  name: string;
  logo_url: string;
};

export type CarModel = {
  id: string;
  name: string;
};

export type Car = {
  id: string;
  registration_number: string;
  manufacturing_year: number;
  fuel_type: string;
  vehicle_seat_capacity: number;
  hourly_price: number;
  body_type: string;
  is_active: boolean;
  is_verified: boolean;
  car_brands: CarBrand;
  car_models: CarModel;
  image_url?: string;
  average_rating?: number;
  review_count?: number;
  distance_km?: number;
};

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getCars(filters?: {
  brand?: string;
  brandId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  latitude?: number;
  longitude?: number;
  limit?: number;
  offset?: number;
  sortByDistance?: boolean;
}) {
  let query = supabase
    .from("cars")
    .select(
      `
      *,
      car_brands (*),
      car_models (*),
      car_images (image_url, is_primary),
      car_pickup_addresses!car_id (
        address_line1,
        city,
        state,
        pincode,
        latitude,
        longitude
      ),
      car_reviews (rating)
    `,
    )
    .eq("is_verified", true);

  if (filters?.brandId) {
    query = query.eq("brand_id", filters.brandId);
  } else if (filters?.brand) {
    query = query.ilike("car_brands.name", filters.brand);
  }

  if (filters?.minPrice !== undefined) {
    query = query.gte("hourly_price", filters.minPrice);
  }

  if (filters?.maxPrice !== undefined) {
    query = query.lte("hourly_price", filters.maxPrice);
  }

  if (filters?.seats !== undefined) {
    query = query.eq("vehicle_seat_capacity", filters.seats);
  }

  query = query.order("created_at", { ascending: false });

  if (filters?.limit !== undefined && !filters?.sortByDistance) {
    const from = filters.offset ?? 0;
    query = query.range(from, from + filters.limit - 1);
  }

  const { data, error } = await query;

  if (error) throw error;

  const finalData = (data ?? []).map((car: any) => {
    const primaryImage =
      car.car_images?.find((img: any) => img.is_primary) || car.car_images?.[0];
    const pickupAddress = Array.isArray(car.car_pickup_addresses)
      ? car.car_pickup_addresses[0]
      : car.car_pickup_addresses;
    const pickupLat =
      typeof pickupAddress?.latitude === "number"
        ? pickupAddress.latitude
        : Number(pickupAddress?.latitude);
    const pickupLon =
      typeof pickupAddress?.longitude === "number"
        ? pickupAddress.longitude
        : Number(pickupAddress?.longitude);
    const hasUserLocation =
      filters?.latitude !== undefined && filters?.longitude !== undefined;
    const hasPickupLocation =
      Number.isFinite(pickupLat) && Number.isFinite(pickupLon);

    const ratings = car.car_reviews || [];
    const totalRating = ratings.reduce(
      (acc: number, curr: any) => acc + curr.rating,
      0,
    );
    const averageRating =
      ratings.length > 0 ? totalRating / ratings.length : 5.0;

    return {
      ...car,
      image_url: primaryImage?.image_url || car.image_url,
      average_rating: averageRating,
      review_count: ratings.length,
      distance_km:
        hasUserLocation && hasPickupLocation
          ? haversineKm(
              filters.latitude!,
              filters.longitude!,
              pickupLat,
              pickupLon,
            )
          : undefined,
    };
  });

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    const searchedData = finalData.filter((car: any) =>
      matchesCarSearch(car, searchLower),
    );

    const sortedData = filters?.sortByDistance
      ? sortCarsByDistance(searchedData)
      : searchedData;

    return paginateCars(sortedData, filters);
  }

  const sortedData = filters?.sortByDistance
    ? sortCarsByDistance(finalData)
    : finalData;

  return paginateCars(sortedData, filters);
}

function sortCarsByDistance(cars: any[]) {
  return [...cars].sort((a, b) => {
    const aDistance = Number.isFinite(a.distance_km)
      ? a.distance_km
      : Number.POSITIVE_INFINITY;
    const bDistance = Number.isFinite(b.distance_km)
      ? b.distance_km
      : Number.POSITIVE_INFINITY;

    return aDistance - bDistance;
  });
}

function matchesCarSearch(car: any, searchLower: string) {
  const pickupAddresses = Array.isArray(car.car_pickup_addresses)
    ? car.car_pickup_addresses
    : [car.car_pickup_addresses].filter(Boolean);
  const searchableValues = [
    car.car_models?.name,
    car.car_brands?.name,
    ...pickupAddresses.flatMap((pickupAddress: any) => [
      pickupAddress?.address_line1,
      pickupAddress?.city,
      pickupAddress?.state,
      pickupAddress?.pincode,
    ]),
  ];

  return searchableValues.some((value) =>
    String(value ?? "").toLowerCase().includes(searchLower),
  );
}

function paginateCars(
  cars: any[],
  filters?: {
    limit?: number;
    offset?: number;
  },
) {
  if (filters?.limit === undefined) return cars;

  const from = filters.offset ?? 0;
  return cars.slice(from, from + filters.limit);
}
export async function getCarById(car_id: string) {
  const { data, error } = await supabase
    .from("cars")
    .select(
      `
      id,
      host_id,
      brand_id,
      model_id,
      registration_number,
      manufacturing_year,
      fuel_type,
      vehicle_seat_capacity,
      owner,
      body_type,
      deposit_amount,
      commission_percentage,
      delivery_rate,
      hourly_price,
      is_active,
      rc_valid_till,
      insurance_valid_till,
      delivery_enabled,

      brand:car_brands!brand_id (
        id,
        name
      ),

      model:car_models!model_id (
        id,
        name
      ),

      address:car_pickup_addresses!car_id (
        id,
        address_line1,
        city,
        state,
        pincode,
        latitude,
        longitude
      ),

      features:car_feature_mappings!car_id (
        feature:car_features!feature_id (
          id,
          name
        )
      ),

      host:profiles!host_id (
        *
      ),

      images:car_images!car_id (
        image_url,
        is_primary
      ),

      car_reviews (
        id,
        rating,
        review_text,
        created_at,
        profiles!profile_id (
          full_name,
          avatar_url
        )
      )
    `,
    )
    .eq("id", car_id)
    .single();

  if (error) throw error;

  // Process reviews to match expected format if needed
  const ratings = data.car_reviews || [];
  const totalRating = ratings.reduce(
    (acc: number, curr: any) => acc + curr.rating,
    0,
  );
  const averageRating = ratings.length > 0 ? totalRating / ratings.length : 5.0;

  return {
    ...data,
    average_rating: averageRating,
    review_count: ratings.length,
    reviews: ratings, // For easier access
  };
}
export async function getCarReviews(car_id: string) {
  const { data, error } = await supabase
    .from("car_reviews")
    .select(
      `
      id,
      rating,
      review_text,
      created_at,
      profiles!profile_id (
        full_name,
        avatar_url
      )
    `,
    )
    .eq("car_id", car_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function submitCarReview({
  carId,
  rating,
  reviewText,
}: {
  carId: string;
  rating: number;
  reviewText?: string;
}) {
  if (!carId) throw new Error("Missing car id");
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    throw new Error("You must be signed in to leave a review");
  }

  const payload = {
    car_id: carId,
    profile_id: user.id,
    rating: Math.round(rating),
    review_text: (reviewText ?? "").trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("car_reviews")
    .upsert(payload, { onConflict: "car_id, profile_id" })
    .select(
      "id, car_id, profile_id, rating, review_text, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data;
}

export async function getMyCarReview(carId: string) {
  if (!carId) throw new Error("Missing car id");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    throw new Error("You must be signed in");
  }

  const { data, error } = await supabase
    .from("car_reviews")
    .select("id, car_id, profile_id, rating, review_text, created_at, updated_at")
    .eq("car_id", carId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type CarAvailability = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  reason?: string;
};

export async function getCarAvailability(
  carId: string,
): Promise<CarAvailability[]> {
  const nowIso = new Date().toISOString();

  const [
    { data: availabilityData, error: availabilityError },
    { data: bookingData, error: bookingError },
  ] = await Promise.all([
    supabase
      .from("car_availability")
      .select("id, start_time, end_time, status, reason")
      .eq("car_id", carId)
      .gte("end_time", nowIso),
    supabase
      .from("bookings")
      .select("id, start_time, end_time, status")
      .eq("car_id", carId)
      .in("status", ["pending", "confirmed", "ongoing"])
      .gte("end_time", nowIso),
  ]);

  if (availabilityError) throw availabilityError;
  if (bookingError) {
    console.warn("[getCarAvailability] bookings read failed, using car_availability only", {
      carId,
      message: bookingError.message,
      code: (bookingError as any).code,
    });
  }

  const bookingBlocks: CarAvailability[] = ((bookingError ? [] : bookingData) ?? []).map(
    (booking: any) => ({
      id: `booking-${booking.id}`,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: "booked",
      reason: `booking_${booking.status}`,
    }),
  );

  return [...(availabilityData ?? []), ...bookingBlocks].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );
}
