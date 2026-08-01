import { currencyDigits, formatMoney } from "@/utils/format";

export function currencyToCents(value: string) {
  const digits = currencyDigits(value);
  return digits ? Number(digits) : 0;
}

export function centsToCurrency(valueCents: number) {
  return formatMoney(valueCents / 100);
}

export function centsToCurrencyInput(valueCents: number) {
  if (!valueCents) return "";
  return centsToCurrency(valueCents);
}

export function formatCents(valueCents: number) {
  return centsToCurrency(valueCents);
}
