// Lightweight fetch helpers for FarmMart frontend
export async function api<T = unknown>(
  url: string,
  opts?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const fmtINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
};

export const CATEGORIES = [
  "Grains",
  "Vegetables",
  "Fruits",
  "Pulses",
  "Spices",
  "Dairy",
  "Nuts",
  "Herbs",
];

export const ROLE_LABELS: Record<string, string> = {
  BUYER: "Buyer",
  FARMER: "Farmer",
  WHOLESALER: "Wholesaler",
  TRANSPORTER: "Transporter",
};
