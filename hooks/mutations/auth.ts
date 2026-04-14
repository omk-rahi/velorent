import { sendPhoneOtp, verifyPhoneOtp } from "@/api/auth";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useVerifyOTP() {
  return useMutation({
    mutationKey: ["verify_otp"],
    mutationFn: (payload: { phone: string; token: string }) =>
      verifyPhoneOtp(payload),
  });
}

export function useSendOTP() {
  return useMutation({
    mutationKey: ["send_otp"],
    mutationFn: (phone: string) => sendPhoneOtp(phone),
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data ?? null;
    },
  });
}
