import { supabase } from "@/lib/supabase";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim();
const CASHFREE_CREATE_ORDER_PATH =
  process.env.EXPO_PUBLIC_CASHFREE_CREATE_ORDER_PATH ??
  "/payments/cashfree/create-order";
const CASHFREE_VERIFY_ORDER_PATH =
  process.env.EXPO_PUBLIC_CASHFREE_VERIFY_ORDER_PATH ??
  "/payments/cashfree/verify-order";

type DocumentType = "AADHAAR" | "PAN" | "DRIVING_LICENSE";

type DigilockerURLResponse = {
  success: true;
  url: string;
  verification_id: string;
  reference_id: number;
  status: string;
};

type DigilockerStatusResponse = {
  success: true;
  data: {
    verification_id: string;
    reference_id: number;
    status: "PENDING" | "AUTHENTICATED" | "EXPIRED" | "CONSENT_DENIED";
    user_details?: {
      name: string;
      dob: string;
      gender: string;
      eaadhaar: string;
      mobile: string;
    };
    document_requested: DocumentType[];
    document_consent: DocumentType[];
    document_consent_validity: string;
  };
};

type DigilockerDocumentResponse = {
  success: true;
  data: Record<string, unknown>;
};

export type CreateCashfreeOrderParams = {
  amount: number;
  customerId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  currency?: string;
  orderNote?: string;
  metadata?: Record<string, unknown>;
};

export type CreateCashfreeOrderResponse = {
  orderId: string;
  paymentSessionId: string;
  orderAmount: number;
  orderCurrency: string;
  raw: unknown;
};

export type VerifyCashfreeOrderResponse = {
  orderId: string;
  orderStatus?: string;
  paymentStatus?: string;
  isPaid: boolean;
  raw: unknown;
};

