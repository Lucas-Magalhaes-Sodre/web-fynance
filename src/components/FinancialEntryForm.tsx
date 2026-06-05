import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useState } from "react";
import type { FinancialEntryPayload } from "../api/financialControl";
import type {
  EntryType,
  FinancialCategory,
  FinancialItem,
  RecurrenceType,
} from "../types/financial";
import { financeColors, isoDate } from "../utils/format";

const recurrenceLabels: Record<Exclude<RecurrenceType, "NONE">, string> = {
  DAILY: "Diaria",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
  YEARLY: "Anual",
};

const weekDays = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terca-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sabado" },
  { value: 7, label: "Domingo" },
];

const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const monthOptions = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Marco" },
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

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);

type FormState = {
  name: string;
  description: string;
  amount: string;
  type: EntryType;
  category: string;
  date: string;
  dueDay: string;
  isFixed: boolean;
  recurrenceType: RecurrenceType;
  recurrenceStartMonth: string;
  recurrenceStartYear: string;
  recurrenceEndMonth: string;
  recurrenceEndYear: string;
};

type Props = {
  open: boolean;
  item?: FinancialItem | null;
  defaultType?: EntryType;
  defaultDate?: string;
  categories?: FinancialCategory[];
  onClose: () => void;
  onSubmit: (payload: FinancialEntryPayload) => Promise<void>;
};

function formatCurrencyInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function digitsToCurrency(value: string) {
  const cents = value.replace(/\D/g, "");
  if (!cents) return "";
  return formatCurrencyInput(Number(cents) / 100);
}

function currencyToNumber(value: string) {
  const cents = value.replace(/\D/g, "");
  return cents ? Number(cents) / 100 : 0;
}

