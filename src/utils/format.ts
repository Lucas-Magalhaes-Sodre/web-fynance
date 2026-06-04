export const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export function formatMoney(value: number) {
  return money.format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export const typeLabels = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa',
  FIXED_EXPENSE: 'Despesa fixa',
  EXTRA_EXPENSE: 'Despesa extra',
  FIXED_INCOME: 'Receita fixa',
  EXTRA_INCOME: 'Receita extra'
} as const;

export const months = [
  'janeiro',
  'fevereiro',
  'marco',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
];

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function weekRange(date = new Date()) {
  const current = new Date(date);
  const day = current.getDay() || 7;
  const start = new Date(current);
  start.setDate(current.getDate() - day + 1);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { startDate: isoDate(start), endDate: isoDate(end) };
}

export const financeColors = {
  income: '#2563EB',
  incomeSoft: '#EFF6FF',
  expense: '#EA580C',
  expenseSoft: '#FFF7ED',
  saving: '#0D9488',
  savingSoft: '#F0FDFA',
  positive: '#16A34A',
  positiveSoft: '#F0FDF4',
  negative: '#DC2626',
  negativeSoft: '#FEF2F2',
  neutral: '#111827',
  neutralSoft: '#F3F4F6'
};

export function balanceColor(value: number) {
  if (value > 0) return financeColors.positive;
  if (value < 0) return financeColors.negative;
  return financeColors.neutral;
}

export function amountToneColor(tone: 'income' | 'expense' | 'balance' | 'saving' | 'neutral', value = 0) {
  if (tone === 'income') return financeColors.income;
  if (tone === 'expense') return financeColors.expense;
  if (tone === 'saving') return financeColors.saving;
  if (tone === 'neutral') return financeColors.neutral;
  return balanceColor(value);
}
