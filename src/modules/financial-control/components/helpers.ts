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

function rgbToHex(rgb: { r: number; g: number; b: number }) {
  return `#${[rgb.r, rgb.g, rgb.b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixRgb(
  color: { r: number; g: number; b: number },
  target: { r: number; g: number; b: number },
  amount: number,
) {
  return {
    r: color.r + (target.r - color.r) * amount,
    g: color.g + (target.g - color.g) * amount,
    b: color.b + (target.b - color.b) * amount,
  };
}

export function readableTableValueColor(color: string, backgroundColor: string) {
  if (contrastRatio(color, backgroundColor) >= 4.5) return color;

  const rgb = hexToRgb(color);
  const background = hexToRgb(backgroundColor);
  if (!rgb || !background) return readableCategoryTextColor(color);

  const target = relativeLuminance(backgroundColor) > 0.5
    ? { r: 0, g: 0, b: 0 }
    : { r: 255, g: 255, b: 255 };

  for (let amount = 0.12; amount <= 0.82; amount += 0.06) {
    const mixed = rgbToHex(mixRgb(rgb, target, amount));
    if (contrastRatio(mixed, backgroundColor) >= 4.5) return mixed;
  }

  return relativeLuminance(backgroundColor) > 0.5 ? "#111827" : "#F8FAFC";
}

export function readableTableValueBackground(color: string, backgroundColor: string) {
  if (contrastRatio(color, backgroundColor) >= 3) return backgroundColor;

  const background = hexToRgb(backgroundColor);
  if (!background) return backgroundColor;

  const target = relativeLuminance(backgroundColor) > 0.5
    ? { r: 15, g: 23, b: 42 }
    : { r: 248, g: 250, b: 252 };

  for (let amount = 0.08; amount <= 0.54; amount += 0.04) {
    const mixed = rgbToHex(mixRgb(background, target, amount));
    if (contrastRatio(color, mixed) >= 3) return mixed;
  }

  return rgbToHex(mixRgb(background, target, 0.54));
}