export function FinancialEntryForm({
  open,
  item,
  defaultType = "EXPENSE",
  defaultDate = isoDate(),
  categories = [],
  onClose,
  onSubmit,
}: Props) {
  const initialDate = new Date(`${defaultDate}T00:00:00`);
  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    amount: "",
    type: defaultType,
    category: "",
    date: defaultDate,
    dueDay: "",
    isFixed: false,
    recurrenceType: "NONE",
    recurrenceStartMonth: String(initialDate.getMonth() + 1),
    recurrenceStartYear: String(initialDate.getFullYear()),
    recurrenceEndMonth: "12",
    recurrenceEndYear: String(initialDate.getFullYear()),
  });
  const [saving, setSaving] = useState(false);

  const isIncome = form.type === "INCOME";
  const modalTitle = item
    ? `Editar ${isIncome ? "Receita" : "Despesa"}`
    : `Adicionar ${isIncome ? "Receita" : "Despesa"}`;
  const accentColor = isIncome ? financeColors.income : financeColors.expense;
  const softColor = isIncome
    ? financeColors.incomeSoft
    : financeColors.expenseSoft;
  const amountLabel = isIncome ? "Valor recebido" : "Valor pago";
  const nameLabel = isIncome ? "Nome da receita" : "Nome da despesa";
  const categoryLabel = isIncome ? "Categoria" : "Categoria";
  const singleDateLabel = isIncome ? "Data do recebimento" : "Data da despesa";
  const availableCategories = categories.filter((category) => category.type === form.type);
  const selectedCategoryExists = availableCategories.some((category) => category.name === form.category);
  const invalidCustomRecurrenceRange =
    form.isFixed &&
    form.recurrenceType === "MONTHLY" &&
    Number(form.recurrenceEndYear) * 12 + Number(form.recurrenceEndMonth) <
      Number(form.recurrenceStartYear) * 12 + Number(form.recurrenceStartMonth);

  useEffect(() => {
    if (item) {
      const normalizedType = item.type.includes("INCOME")
        ? "INCOME"
        : "EXPENSE";
      setForm({
        name: item.name ?? item.title ?? "",
        description: item.description ?? "",
        amount: formatCurrencyInput(item.amount),
        type: normalizedType,
        category: item.category ?? "Outros",
        date: (item.paymentDate ?? item.dueDate ?? item.date).slice(0, 10),
        dueDay: item.dueDay ? String(item.dueDay) : "",
        isFixed: item.recurrenceType !== "NONE" || item.isFixed,
        recurrenceType:
          item.recurrenceType === "NONE" && item.isFixed
            ? "MONTHLY"
            : item.recurrenceType,
        recurrenceStartMonth: String(new Date(item.date).getMonth() + 1),
        recurrenceStartYear: String(new Date(item.date).getFullYear()),
        recurrenceEndMonth: "12",
        recurrenceEndYear: String(new Date(item.date).getFullYear()),
      });
      return;
    }

    const nextDefaultDate = new Date(`${defaultDate}T00:00:00`);
    setForm({
      name: "",
      description: "",
      amount: "",
      type: defaultType,
      category: "",
      date: defaultDate,
      dueDay: "",
      isFixed: false,
      recurrenceType: "NONE",
      recurrenceStartMonth: String(nextDefaultDate.getMonth() + 1),
      recurrenceStartYear: String(nextDefaultDate.getFullYear()),
      recurrenceEndMonth: "12",
      recurrenceEndYear: String(nextDefaultDate.getFullYear()),
    });
  }, [item, defaultType, defaultDate, open]);

  function updateRecurring(checked: boolean) {
    setForm({
      ...form,
      isFixed: checked,
      recurrenceType: checked
        ? form.recurrenceType === "NONE"
          ? "MONTHLY"
          : form.recurrenceType
        : "NONE",
      dueDay: checked ? form.dueDay : "",
    });
  }

  function updateRecurrenceType(recurrenceType: RecurrenceType) {
    setForm({
      ...form,
      recurrenceType,
      dueDay:
        recurrenceType === "WEEKLY" || recurrenceType === "MONTHLY"
          ? form.dueDay
          : "",
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = currencyToNumber(form.amount);
    const date = new Date(`${form.date}T00:00:00`);
    const isRecurring = form.isFixed && form.recurrenceType !== "NONE";
    const isRecurringExpense = isRecurring && !isIncome;

    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description || null,
        amount,
        type: form.type,
        category: form.category,
        date: form.date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dueDate:
          !isIncome && (!isRecurring || form.recurrenceType === "YEARLY")
            ? form.date
            : null,
        paymentDate: !isIncome && !isRecurring ? form.date : null,
        status: isIncome || !isRecurringExpense ? "PAGO" : "PENDENTE",
        dueDay: form.dueDay ? Number(form.dueDay) : null,
        isFixed: isRecurring,
        recurrenceType: isRecurring ? form.recurrenceType : "NONE",
        recurrenceGeneration:
          isRecurring && form.recurrenceType === "MONTHLY"
            ? {
                mode: "CUSTOM",
                startMonth: Number(form.recurrenceStartMonth),
                startYear: Number(form.recurrenceStartYear),
                endMonth: Number(form.recurrenceEndMonth),
                endYear: Number(form.recurrenceEndYear),
              }
            : undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 28px 80px rgba(15, 23, 42, 0.24)",
        },
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: softColor,
            borderBottom: "1px solid rgba(15,23,42,0.08)",
          }}
        >
          <Typography
            variant="overline"
            fontWeight={950}
            sx={{ color: accentColor }}
          >
            {isIncome ? "Entrada" : "Saida"}
          </Typography>
          <Typography variant="h5" fontWeight={950} letterSpacing="-0.03em">
            {modalTitle}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Stack
          component="form"
          id="financial-entry-form"
          spacing={2.25}
          onSubmit={handleSubmit}
          py={2}
        >
          <TextField
            autoFocus
            select
            label={categoryLabel}
            required
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            helperText="Configure as categorias no menu Categorias."
          >
            {availableCategories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    width={12}
                    height={12}
                    borderRadius="50%"
                    sx={{ bgcolor: category.color }}
                  />
                  {category.name}
                </Box>
              </MenuItem>
            ))}
            {form.category && !selectedCategoryExists ? (
              <MenuItem value={form.category}>{form.category}</MenuItem>
            ) : null}
          </TextField>

          <TextField
            label={nameLabel}
            required
            value={form.name}
            onChange={(event) =>
              setForm({ ...form, name: event.target.value })
            }
            helperText={
              isIncome
                ? "Ex.: salario da empresa, cliente X, rendimento"
                : "Ex.: Riachuelo, Itau, aluguel, internet"
            }
          />

          <TextField
            label={amountLabel}
            required
            inputMode="decimal"
            value={form.amount}
            onChange={(event) =>
              setForm({ ...form, amount: digitsToCurrency(event.target.value) })
            }
            onFocus={(event) => event.target.select()}
          />

          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "none",
              bgcolor: "#F8FAFC",
            }}
          >
            <Stack spacing={2}>
              <FormControlLabel
                sx={{ m: 0, justifyContent: "space-between" }}
                label={
                  <Box display={"flex"}>
                    <Typography fontWeight={900}>Recorrente: </Typography>
                    <Typography
                      fontWeight={900}
                      ml={1}
                      color={form.isFixed ? "success" : "error"}
                    >{`${form.isFixed ? "sim" : "não"}`}</Typography>
                  </Box>
                }
                labelPlacement="start"
                control={
                  <Switch
                    color={isIncome ? "error" : "success"}
                    checked={form.isFixed}
                    onChange={(event) => updateRecurring(event.target.checked)}
                  />
                }
              />

              {form.isFixed ? (
                <>
                  <TextField
                    select
                    label="Recorrencia"
                    value={
                      form.recurrenceType === "NONE"
                        ? "MONTHLY"
                        : form.recurrenceType
                    }
                    onChange={(event) =>
                      updateRecurrenceType(event.target.value as RecurrenceType)
                    }
                  >
                    {Object.entries(recurrenceLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {form.recurrenceType === "WEEKLY" ? (
                    <TextField
                      select
                      label={
                        isIncome
                          ? "Dia da semana do recebimento"
                          : "Dia da semana da despesa"
                      }
                      required
                      value={form.dueDay}
                      onChange={(event) =>
                        setForm({ ...form, dueDay: event.target.value })
                      }
                    >
                      {weekDays.map((day) => (
                        <MenuItem key={day.value} value={day.value}>
                          {day.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : null}

                  {form.recurrenceType === "MONTHLY" ? (
                    <>
                      <TextField
                        select
                        label={
                          isIncome
                            ? "Dia do mes do recebimento"
                            : "Dia do mes da despesa"
                        }
                        required
                        value={form.dueDay}
                        onChange={(event) =>
                          setForm({ ...form, dueDay: event.target.value })
                        }
                      >
                        {monthDays.map((day) => (
                          <MenuItem key={day} value={day}>
                            Dia {day}
                          </MenuItem>
                        ))}
                      </TextField>

                      {!item ? (
                        <>
                          <Typography variant="caption" color="text.secondary" fontWeight={900}>
                            Quando comeca:
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                              select
                              label="Mes inicial"
                              value={form.recurrenceStartMonth}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceStartMonth: event.target.value })
                              }
                              sx={{ flex: 1 }}
                            >
                              {monthOptions.map((monthItem) => (
                                <MenuItem key={monthItem.value} value={monthItem.value}>
                                  {monthItem.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label="Ano inicial"
                              value={form.recurrenceStartYear}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceStartYear: event.target.value })
                              }
                              sx={{ flex: 1 }}
                            >
                              {yearOptions.map((year) => (
                                <MenuItem key={year} value={year}>
                                  {year}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>

                          <Typography variant="caption" color="text.secondary" fontWeight={900}>
                            Quando termina:
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                              select
                              label="Mes final"
                              value={form.recurrenceEndMonth}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceEndMonth: event.target.value })
                              }
                              sx={{ flex: 1 }}
                              error={invalidCustomRecurrenceRange}
                            >
                              {monthOptions.map((monthItem) => (
                                <MenuItem key={monthItem.value} value={monthItem.value}>
                                  {monthItem.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label="Ano final"
                              value={form.recurrenceEndYear}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceEndYear: event.target.value })
                              }
                              sx={{ flex: 1 }}
                              error={invalidCustomRecurrenceRange}
                              helperText={invalidCustomRecurrenceRange ? "O fim precisa ser depois do inicio." : " "}
                            >
                              {yearOptions.map((year) => (
                                <MenuItem key={year} value={year}>
                                  {year}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>
                        </>
                      ) : null}
                    </>
                  ) : null}

                  {form.recurrenceType === "YEARLY" ? (
                    <TextField
                      label={
                        isIncome
                          ? "Data anual do recebimento"
                          : "Data anual da despesa"
                      }
                      type="date"
                      required
                      InputLabelProps={{ shrink: true }}
                      value={form.date}
                      onChange={(event) =>
                        setForm({ ...form, date: event.target.value })
                      }
                    />
                  ) : null}
                </>
              ) : (
                <TextField
                  label={singleDateLabel}
                  type="date"
                  required
                  InputLabelProps={{ shrink: true }}
                  value={form.date}
                  onChange={(event) =>
                    setForm({ ...form, date: event.target.value })
                  }
                />
              )}
            </Stack>
          </Paper>

          <TextField
            label="Observacao opcional"
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          form="financial-entry-form"
          variant="contained"
          disabled={
            saving ||
            currencyToNumber(form.amount) <= 0 ||
            !form.name.trim() ||
            !form.category.trim() ||
            invalidCustomRecurrenceRange
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
