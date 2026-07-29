import type { FinancialItem } from "@/interfaces/financial";
import { api } from "@/services/api";
import type { VacationPayment } from "../types";

export type RegisteredSalaryFilters = {
  month?: number;
  year: number;
  page: number;
  limit: number;
};

export type RegisteredSalaryPage = {
  items: FinancialItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function itemDay(item: FinancialItem) {
  return item.dueDay ?? new Date(item.paymentDate ?? item.date).getDate();
}

export async function listRegisteredSalaryCandidates(filters: RegisteredSalaryFilters) {
  const { data } = await api.get<RegisteredSalaryPage>("/financial-items/salary-candidates", {
    params: filters,
  });
  return data;
}

export function financialItemToVacationPayment(item: FinancialItem): VacationPayment {
  return {
    id: item.id,
    description: item.name ?? item.title ?? item.category ?? "Salário",
    amountCents: Math.round(item.amount * 100),
    day: itemDay(item),
    source: "REGISTERED",
  };
}
