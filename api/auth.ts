import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

// The redirect URI must exactly match an allowed Supabase redirect URL.
const REDIRECT_URI = "velorentnative://auth-callback";

// Supabase can return OAuth params in either the hash fragment or query string.
export function extractOAuthParamsFromUrl(url: string): {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
} {
  const params: Record<string, string> = {};

  const hashIndex = url.indexOf("#");
  const fragment = hashIndex !== -1 ? url.slice(hashIndex + 1) : "";
  if (fragment) {
    fragment.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[key] = decodeURIComponent(value.replace(/\+/g, " "));
      }
    });
  }

  const queryIndex = url.indexOf("?");
  const hashOrEnd = hashIndex !== -1 ? hashIndex : url.length;
  const queryString =
    queryIndex !== -1 ? url.slice(queryIndex + 1, hashOrEnd) : "";
  if (queryString) {
    queryString.split("&").forEach((pair) => {
      const [key, value] = pair.split("=");
      if (key && value) {
        params[key] = decodeURIComponent(value.replace(/\+/g, " "));
      }
    });
  }

  return {
    access_token: params["access_token"],
    refresh_token: params["refresh_token"],
    error: params["error"],
    error_description: params["error_description"],
  };
}

export const completeOAuthSignIn = async (url: string) => {
  const { access_token, refresh_token, error, error_description } =
    extractOAuthParamsFromUrl(url);

  if (error) {
    throw new Error(error_description || error);
  }

  if (!access_token || !refresh_token) {
    console.error("OAuth redirect URL (no tokens found):", url);
    throw new Error(
      "Sign-in failed: tokens were not returned. " +
        "Ensure 'velorentnative://auth-callback' is added to " +
        "Supabase Dashboard -> Authentication -> URL Configuration -> Redirect URLs.",
    );
  }

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

  if (sessionError) throw sessionError;

  if (sessionData?.user) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", sessionData.user.id)
        .maybeSingle();

      if (!profile) {
        const meta = sessionData.user.user_metadata || {};
        const { error: insertError } = await supabase.from("profiles").insert({
          id: sessionData.user.id,
          full_name: meta.full_name || meta.name || "",
          email: sessionData.user.email || "",
          avatar_url:
            meta.avatar_url ||
            meta.picture ||
            "https://covwleocjigusbqbkxdj.supabase.co/storage/v1/object/public/default/user.png",
          role_id: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (insertError) {
          console.error("Failed to create profile for OAuth user:", insertError);
        }
      }
    } catch (profileErr) {
      console.error("Profile check/create failed:", profileErr);
    }
  }

  return sessionData;
};

export const signInWithOAuth = async (provider: "google" | "facebook") => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: REDIRECT_URI,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("No login URL returned from Supabase");

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);

  if (result.type !== "success" || !result.url) {
    return null;
  }

  return completeOAuthSignIn(result.url);
};

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
        role_id: 3,
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
