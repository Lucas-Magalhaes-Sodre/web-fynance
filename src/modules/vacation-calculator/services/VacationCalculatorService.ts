import type {
  VacationPayment,
  VacationSimulationInput,
  VacationSimulationResult,
  VacationTaxes,
  VacationTimelineItem,
} from "../types";
import { addDays, dateFromDay, formatBrazilianDate } from "../utils/date";
import { formatCents } from "../utils/money";

function roundDivide(value: number, divisor: number) {
  return Math.round(value / divisor);
}

function sortTimeline(items: VacationTimelineItem[]) {
  return [...items].sort((first, second) => first.date.localeCompare(second.date));
}

export class VacationCalculatorService {
  static calculateDailySalary(monthlySalaryCents: number) {
    return roundDivide(monthlySalaryCents, 30);
  }

  static calculateVacationAmount(dailySalaryCents: number, days: number) {
    return dailySalaryCents * Math.max(days, 0);
  }

  static calculateThird(vacationAmountCents: number, soldVacationAmountCents = 0) {
    return roundDivide(vacationAmountCents + soldVacationAmountCents, 3);
  }

  static calculateTaxes(input: VacationSimulationInput, grossVacationPaymentCents: number): VacationTaxes {
    if (input.salaryInputMode === "NET") {
      return {
        inssCents: 0,
        irrfCents: 0,
        dependentsDeductionCents: 0,
        pensionCents: 0,
        fixedDiscountsCents: input.fixedDiscountsCents ?? 0,
        benefitsCents: input.benefitsCents ?? 0,
        estimated: false,
        message: "Modo líquido: não recalculamos INSS e IRRF. A simulação usa os valores informados como estimativa.",
      };
    }

    const fixedDiscountsCents = input.fixedDiscountsCents ?? 0;
    const benefitsCents = input.benefitsCents ?? 0;
    const pensionCents = input.pensionCents ?? 0;
    return {
      inssCents: 0,
      irrfCents: 0,
      dependentsDeductionCents: 0,
      pensionCents,
      fixedDiscountsCents,
      benefitsCents,
      estimated: false,
      message:
        "Modo bruto: a estrutura está preparada para descontos, mas as tabelas oficiais de INSS/IRRF não foram configuradas. Exibimos valores brutos e descontos informados manualmente.",
    };
  }

  static calculateSalaryImpact(input: VacationSimulationInput, vacationDaysAmountCents: number) {
    const salaryAdvanceCents = vacationDaysAmountCents;
    const remainingSalaryCents = Math.max(input.monthlySalaryCents - salaryAdvanceCents, 0);
    return { salaryAdvanceCents, remainingSalaryCents };
  }

  static calculateTimeline(input: VacationSimulationInput, result: {
    grossVacationPaymentCents: number;
    remainingSalaryCents: number;
    vacationEndDate: string;
    returnDate: string;
    legalPaymentLimitDate: string;
  }) {
    const salaryItems: VacationTimelineItem[] = input.payments.map((payment) => ({
      id: `salary-${payment.id}`,
      date: dateFromDay(input.vacationStartDate, payment.day),
      title: payment.description || "Salário",
      amountCents: payment.amountCents,
      reason: "Pagamento salarial normal cadastrado ou informado na simulação.",
      impact: "Pode ser reduzido se parte dos dias do mês já tiver sido antecipada no pagamento das férias.",
      kind: "SALARY",
    }));

    return sortTimeline([
      {
        id: "vacation-payment",
        date: result.legalPaymentLimitDate,
        title: "Pagamento das férias",
        amountCents: result.grossVacationPaymentCents,
        reason: "A legislação prevê pagamento até dois dias antes do início das férias.",
        impact: "Inclui remuneração antecipada dos dias de férias e o adicional constitucional de 1/3.",
        kind: "VACATION_PAYMENT",
      },
      ...salaryItems,
      {
        id: "remaining-salary",
        date: dateFromDay(input.vacationStartDate, 30),
        title: "Salário restante estimado",
        amountCents: result.remainingSalaryCents,
        reason: "Estimativa do que sobra do salário mensal após considerar os dias de férias antecipados.",
        impact: "Ajuda a entender que parte das férias substitui salário, não representa dinheiro extra.",
        kind: "SALARY",
      },
      {
        id: "return",
        date: result.returnDate,
        title: "Retorno previsto",
        amountCents: 0,
        reason: `Férias previstas de ${formatBrazilianDate(input.vacationStartDate)} até ${formatBrazilianDate(result.vacationEndDate)}.`,
        impact: "Marco informativo para organizar o período pós-férias.",
        kind: "RETURN",
      },
    ]);
  }

