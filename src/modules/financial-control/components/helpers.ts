import type {
  EntryType,
  FinancialCategoryType,
  FinancialItem,
} from "@/interfaces/financial";
import { balanceColor, formatMoney } from "@/utils/format";

export function amountColor(value: number) {
  return balanceColor(value);
}

export function formatResultMoney(value: number) {
  if (value < 0) return `- ${formatMoney(Math.abs(value))}`;
  return formatMoney(value);
}

export function itemDateLabel(item: FinancialItem) {
  return item.type.includes("INCOME") ? "Data do recebimento" : "Data da saida";
}

export function categoryKey(type: FinancialCategoryType, category: string) {
  return `${type}:${category}`;
}

export function normalizedCategoryKey(
  type: FinancialCategoryType,
  category: string,
) {
  return `${type}:${category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim()}`;
}

export function daysInMonth(yearValue: number, monthValue: number) {
  return new Date(yearValue, monthValue, 0).getDate();
}

export function dateForMonthlyOccurrence(
  yearValue: number,
  monthValue: number,
  dayValue: number,
) {
  const safeDay = Math.min(dayValue, daysInMonth(yearValue, monthValue));
  return `${yearValue}-${String(monthValue).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

export function monthCursorValue(yearValue: number, monthValue: number) {
  return yearValue * 12 + monthValue;
}

function hexToRgb(color: string) {
  const match = color.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return null;
  const value = match[1];
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(firstColor: string, secondColor: string) {
  const first = relativeLuminance(firstColor);
  const second = relativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function readableCategoryTextColor(color: string) {
  return contrastRatio(color, "#FFFFFF") >= 4.5 ? color : "#111827";
}
