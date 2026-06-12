export const CURRENCIES = {
  USD: { symbol: "$", code: "USD", locale: "en-US" },
  INR: { symbol: "₹", code: "INR", locale: "en-IN" },
};

/**
 * @param {number | string | null | undefined} amount
 * @param {"USD" | "INR" | string} [currency]
 */
export function formatMoney(amount, currency = "USD") {
  const key = currency === "INR" ? "INR" : "USD";
  const c = CURRENCIES[key];
  return new Intl.NumberFormat(c.locale, {
    style: "currency",
    currency: c.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}

/**
 * @param {"USD" | "INR" | string} [currency]
 */
export function getCurrencySymbol(currency = "USD") {
  return currency === "INR" ? CURRENCIES.INR.symbol : CURRENCIES.USD.symbol;
}
