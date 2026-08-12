export function formatPrice(amount, options = {}) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return `${options.prefix || "Rs."} 0`;
  }

  const prefix = options.prefix || "Rs.";
  const sign = value < 0 ? "-" : "";
  const absValue = Math.abs(value);
  const formattedValue = absValue.toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${sign}${prefix} ${formattedValue}`;
}
