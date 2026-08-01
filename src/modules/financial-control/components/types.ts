import type { EntryType, FinancialCategoryType } from "@/interfaces/financial";

export type ViewMode = "day" | "week" | "month" | "year";

export type DetailSpreadsheetRow = {
  category: string;
  name: string;
  type: FinancialCategoryType;
  months: Record<number, number>;
  linkedMonths?: Record<number, number>;
  linkedInfo?: Record<number, string[]>;
  total: number;
  linkedTotal?: number;
  notes: Record<number, string[]>;
};

export type SpreadsheetCellEdit = {
  category: string;
  name: string;
  month: number;
  type: EntryType | "INVESTMENT";
  value: number;
  linkedValue?: number;
  linkedCreditCardId?: string | null;
  linkedCreditCardPurchaseId?: string | null;
  linkedCreditCardInstallments?: number | null;
};
