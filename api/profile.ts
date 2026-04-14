import { supabase } from "@/lib/supabase";

type UpsertProfileParams = {
  id: string;
  name: string;
  email: string;
};

export const upsertProfile = async ({
  id,
  name,
  email,
}: UpsertProfileParams) => {
  const { error, data } = await supabase
    .from("profiles")
    .upsert(
      {
        id,
        full_name: name,
        email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error("Failed to update profile");
  }

  return data;
};

type UpdateAvatarParams = {
  userId: string;
  avatarUri: string;
};

type CustomerVerificationIdentity = {
  aadhaar_number?: string | null;
  aadhaar_name?: string | null;
  aadhaar_address?: string | null;
  dl_number?: string | null;
  dl_name?: string | null;
  dl_address?: string | null;
};

export async function upsertCustomerVerificationIdentity(
  userId: string,
  identity: CustomerVerificationIdentity
) {
  const { error } = await supabase
    .from("customers")
    .upsert(
      {
        id: userId,
        ...identity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) throw new Error("Failed to save customer verification identity");
}

export async function updateVerificationStatus(
  userId: string,
  field: "aadhaar_verified" | "dl_verified",
  identity?: CustomerVerificationIdentity
) {
  if (identity) {
    await upsertCustomerVerificationIdentity(userId, identity);
  }

  const requiredFields =
    field === "aadhaar_verified"
      ? ["aadhaar_number", "aadhaar_name", "aadhaar_address"]
      : ["dl_number", "dl_name", "dl_address"];

  const { data: customerData, error: customerError } = await supabase
    .from("customers")
    .select(requiredFields.join(","))
    .eq("id", userId)
    .maybeSingle();

  if (customerError) {
    throw new Error("Failed to read customer verification data");
  }

  const isVerified = requiredFields.every((key) => {
    const value = (customerData as Record<string, unknown> | null)?.[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return isVerified;
}

export async function uploadAvatarAndUpdateProfile({
  userId,
  avatarUri,
}: UpdateAvatarParams) {
  const fileExt = avatarUri.split(".").pop() || "jpg";
  const fileName = `${userId}.${fileExt}`;

  const formData = new FormData();
  formData.append("file", {
    uri: avatarUri,
    name: fileName,
    type: `image/${fileExt}`,
  } as any);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, formData, {
      upsert: true,
    });

  if (uploadError) {
    console.error(uploadError);
    throw new Error("Avatar upload failed");
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  const avatarUrl = publicUrlData.publicUrl;

  const { data, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (profileError) {
    throw new Error("Failed to update profile avatar");
  }

  return data;
}
