import type { AppLanguage } from '@/i18n/translations';

export type AppCurrency = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'MXN' | 'CLP' | 'COP' | 'PEN' | 'UYU';

export const currencyKey = '@minha-receita:currency';
export const currencyExplicitKey = '@minha-receita:currency-explicit';

export const currencyNames: Record<AppCurrency, string> = {
  BRL: 'Real brasileiro',
  USD: 'Dollar',
  EUR: 'Euro',
  GBP: 'Pound',
  ARS: 'Peso argentino',
  MXN: 'Peso mexicano',
  CLP: 'Peso chileno',
  COP: 'Peso colombiano',
  PEN: 'Sol peruano',
  UYU: 'Peso uruguaio'
};

export const currencySymbols: Record<AppCurrency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  ARS: '$',
  MXN: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$'
};

export function defaultCurrencyForLanguage(language: AppLanguage): AppCurrency {
  if (language === 'en') return 'USD';
  if (language === 'es') return 'EUR';
  return 'BRL';
}

export function isAppCurrency(value: string | null): value is AppCurrency {
  return Boolean(value && Object.prototype.hasOwnProperty.call(currencySymbols, value));
}

export function readStoredCurrency(language: AppLanguage = 'pt-BR'): AppCurrency {
  if (typeof window === 'undefined') return defaultCurrencyForLanguage(language);
  const stored = window.localStorage.getItem(currencyKey);
  return isAppCurrency(stored) ? stored : defaultCurrencyForLanguage(language);
}

export function currencyLocale(currency: AppCurrency) {
  if (currency === 'USD') return 'en-US';
  if (currency === 'EUR') return 'de-DE';
  if (currency === 'GBP') return 'en-GB';
  return 'pt-BR';
}

export function formatMoneyWithCurrency(value: number, currency: AppCurrency) {
  const formattedNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  return `${currencySymbols[currency]} ${formattedNumber}`;
}

export function formatMoney(value: number, currency: AppCurrency = readStoredCurrency()) {
  return formatMoneyWithCurrency(value, currency);
}

export function currencyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function digitsToCurrency(value: string) {
  const cents = currencyDigits(value);
  if (!cents) return '';
  return formatMoney(Number(cents) / 100);
}

export function currencyToNumber(value: string) {
  const cents = currencyDigits(value);
  return cents ? Number(cents) / 100 : 0;
}

export function currencyCaretPosition(formattedValue: string, digitsBeforeCaret: number) {
  if (digitsBeforeCaret <= 0) {
    const firstDigitIndex = formattedValue.search(/\d/);
    return firstDigitIndex >= 0 ? firstDigitIndex : formattedValue.length;
  }

  let seenDigits = 0;
  for (let index = 0; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      seenDigits += 1;
      if (seenDigits >= digitsBeforeCaret) return index + 1;
    }
  }

  return formattedValue.length;
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export const typeLabels = {
  INCOME: 'Receita',
  EXPENSE: 'Despesa'
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
  saving: '#D4A017',
  savingSoft: '#FFF8DB',
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
