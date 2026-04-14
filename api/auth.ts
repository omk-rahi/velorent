import { supabase } from "@/lib/supabase";

export const sendPhoneOtp = async (phone: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) throw error;

  return data;
};

export const register = async ({
  phone,
  fullName,
  email,
}: {
  phone: string;
  fullName: string;
  email?: string;
}) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      data: {
        full_name: fullName,
        email: email,
        role_id: 2,
        avatar_url:
          "https://covwleocjigusbqbkxdj.supabase.co/storage/v1/object/public/default/user.png",
      },
    },
  });

  console.log(error);

  if (error) throw error;

  return data;
};

export const verifyPhoneOtp = async ({
  phone,
  token,
}: {
  phone: string;
  token: string;
}) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) throw error;

  return data;
};

export const checkPhoneExists = async (phone: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;

  return !!data;
};

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", userId)
    .single();

  if (error) throw error;

  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
};
