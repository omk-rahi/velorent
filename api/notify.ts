import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();

type NotifyParams = {
  type: string;
  title: string;
  message: string;
};

export async function notifyToAdmin({ type, title, message }: NotifyParams) {
  const { data: admin, error: adminError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role_id", 1)
    .single();

  if (adminError || !admin) {
    console.error("Admin not found", adminError);
    throw new Error("Admin not found");
  }

  const payload = {
    type,
    title,
    message,
    userId: admin.id,
  };

  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }

  const res = await fetch(`${API_BASE_URL}/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text();
    let errMessage = "Failed to notify admin";

    try {
      const err = raw ? JSON.parse(raw) : {};
      errMessage = err.message ?? errMessage;
    } catch {
      if (raw) errMessage = raw;
    }

    throw new Error(`Notify failed: ${errMessage}`);
  }

  return payload;
}
