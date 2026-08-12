export const PRICE_OPTIONS = [
  19.9, 29.9, 39.9, 49.9, 59.9, 69.9, 79.9, 89.9, 99.9
];

export const POPULAR_STRIPE_PRICE_ID = "price_1TgAzbCnvLpXfmPcAj0OIXUH";

export const PRICE_STRIPE_MAP: Record<number, string> = {
  19.9: POPULAR_STRIPE_PRICE_ID,
  29.9: "price_1TskzhCnvLpXfmPcqvQputfD",
  39.9: "price_1TskwQCnvLpXfmPcchREvQno",
  49.9: "price_1Tsl0wCnvLpXfmPcxlqdRtoE",
  59.9: "price_1Tsl31CnvLpXfmPcO0YR4poj",
  69.9: "price_1Tsl4KCnvLpXfmPceU2kEeZx",
  79.9: "price_1Tsl7jCnvLpXfmPcmfHDK3Er",
  89.9: "price_1Tsl9LCnvLpXfmPcbH7o8fkZ",
};

export const getStripePriceIdForValue = (value?: number | null): string | null => {
  if (value == null || !Number.isFinite(value)) return null;
  const price = Number(value.toFixed(2));
  return PRICE_STRIPE_MAP[price] || null;
};
