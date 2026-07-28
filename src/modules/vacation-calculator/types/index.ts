export type SalaryInputMode = "NET" | "GROSS";

export type SalaryDataSource = "MANUAL" | "REGISTERED";

export type VacationPayment = {
  id: string;
  description: string;
  amountCents: number;
  day: number;
  source?: "MANUAL" | "REGISTERED";
};

export type VacationTaxes = {
  inssCents: number;
  irrfCents: number;
  dependentsDeductionCents: number;
  pensionCents: number;
  fixedDiscountsCents: number;
  benefitsCents: number;
  estimated: boolean;
  message: string;
};

export type VacationSimulationInput = {
  salaryInputMode: SalaryInputMode;
  dataSource: SalaryDataSource;
  monthlySalaryCents: number;
  grossSalaryCents?: number;
  dependents?: number;
  pensionCents?: number;
  fixedDiscountsCents?: number;
  benefitsCents?: number;
  payments: VacationPayment[];
  vacationStartDate: string;
  vacationDays: number;
  soldVacationDays?: number;
  advanceThirteenth?: boolean;
};

export type VacationTimelineItem = {
  id: string;
  date: string;
  title: string;
  amountCents: number;
  reason: string;
  impact: string;
  kind: "SALARY" | "VACATION_PAYMENT" | "RETURN" | "INFO";
};

export type VacationSimulationResult = {
  dailySalaryCents: number;
  vacationDaysAmountCents: number;
  soldVacationAmountCents: number;
  thirteenthAdvanceCents: number;
  constitutionalThirdCents: number;
  grossVacationPaymentCents: number;
  estimatedNetVacationPaymentCents: number;
  trulyAdditionalGrossCents: number;
  salaryAdvanceCents: number;
  remainingSalaryCents: number;
  totalReceivedInPeriodCents: number;
  vacationEndDate: string;
  returnDate: string;
  legalPaymentLimitDate: string;
  taxes: VacationTaxes;
  timeline: VacationTimelineItem[];
  calculationMemory: string[];
  warnings: string[];
};