async function getUserId(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id;
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalized}`;
}

function authHeaders(userId?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(userId ? { "x-user-id": userId } : {}),
  };
}

function pickString(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

function pickNumber(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickBoolean(record: unknown, keys: string[]) {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function hasPaidStatus(value?: string) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toUpperCase();
  return ["PAID", "SUCCESS", "COMPLETED", "CHARGED", "CAPTURED"].includes(normalized);
}

function extractPayload<T extends Record<string, unknown>>(value: unknown): T {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    (value as { data?: unknown }).data &&
    typeof (value as { data?: unknown }).data === "object"
  ) {
    return (value as { data: T }).data;
  }
  return (value as T) ?? ({} as T);
}

export async function createDigilockerURL(
  documentRequested: DocumentType[],
  userFlow: "signin" | "signup" = "signin"
): Promise<DigilockerURLResponse> {
  const userId = await getUserId();
  const res = await fetch(`${API_URL}/verify/digilocker/create`, {
    method: "POST",
    headers: authHeaders(userId),
    body: JSON.stringify({ document_requested: documentRequested, user_flow: userFlow }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Failed to create DigiLocker URL");
  return data;
}

export async function getDigilockerStatus(
  verificationId: string
): Promise<DigilockerStatusResponse> {
  const userId = await getUserId();
  const params = new URLSearchParams({ verification_id: verificationId });
  const res = await fetch(`${API_URL}/verify/digilocker/status?${params}`, {
    method: "GET",
    headers: authHeaders(userId),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Failed to get verification status");
  return data;
}

export async function getDigilockerDocument(
  documentType: DocumentType,
  verificationId: string
): Promise<DigilockerDocumentResponse> {
  const userId = await getUserId();
  const params = new URLSearchParams({ verification_id: verificationId });
  const res = await fetch(
    `${API_URL}/verify/digilocker/document/${documentType}?${params}`,
    {
      method: "GET",
      headers: authHeaders(userId),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Failed to fetch document");
  return data;
}

export async function createCashfreeOrder({
  amount,
  customerId,
  customerEmail,
  customerPhone,
  customerName,
  currency = "INR",
  orderNote,
  metadata,
}: CreateCashfreeOrderParams): Promise<CreateCashfreeOrderResponse> {
  if (!API_URL && !/^https?:\/\//i.test(CASHFREE_CREATE_ORDER_PATH)) {
    throw new Error("Missing EXPO_PUBLIC_API_URL for Cashfree order creation.");
  }

  const userId = await getUserId();
  const res = await fetch(buildApiUrl(CASHFREE_CREATE_ORDER_PATH), {
    method: "POST",
    headers: authHeaders(userId),
    body: JSON.stringify({
      amount,
      currency,
      customer_id: customerId,
      customer_email: customerEmail ?? undefined,
      customer_phone: customerPhone ?? undefined,
      customer_name: customerName ?? undefined,
      order_note: orderNote,
      metadata,
    }),
  });

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const backendMessage =
      data?.message ??
      data?.error?.message ??
      data?.error ??
      (typeof rawText === "string" ? rawText.slice(0, 180) : "");
    throw new Error(
      backendMessage
        ? `Failed to create Cashfree order (${res.status}): ${backendMessage}`
        : `Failed to create Cashfree order (${res.status}).`,
    );
  }

  const payload = extractPayload<Record<string, unknown>>(data);
  const orderId = pickString(payload, ["order_id", "orderId"]);
  const paymentSessionId = pickString(payload, [
    "payment_session_id",
    "paymentSessionId",
    "payment_session",
  ]);
  const orderAmount = pickNumber(payload, ["order_amount", "orderAmount"]) ?? amount;
  const orderCurrency = pickString(payload, ["order_currency", "orderCurrency"]) ?? currency;

  if (!orderId || !paymentSessionId) {
    throw new Error("Cashfree order response is missing order_id/payment_session_id.");
  }

  return {
    orderId,
    paymentSessionId,
    orderAmount,
    orderCurrency,
    raw: data,
  };
}

export async function verifyCashfreeOrder(orderId: string): Promise<VerifyCashfreeOrderResponse> {
  if (!API_URL && !/^https?:\/\//i.test(CASHFREE_VERIFY_ORDER_PATH)) {
    throw new Error("Missing EXPO_PUBLIC_API_URL for Cashfree payment verification.");
  }

  const userId = await getUserId();
  const res = await fetch(buildApiUrl(CASHFREE_VERIFY_ORDER_PATH), {
    method: "POST",
    headers: authHeaders(userId),
    body: JSON.stringify({ order_id: orderId, orderId }),
  });

  const rawText = await res.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = {};
  }
  if (!res.ok) {
    const backendMessage =
      data?.message ??
      data?.error?.message ??
      data?.error ??
      (typeof rawText === "string" ? rawText.slice(0, 180) : "");
    throw new Error(
      backendMessage
        ? `Failed to verify Cashfree payment (${res.status}): ${backendMessage}`
        : `Failed to verify Cashfree payment (${res.status}).`,
    );
  }

  const root = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const payload = extractPayload<Record<string, unknown>>(data);
  const nestedOrder =
    payload?.order && typeof payload.order === "object"
      ? (payload.order as Record<string, unknown>)
      : undefined;
  const nestedPayments = Array.isArray(payload?.payments)
    ? (payload.payments as Record<string, unknown>[])
    : [];

  const normalizedOrderId =
    pickString(root, ["order_id", "orderId"]) ??
    pickString(payload, ["order_id", "orderId"]) ??
    pickString(nestedOrder, ["order_id", "orderId"]) ??
    orderId;
  const orderStatus =
    pickString(root, ["order_status", "orderStatus", "status"]) ??
    pickString(payload, ["order_status", "orderStatus", "status"]) ??
    pickString(nestedOrder, ["order_status", "orderStatus", "status"]);
  const paymentStatusFromList = nestedPayments
    .map((item) =>
      pickString(item, ["payment_status", "paymentStatus", "cf_payment_status", "status"]),
    )
    .find((value) => hasPaidStatus(value));
  const paymentStatus =
    pickString(root, ["payment_status", "paymentStatus", "cf_payment_status"]) ??
    pickString(payload, ["payment_status", "paymentStatus", "cf_payment_status"]) ??
    paymentStatusFromList;
  const paidFlag =
    pickBoolean(root, ["is_paid", "isPaid", "paid", "payment_success"]) ??
    pickBoolean(payload, ["is_paid", "isPaid", "paid", "payment_success"]);
  const statusSignalsPaid = [orderStatus, paymentStatus].some((value) => hasPaidStatus(value));

  return {
    orderId: normalizedOrderId,
    orderStatus,
    paymentStatus,
    isPaid: paidFlag ?? statusSignalsPaid,
    raw: data,
  };
}
