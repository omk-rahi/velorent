import { supabase } from "@/lib/supabase";

export type Coupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "flat";
  discount_value: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  min_booking_amount: number | null;
  per_customer_limit: number | null;
};

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  const now = new Date();
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);

  if (now < startDate || now > endDate) {
    return null;
  }

  return data as Coupon;
}

export async function recordCouponUsage(couponId: string, customerId: string) {
  const { error } = await supabase.from("coupon_usages").insert({
    coupon_id: couponId,
    customer_id: customerId,
    used_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("[coupons] failed to record usage:", error.message);
  }
}

export async function getCouponUsageCount(couponId: string, customerId: string) {
  const { count, error } = await supabase
    .from("coupon_usages")
    .select("*", { count: "exact", head: true })
    .eq("coupon_id", couponId)
    .eq("customer_id", customerId);

  if (error) return 0;
  return count || 0;
}
