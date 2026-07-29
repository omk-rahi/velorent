import { supabase } from "@/lib/supabase";

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();

function getApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }
  return API_BASE_URL;
}

async function parseJsonResponse(res: Response, fallbackMessage: string) {
  const raw = await res.text();
  let data: any;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      "Invalid API response. Check EXPO_PUBLIC_API_URL or add ngrok header bypass."
    );
  }

  if (!res.ok || !data.success) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

export const verifyBankAccount = async ({
  accountNumber,
  ifsc,
  userId,
}: {
  accountNumber: string;
  ifsc: string;
  userId: string;
}) => {
  const res = await fetch(`${getApiBaseUrl()}/verify/bank-account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "x-user-id": userId,
    },
    body: JSON.stringify({
      accountNumber,
      ifsc,
    }),
  });

  const data = await parseJsonResponse(res, "Bank account verification failed");

  return data;
};

/**
 * Upload a single document photo to the `verification_docs` bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadVerificationPhoto(
  userId: string,
  documentType: "aadhaar" | "dl",
  side: "front" | "back",
  uri: string
): Promise<string> {
  const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
  const path = `${userId}/${documentType}_${side}_${Date.now()}.${ext}`;

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: path,
    type: `image/${ext === "jpg" ? "jpeg" : ext}`,
  } as any);

  const { error } = await supabase.storage
    .from("verification_docs")
    .upload(path, formData, { upsert: true });

  if (error) throw new Error(`Failed to upload ${side} image: ${error.message}`);

  const { data } = supabase.storage
    .from("verification_docs")
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Submit a manual verification request (front + back photos already uploaded).
 * Creates a `manual_verifications` row with status = 'pending'.
 */
export async function submitManualVerification(
  profileId: string,
  documentType: "aadhaar" | "dl",
  frontImageUrl: string,
  backImageUrl: string
): Promise<void> {
  const { error } = await supabase.from("manual_verifications").insert({
    profile_id: profileId,
    document_type: documentType,
    front_image_url: frontImageUrl,
    back_image_url: backImageUrl,
    status: "pending",
  });

  if (error) throw new Error(`Failed to submit verification: ${error.message}`);
}

/**
 * Check if the customer already has a pending manual verification for a document type.
 * Returns the status ('pending' | 'approved' | 'rejected') or null if none exists.
 */
export async function getManualVerificationStatus(
  profileId: string,
  documentType: "aadhaar" | "dl"
): Promise<"pending" | "approved" | "rejected" | null> {
  const { data, error } = await supabase
    .from("manual_verifications")
    .select("status")
    .eq("profile_id", profileId)
    .eq("document_type", documentType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.status as "pending" | "approved" | "rejected";
}
