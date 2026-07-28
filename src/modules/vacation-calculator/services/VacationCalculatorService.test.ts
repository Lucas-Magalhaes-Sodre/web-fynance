import { VacationCalculatorService } from "./VacationCalculatorService";
import type { VacationSimulationInput } from "../types";
import { validatePaymentSum } from "../validators/VacationSimulationValidator";

function input(overrides: Partial<VacationSimulationInput> = {}): VacationSimulationInput {
  return {
    salaryInputMode: "NET",
    dataSource: "MANUAL",
    monthlySalaryCents: 600000,
    payments: [
      { id: "p1", description: "Adiantamento", amountCents: 300000, day: 15 },
      { id: "p2", description: "Salário", amountCents: 300000, day: 30 },
    ],
    vacationStartDate: "2026-08-10",
    vacationDays: 30,
    ...overrides,
  };
}

describe("VacationCalculatorService", () => {
  it("calcula valor diário em centavos", () => {
    expect(VacationCalculatorService.calculateDailySalary(600000)).toBe(20000);
  });

  it("calcula terço constitucional", () => {
    expect(VacationCalculatorService.calculateThird(600000)).toBe(200000);
  });

  it("calcula pagamento de férias líquido simplificado", () => {
    const result = VacationCalculatorService.calculate(input());
    expect(result.vacationDaysAmountCents).toBe(600000);
    expect(result.constitutionalThirdCents).toBe(200000);
    expect(result.grossVacationPaymentCents).toBe(800000);
    expect(result.estimatedNetVacationPaymentCents).toBe(800000);
  });

  it("separa antecipação salarial de ganho adicional", () => {
    const result = VacationCalculatorService.calculate(input({ vacationDays: 15 }));
    expect(result.salaryAdvanceCents).toBe(300000);
    expect(result.trulyAdditionalGrossCents).toBe(100000);
    expect(result.remainingSalaryCents).toBe(300000);
  });

  it("monta linha do tempo em ordem cronológica", () => {
    const result = VacationCalculatorService.calculate(input());
    expect(result.timeline[0].date).toBe("2026-08-08");
    expect(result.timeline.map((item) => item.kind)).toContain("VACATION_PAYMENT");
    expect(result.timeline.map((item) => item.kind)).toContain("RETURN");
  });

  it.each([1, 5, 10, 15, 20, 30])("calcula férias de %i dia(s)", (days) => {
    const result = VacationCalculatorService.calculate(input({ vacationDays: days }));
    expect(result.vacationDaysAmountCents).toBe(20000 * days);
    expect(result.constitutionalThirdCents).toBe(Math.round((20000 * days) / 3));
  });

  it("calcula férias fracionadas com venda de dias", () => {
    const result = VacationCalculatorService.calculate(input({ vacationDays: 20, soldVacationDays: 10 }));
    expect(result.vacationDaysAmountCents).toBe(400000);
    expect(result.soldVacationAmountCents).toBe(200000);
    expect(result.constitutionalThirdCents).toBe(200000);
  });

  it("aceita salário bruto sem inventar INSS/IRRF", () => {
    const result = VacationCalculatorService.calculate(input({
      salaryInputMode: "GROSS",
      grossSalaryCents: 600000,
      fixedDiscountsCents: 50000,
    }));
    expect(result.taxes.inssCents).toBe(0);
    expect(result.taxes.irrfCents).toBe(0);
    expect(result.estimatedNetVacationPaymentCents).toBe(750000);
  });

  it("aceita um, dois e três pagamentos", () => {
    const one = [{ id: "p1", description: "Salário", amountCents: 600000, day: 30 }];
    const two = input().payments;
    const three = [
      { id: "p1", description: "Adiantamento", amountCents: 200000, day: 10 },
      { id: "p2", description: "Parcela", amountCents: 200000, day: 20 },
      { id: "p3", description: "Salário", amountCents: 200000, day: 30 },
    ];
    expect(VacationCalculatorService.calculate(input({ payments: one })).timeline.length).toBeGreaterThan(0);
    expect(VacationCalculatorService.calculate(input({ payments: two })).timeline.length).toBeGreaterThan(0);
    expect(VacationCalculatorService.calculate(input({ payments: three })).timeline.length).toBeGreaterThan(0);
  });

  it("valida soma dos pagamentos", () => {
    expect(validatePaymentSum(600000, input().payments).matches).toBe(true);
    expect(validatePaymentSum(600000, [{ id: "p1", description: "Salário", amountCents: 500000, day: 30 }]).matches).toBe(false);
  });

  it("valida entradas obrigatórias", () => {
    expect(() => VacationCalculatorService.calculate(input({ vacationDays: 0 }))).toThrow();
  });
});