  static validate(input: VacationSimulationInput) {
    const errors: string[] = [];
    if (input.monthlySalaryCents <= 0) errors.push("Informe um salário mensal maior que zero.");
    if (!input.vacationStartDate) errors.push("Informe a data de início das férias.");
    if (input.vacationDays < 1 || input.vacationDays > 30) errors.push("Informe uma quantidade de dias entre 1 e 30.");
    if ((input.soldVacationDays ?? 0) < 0) errors.push("A quantidade de dias vendidos não pode ser negativa.");
    if ((input.soldVacationDays ?? 0) > 10) errors.push("A venda de férias costuma ser limitada a 10 dias.");
    if (!input.payments.length) errors.push("Informe pelo menos um pagamento salarial.");
    return errors;
  }

  static calculate(input: VacationSimulationInput): VacationSimulationResult {
    const validationErrors = this.validate(input);
    if (validationErrors.length) {
      throw new Error(validationErrors.join(" "));
    }

    const dailySalaryCents = this.calculateDailySalary(input.monthlySalaryCents);
    const vacationDaysAmountCents = this.calculateVacationAmount(dailySalaryCents, input.vacationDays);
    const soldVacationAmountCents = this.calculateVacationAmount(dailySalaryCents, input.soldVacationDays ?? 0);
    const constitutionalThirdCents = this.calculateThird(vacationDaysAmountCents, soldVacationAmountCents);
    const thirteenthAdvanceCents = input.advanceThirteenth ? roundDivide(input.monthlySalaryCents, 2) : 0;
    const grossVacationPaymentCents =
      vacationDaysAmountCents + soldVacationAmountCents + constitutionalThirdCents + thirteenthAdvanceCents;
    const taxes = this.calculateTaxes(input, grossVacationPaymentCents);
    const estimatedNetVacationPaymentCents = Math.max(
      grossVacationPaymentCents -
        taxes.inssCents -
        taxes.irrfCents -
        taxes.pensionCents -
        taxes.fixedDiscountsCents -
        taxes.benefitsCents,
      0,
    );
    const { salaryAdvanceCents, remainingSalaryCents } = this.calculateSalaryImpact(input, vacationDaysAmountCents);
    const trulyAdditionalGrossCents = constitutionalThirdCents + soldVacationAmountCents + thirteenthAdvanceCents;
    const totalReceivedInPeriodCents = estimatedNetVacationPaymentCents + remainingSalaryCents;
    const vacationEndDate = addDays(input.vacationStartDate, input.vacationDays - 1);
    const returnDate = addDays(vacationEndDate, 1);
    const legalPaymentLimitDate = addDays(input.vacationStartDate, -2);
    const timeline = this.calculateTimeline(input, {
      grossVacationPaymentCents,
      remainingSalaryCents,
      vacationEndDate,
      returnDate,
      legalPaymentLimitDate,
    });

    return {
      dailySalaryCents,
      vacationDaysAmountCents,
      soldVacationAmountCents,
      thirteenthAdvanceCents,
      constitutionalThirdCents,
      grossVacationPaymentCents,
      estimatedNetVacationPaymentCents,
      trulyAdditionalGrossCents,
      salaryAdvanceCents,
      remainingSalaryCents,
      totalReceivedInPeriodCents,
      vacationEndDate,
      returnDate,
      legalPaymentLimitDate,
      taxes,
      timeline,
      calculationMemory: [
        `Salário mensal considerado: ${formatCents(input.monthlySalaryCents)}.`,
        `Valor diário: ${formatCents(input.monthlySalaryCents)} / 30 = ${formatCents(dailySalaryCents)}.`,
        `Dias de férias: ${input.vacationDays}. Remuneração dos dias: ${formatCents(vacationDaysAmountCents)}.`,
        `Terço constitucional: (${formatCents(vacationDaysAmountCents)} + ${formatCents(soldVacationAmountCents)}) / 3 = ${formatCents(constitutionalThirdCents)}.`,
        `Pagamento bruto estimado das férias: ${formatCents(grossVacationPaymentCents)}.`,
        `Parte antecipada do salário: ${formatCents(salaryAdvanceCents)}.`,
        `Ganho adicional bruto estimado: ${formatCents(trulyAdditionalGrossCents)}.`,
      ],
      warnings: [
        "Esta simulação é apenas uma estimativa.",
        "O pagamento das férias não representa todo um ganho adicional.",
        "O adicional constitucional de 1/3 é o principal benefício financeiro das férias, porém seu valor líquido pode variar devido aos descontos legais.",
      ],
    };
  }
}

