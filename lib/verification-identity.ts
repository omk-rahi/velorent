function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toSafeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
}

export function extractIdentityField(
  payload: unknown,
  candidateKeys: string[]
): string | null {
  const wanted = new Set(candidateKeys.map(normalizeKey));
  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      const normalized = normalizeKey(key);
      if (wanted.has(normalized)) {
        const resolved = toSafeString(value);
        if (resolved) return resolved;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

export function extractIdentityAddress(payload: unknown): string | null {
  const directAddress = extractIdentityField(payload, [
    "address",
    "full_address",
    "fulladdress",
    "permanent_address",
    "permanentaddress",
    "present_address",
    "presentaddress",
    "communication_address",
    "communicationaddress",
    "house_address",
  ]);

  if (directAddress) return directAddress;

  const parts = [
    extractIdentityField(payload, ["house", "house_no", "house_number"]),
    extractIdentityField(payload, ["street", "street_name", "road"]),
    extractIdentityField(payload, ["landmark"]),
    extractIdentityField(payload, ["locality", "sub_locality", "village", "vtc"]),
    extractIdentityField(payload, ["city", "district"]),
    extractIdentityField(payload, ["state"]),
    extractIdentityField(payload, ["pincode", "pin", "postal_code", "zip"]),
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;

  return Array.from(new Set(parts)).join(", ");
}
