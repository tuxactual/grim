export function parseAmount(input: string) {
  const trimmed = input.trim().replace(/[$,\s]/g, "");

  if (!trimmed) {
    return null;
  }

  const sign = trimmed.startsWith("+") ? 1 : -1;
  const normalized = trimmed.replace(/^[+-]/, "");
  const parsedValue = parseFloat(normalized);

  if (Number.isNaN(parsedValue)) {
    return null;
  }

  return Math.round(parsedValue * 100) * sign;
}

export function formatAmount(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    signDisplay: "always",
  }).format(cents / 100);
}
