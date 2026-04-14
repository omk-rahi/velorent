import { supabase } from "@/lib/supabase";

export async function getCarBrands() {
  const { data, error } = await supabase
    .from("car_brands")
    .select(`
      *,
      cars(count)
    `)
    .eq("cars.is_active", true)
    .order("name");

  if (error) throw error;

  return data.map((brand: any) => ({
    ...brand,
    carCount: brand.cars?.[0]?.count || 0,
  }));
}
