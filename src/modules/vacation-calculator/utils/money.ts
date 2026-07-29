export function currencyToCents(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function centsToCurrency(valueCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueCents / 100);
}

export function centsToCurrencyInput(valueCents: number) {
  if (!valueCents) return "";
  return centsToCurrency(valueCents);
}

export function formatCents(valueCents: number) {
  return centsToCurrency(valueCents);
}

