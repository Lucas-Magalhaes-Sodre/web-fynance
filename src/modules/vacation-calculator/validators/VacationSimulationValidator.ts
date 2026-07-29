import type { VacationPayment, VacationSimulationInput } from "../types";

export function validatePaymentSum(monthlySalaryCents: number, payments: VacationPayment[]) {
  const total = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  return {
    totalCents: total,
    matches: total === monthlySalaryCents,
    differenceCents: total - monthlySalaryCents,
  };
}

export function validateVacationSimulationInput(input: VacationSimulationInput) {
  const errors: string[] = [];
  if (input.monthlySalaryCents <= 0) errors.push("Informe o salário mensal.");
  if (!input.payments.length) errors.push("Informe ao menos um pagamento.");
  if (!input.vacationStartDate) errors.push("Informe a data de início das férias.");
  if (input.vacationDays < 1 || input.vacationDays > 30) errors.push("A quantidade de dias deve estar entre 1 e 30.");
  if ((input.soldVacationDays ?? 0) > 10) errors.push("A venda de férias deve ser de no máximo 10 dias.");
  return errors;
}

