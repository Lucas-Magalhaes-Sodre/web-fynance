import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import CalculateIcon from "@mui/icons-material/Calculate";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import TablePagination from "@mui/material/TablePagination";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { StatCard } from "@/components/molecules/StatCard";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { FinancialItem } from "@/interfaces/financial";
import { isoDate } from "@/utils/format";
import {
  financialItemToVacationPayment,
  listRegisteredSalaryCandidates,
} from "../services/RegisteredSalaryService";
import { VacationCalculatorService } from "../services/VacationCalculatorService";
import type { SalaryDataSource, SalaryInputMode, VacationPayment, VacationSimulationInput } from "../types";
import { addDays, formatBrazilianDate } from "../utils/date";
import { centsToCurrencyInput, currencyToCents, formatCents } from "../utils/money";
import { validatePaymentSum } from "../validators/VacationSimulationValidator";

const steps = ["Dados", "Férias", "Resultado"];
const registeredSalariesPerPage = 12;
const monthOptions = [
  { value: "", label: "Todos os meses" },
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

function emptyPayment(index: number): VacationPayment {
  return {
    id: `manual-${index + 1}`,
    description: index === 0 ? "Salário" : `Pagamento ${index + 1}`,
    amountCents: 0,
    day: index === 0 ? 30 : 15,
    source: "MANUAL",
  };
}

function buildPayments(count: number, monthlySalaryCents: number) {
  const safeCount = Math.max(1, Math.min(count, 3));
  const base = Math.floor(monthlySalaryCents / safeCount);
  return Array.from({ length: safeCount }, (_, index) => ({
    ...emptyPayment(index),
    amountCents: index === safeCount - 1 ? monthlySalaryCents - base * (safeCount - 1) : base,
    day: safeCount === 1 ? 30 : index === 0 ? 15 : 30,
  }));
}

function registeredSalaryReference(item: FinancialItem) {
  const date = new Date(item.date);
  const month = item.month || date.getMonth() + 1;
  const year = item.year || date.getFullYear();
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date(year, month - 1, 1));
  return `${monthLabel} de ${year}`;
}

