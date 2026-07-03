import type { EntryType, FinancialCategoryType } from "@/interfaces/financial";

export type ViewMode = "day" | "week" | "month" | "year";

export type DetailSpreadsheetRow = {
  category: string;
  name: string;
  type: FinancialCategoryType;
  months: Record<number, number>;
  total: number;
  notes: Record<number, string[]>;
};

export type SpreadsheetCellEdit = {
  category: string;
  name: string;
  month: number;
  type: EntryType;
  value: number;
};
