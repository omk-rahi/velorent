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