function DatePreviewCard({ label, date }: { label: string; date: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        height: "100%",
        bgcolor: "var(--mr-card)",
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={1} alignItems="center">
          <EventAvailableIcon color="primary" fontSize="small" />
          <Typography color="text.secondary" fontWeight={900}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={950}>
          {date ? formatBrazilianDate(date) : "-"}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function VacationCalculatorPage() {
  const { t } = usePreferences();
  const [activeStep, setActiveStep] = useState(0);
  const [salaryInputMode, setSalaryInputMode] = useState<SalaryInputMode | "">("");
  const [dataSource, setDataSource] = useState<SalaryDataSource>("MANUAL");
  const [monthlySalaryCents, setMonthlySalaryCents] = useState(0);
  const [grossSalaryCents, setGrossSalaryCents] = useState(0);
  const [dependents, setDependents] = useState(0);
  const [pensionCents, setPensionCents] = useState(0);
  const [fixedDiscountsCents, setFixedDiscountsCents] = useState(0);
  const [benefitsCents, setBenefitsCents] = useState(0);
  const [paymentCount, setPaymentCount] = useState(1);
  const [payments, setPayments] = useState<VacationPayment[]>([emptyPayment(0)]);
  const [registeredItems, setRegisteredItems] = useState<FinancialItem[]>([]);
  const [selectedRegisteredItems, setSelectedRegisteredItems] = useState<Record<string, FinancialItem>>({});
  const [selectedRegisteredIds, setSelectedRegisteredIds] = useState<string[]>([]);
  const [registeredPage, setRegisteredPage] = useState(0);
  const [registeredTotal, setRegisteredTotal] = useState(0);
  const [registeredMonth, setRegisteredMonth] = useState<number | "">("");
  const [registeredYear, setRegisteredYear] = useState(new Date().getFullYear());
  const [loadingRegistered, setLoadingRegistered] = useState(false);
  const [registeredError, setRegisteredError] = useState("");
  const [vacationStartDate, setVacationStartDate] = useState(isoDate());
  const [vacationDays, setVacationDays] = useState(30);
  const [soldVacationDays, setSoldVacationDays] = useState(0);
  const [advanceThirteenth, setAdvanceThirteenth] = useState(false);

  useEffect(() => {
    if (dataSource !== "REGISTERED") return;
    setLoadingRegistered(true);
    setRegisteredError("");
    listRegisteredSalaryCandidates({
      month: registeredMonth || undefined,
      year: registeredYear,
      page: registeredPage + 1,
      limit: registeredSalariesPerPage,
    })
      .then((result) => {
        setRegisteredItems(result.items);
        setRegisteredTotal(result.pagination.total);
      })
      .catch(() => setRegisteredError("Não foi possível carregar salários cadastrados."))
      .finally(() => setLoadingRegistered(false));
  }, [dataSource, registeredMonth, registeredPage, registeredYear]);

  useEffect(() => {
    setRegisteredPage(0);
  }, [dataSource, registeredMonth, registeredYear]);

  const selectedRegisteredPayments = useMemo(
    () =>
      selectedRegisteredIds
        .map((id) => selectedRegisteredItems[id])
        .filter((item): item is FinancialItem => Boolean(item))
        .map(financialItemToVacationPayment),
    [selectedRegisteredIds, selectedRegisteredItems],
  );

  const selectedRegisteredTotalCents = useMemo(
    () => selectedRegisteredPayments.reduce((sum, payment) => sum + payment.amountCents, 0),
    [selectedRegisteredPayments],
  );

  useEffect(() => {
    if (dataSource !== "REGISTERED") return;
    setPayments(selectedRegisteredPayments);
    setMonthlySalaryCents(selectedRegisteredPayments.reduce((sum, payment) => sum + payment.amountCents, 0));
  }, [dataSource, selectedRegisteredPayments]);

  function updatePayment(index: number, patch: Partial<VacationPayment>) {
    setPayments((current) => current.map((payment, currentIndex) => currentIndex === index ? { ...payment, ...patch } : payment));
  }

  function changePaymentCount(count: number) {
    setPaymentCount(count);
    setPayments(buildPayments(count, monthlySalaryCents));
  }

  const paymentValidation = useMemo(
    () => validatePaymentSum(monthlySalaryCents, payments),
    [monthlySalaryCents, payments],
  );

  const simulationInput = useMemo<VacationSimulationInput | null>(() => {
    if (!salaryInputMode || monthlySalaryCents <= 0 || !payments.length) return null;
    return {
      salaryInputMode,
      dataSource,
      monthlySalaryCents,
      grossSalaryCents: grossSalaryCents || undefined,
      dependents,
      pensionCents,
      fixedDiscountsCents,
      benefitsCents,
      payments,
      vacationStartDate,
      vacationDays,
      soldVacationDays,
      advanceThirteenth,
    };
  }, [
    advanceThirteenth,
    benefitsCents,
    dataSource,
    dependents,
    fixedDiscountsCents,
    grossSalaryCents,
    monthlySalaryCents,
    payments,
    pensionCents,
    salaryInputMode,
    soldVacationDays,
    vacationDays,
    vacationStartDate,
  ]);

  const result = useMemo(() => {
    if (!simulationInput) return null;
    try {
      return VacationCalculatorService.calculate(simulationInput);
    } catch {
      return null;
    }
  }, [simulationInput]);

  const vacationEndDate = vacationStartDate ? addDays(vacationStartDate, vacationDays - 1) : "";
  const returnDate = vacationEndDate ? addDays(vacationEndDate, 1) : "";
  const legalPaymentLimitDate = vacationStartDate ? addDays(vacationStartDate, -2) : "";
  const canGoToVacation = Boolean(salaryInputMode && monthlySalaryCents > 0 && payments.length);
  const canShowResult = Boolean(canGoToVacation && vacationStartDate && vacationDays >= 1 && vacationDays <= 30);

  return (
    <Stack spacing={3}>
      <Paper className="soft-card" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <BeachAccessIcon color="primary" />
              <Typography color="primary" fontWeight={900}>Calculadora de Férias</Typography>
            </Stack>
            <Typography variant="h3" fontWeight={950} letterSpacing={0}>Calculadora de Férias CLT</Typography>
            <Typography color="text.secondary" fontSize={18}>
              Simule quanto poderá receber nas férias e entenda como esse pagamento impacta seus próximos salários.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Alert severity="info" icon={<InfoOutlinedIcon />}>
        Esta calculadora apresenta apenas uma estimativa baseada nas informações fornecidas. Os valores podem variar conforme INSS,
        IRRF, convenção coletiva, médias salariais, descontos, fechamento da folha, benefícios e regras da empresa. Os resultados
        não substituem o cálculo oficial realizado pelo empregador.
      </Alert>

      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 ? (
        <Stack spacing={2.5}>
          <Typography variant="h5" fontWeight={950}>Como deseja informar seu salário?</Typography>
          <Grid container spacing={2}>
            {[
              ["NET", "Informar salário líquido", "Ideal para quem sabe quanto normalmente recebe na conta.", "Estimativa simplificada."],
              ["GROSS", "Informar salário bruto", "Ideal para quem deseja uma estimativa mais detalhada.", "Estimativa detalhada."],
            ].map(([mode, title, description, precision]) => (
              <Grid item xs={12} md={6} key={mode}>
                <Card
                  onClick={() => setSalaryInputMode(mode as SalaryInputMode)}
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor: salaryInputMode === mode ? "primary.main" : "divider",
                    bgcolor: salaryInputMode === mode ? "rgba(15,118,110,0.08)" : "var(--mr-card)",
                  }}
                >
                  <CardContent>
                    <Typography variant="h5" fontWeight={950}>{title}</Typography>
                    <Typography color="text.secondary">{description}</Typography>
                    <Chip sx={{ mt: 2 }} color={salaryInputMode === mode ? "primary" : "default"} label={precision} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {salaryInputMode ? (
            <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 3 }}>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Origem dos dados"
                  helperText="Você pode preencher manualmente ou apenas usar receitas recorrentes já cadastradas. Nada será alterado nos cadastros."
                  value={dataSource}
                  onChange={(event) => setDataSource(event.target.value as SalaryDataSource)}
                >
                  <MenuItem value="MANUAL">Manual</MenuItem>
                  <MenuItem value="REGISTERED">Usar salários cadastrados</MenuItem>
                </TextField>

                {dataSource === "REGISTERED" ? (
                  <Stack spacing={1.5}>
                    <Alert severity="info">
                      Selecione um ou mais salários cadastrados. Os valores selecionados serão somados e usados como o
                      <strong> salário líquido recebido em um mês</strong> para calcular as férias. Nada será alterado nos lançamentos.
                    </Alert>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          label="Mês"
                          value={registeredMonth}
                          onChange={(event) => setRegisteredMonth(event.target.value === "" ? "" : Number(event.target.value))}
                          helperText="Opcional. Use para ver salários de um mês específico."
                          fullWidth
                        >
                          {monthOptions.map((option) => (
                            <MenuItem key={String(option.value)} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Ano"
                          type="number"
                          value={registeredYear}
                          onChange={(event) => setRegisteredYear(Number(event.target.value || new Date().getFullYear()))}
                          helperText="Inicialmente vem filtrado pelo ano atual."
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "var(--mr-card-soft)",
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography fontWeight={950}>Soma dos salários selecionados</Typography>
                          <Typography color="text.secondary" variant="body2">
                            Esse será o salário líquido mensal usado na simulação.
                          </Typography>
                        </Box>
                        <Box textAlign={{ xs: "left", sm: "right" }}>
                          <Typography variant="h5" fontWeight={950} color="primary">
                            {formatCents(selectedRegisteredTotalCents)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={800}>
                            {selectedRegisteredIds.length} item(ns) selecionado(s)
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                    {loadingRegistered ? <Typography color="text.secondary">Carregando salários cadastrados...</Typography> : null}
                    {registeredError ? <Alert severity="error">{registeredError}</Alert> : null}
                    {!loadingRegistered && !registeredItems.length ? (
                      <EmptyState message="Nenhuma receita recorrente com aparência de salário foi encontrada." />
                    ) : null}
                    {registeredItems.map((item) => {
                      const checked = selectedRegisteredIds.includes(item.id);
                      const payment = financialItemToVacationPayment(item);
                      return (
                        <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={checked}
                                onChange={(event) => {
                                  setSelectedRegisteredItems((current) => {
                                    if (event.target.checked) return { ...current, [item.id]: item };
                                    const next = { ...current };
                                    delete next[item.id];
                                    return next;
                                  });
                                  setSelectedRegisteredIds((current) =>
                                    event.target.checked
                                      ? Array.from(new Set([...current, item.id]))
                                      : current.filter((id) => id !== item.id),
                                  );
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Typography fontWeight={900}>{payment.description}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatCents(payment.amountCents)} • Referência: {registeredSalaryReference(item)} • recebe no dia {payment.day} • {item.category}
                                </Typography>
                              </Box>
                            }
                          />
                        </Paper>
                      );
                    })}
                    {registeredTotal > registeredSalariesPerPage ? (
                      <TablePagination
                        component="div"
                        count={registeredTotal}
                        page={registeredPage}
                        rowsPerPage={registeredSalariesPerPage}
                        rowsPerPageOptions={[registeredSalariesPerPage]}
                        onPageChange={(_, page) => setRegisteredPage(page)}
                        labelRowsPerPage="Salários por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        sx={{
                          borderTop: "1px solid",
                          borderColor: "divider",
                          ".MuiTablePagination-toolbar": { px: 0 },
                        }}
                      />
                    ) : null}
                    <Button onClick={() => setDataSource("MANUAL")}>Preencher manualmente</Button>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <TextField
                      label={salaryInputMode === "NET" ? "Salário líquido mensal" : "Salário bruto mensal"}
                      placeholder="R$ 3.000,00"
                      helperText={salaryInputMode === "NET" ? "Informe quanto normalmente cai na sua conta no mês." : "Informe seu salário bruto antes dos descontos."}
                      value={centsToCurrencyInput(salaryInputMode === "NET" ? monthlySalaryCents : grossSalaryCents)}
                      onChange={(event) => {
                        const value = currencyToCents(event.target.value);
                        if (salaryInputMode === "NET") setMonthlySalaryCents(value);
                        else {
                          setGrossSalaryCents(value);
                          setMonthlySalaryCents(value);
                        }
                        setPayments(buildPayments(paymentCount, value));
                      }}
                    />

                    {salaryInputMode === "GROSS" ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                          <TextField label="Dependentes" type="number" helperText="Opcional." value={dependents} onChange={(event) => setDependents(Number(event.target.value || 0))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField label="Pensão" helperText="Opcional." value={centsToCurrencyInput(pensionCents)} onChange={(event) => setPensionCents(currencyToCents(event.target.value))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField label="Descontos fixos" helperText="Descontos mensais conhecidos." value={centsToCurrencyInput(fixedDiscountsCents)} onChange={(event) => setFixedDiscountsCents(currencyToCents(event.target.value))} fullWidth />
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <TextField label="Benefícios" helperText="Ex.: vale, plano, coparticipação." value={centsToCurrencyInput(benefitsCents)} onChange={(event) => setBenefitsCents(currencyToCents(event.target.value))} fullWidth />
                        </Grid>
                      </Grid>
                    ) : null}

                    <TextField
                      select
                      label="Quantidade de pagamentos"
                      helperText="Ex.: adiantamento no dia 15 e salário no dia 30."
                      value={paymentCount}
                      onChange={(event) => changePaymentCount(Number(event.target.value))}
                    >
                      {[1, 2, 3].map((count) => <MenuItem key={count} value={count}>{count} pagamento(s)</MenuItem>)}
                    </TextField>

                    <Grid container spacing={2}>
                      {payments.map((payment, index) => (
                        <Grid item xs={12} md={4} key={payment.id}>
                          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Stack spacing={1.5}>
                              <Typography fontWeight={950}>Pagamento {index + 1}</Typography>
                              <TextField label="Descrição" helperText="Ex.: Adiantamento, Salário." value={payment.description} onChange={(event) => updatePayment(index, { description: event.target.value })} />
                              <TextField label="Valor" helperText="Valor deste pagamento." value={centsToCurrencyInput(payment.amountCents)} onChange={(event) => updatePayment(index, { amountCents: currencyToCents(event.target.value) })} />
                              <TextField label="Dia do mês" type="number" helperText="Dia em que costuma receber." value={payment.day} onChange={(event) => updatePayment(index, { day: Number(event.target.value || 1) })} />
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    {!paymentValidation.matches ? (
                      <Alert severity="warning">
                        A soma dos pagamentos é {formatCents(paymentValidation.totalCents)}, diferente do salário mensal informado em {formatCents(Math.abs(paymentValidation.differenceCents))}. Você pode continuar, mas revise se fizer sentido.
                      </Alert>
                    ) : null}
                  </Stack>
                )}
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      ) : null}

      {activeStep === 1 ? (
        <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={950}>Dados das férias</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField label="Data de início" type="date" helperText="Primeiro dia das férias." InputLabelProps={{ shrink: true }} value={vacationStartDate} onChange={(event) => setVacationStartDate(event.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Quantidade de dias" type="number" helperText="Informe entre 1 e 30 dias." value={vacationDays} onChange={(event) => setVacationDays(Number(event.target.value || 1))} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Quantidade vendida" type="number" helperText="Opcional. Geralmente até 10 dias." value={soldVacationDays} onChange={(event) => setSoldVacationDays(Number(event.target.value || 0))} fullWidth />
              </Grid>
            </Grid>
            <FormControlLabel
              control={<Checkbox checked={advanceThirteenth} onChange={(event) => setAdvanceThirteenth(event.target.checked)} />}
              label="Antecipar décimo terceiro"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <DatePreviewCard label="Data final" date={vacationEndDate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePreviewCard label="Retorno previsto" date={returnDate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <DatePreviewCard label="Pagamento até" date={legalPaymentLimitDate} />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      ) : null}

      {activeStep === 2 ? (
        <Stack spacing={2.5}>
          {!result ? <Alert severity="warning">Revise os dados para gerar a simulação.</Alert> : null}
          {result ? (
            <>
              <Alert severity="warning">
                Você deverá receber aproximadamente <strong>{formatCents(result.estimatedNetVacationPaymentCents)}</strong> antes das férias. Desse valor, <strong>{formatCents(result.salaryAdvanceCents)}</strong> correspondem apenas à remuneração antecipada dos dias de férias. Seu ganho adicional estimado é de aproximadamente <strong>{formatCents(result.trulyAdditionalGrossCents)}</strong> antes dos descontos.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><StatCard label="Pagamento estimado das férias" value={result.estimatedNetVacationPaymentCents / 100} tone="income" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Parte dos dias de férias" value={result.vacationDaysAmountCents / 100} tone="neutral" helperText="Antecipação salarial" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Adicional de 1/3" value={result.constitutionalThirdCents / 100} tone="saving" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Valor realmente adicional" value={result.trulyAdditionalGrossCents / 100} tone="saving" helperText="Antes dos descontos" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Salário restante" value={result.remainingSalaryCents / 100} tone="balance" /></Grid>
                <Grid item xs={12} md={4}><StatCard label="Total recebido no período" value={result.totalReceivedInPeriodCents / 100} tone="income" /></Grid>
              </Grid>
              <Grid container spacing={2}>
                {result.timeline.map((item) => (
                  <Grid item xs={12} md={6} lg={4} key={item.id}>
                    <Paper className="soft-card" sx={{ p: 2, borderRadius: 3 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EventAvailableIcon color="primary" />
                          <Typography fontWeight={950}>{formatBrazilianDate(item.date)}</Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={950}>{item.title}</Typography>
                        {item.amountCents ? <Typography fontWeight={900}>{formatCents(item.amountCents)}</Typography> : null}
                        <Typography color="text.secondary">{item.reason}</Typography>
                        <Typography color="text.secondary" fontWeight={800}>{item.impact}</Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalculateIcon color="primary" />
                    <Typography fontWeight={950}>Como calculamos?</Typography>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={1}>
                    {result.calculationMemory.map((line) => <Typography key={line}>{line}</Typography>)}
                    <Typography color="text.secondary">{result.taxes.message}</Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <Stack spacing={1}>
                {result.warnings.map((warning) => <Alert key={warning} severity="info">{warning}</Alert>)}
              </Stack>
            </>
          ) : null}
        </Stack>
      ) : null}

      <Stack direction="row" justifyContent="space-between">
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((current) => current - 1)}>Voltar</Button>
        <Button
          variant="contained"
          disabled={(activeStep === 0 && !canGoToVacation) || (activeStep === 1 && !canShowResult) || activeStep === 2}
          onClick={() => setActiveStep((current) => Math.min(current + 1, 2))}
        >
          Próximo
        </Button>
      </Stack>
    </Stack>
  );
}
