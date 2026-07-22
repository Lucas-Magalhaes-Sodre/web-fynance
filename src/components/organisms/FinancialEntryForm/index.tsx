import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useState } from "react";
import type { FinancialEntryPayload } from "@/services/financialControl";
import type {
  EntryType,
  FinancialCategory,
  FinancialItem,
  RecurrenceType,
} from "@/interfaces/financial";
import { financeColors, isoDate } from "@/utils/format";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import { monthsByLanguage, translateCategoryName } from "@/i18n/display";

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
  const { language, t } = usePreferences();
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
    ? isIncome ? t("editIncome") : t("editExpenseRecord")
    : isIncome ? t("addIncome") : t("addExpenseRecord");
  const accentColor = isIncome ? financeColors.income : financeColors.expense;
  const softColor = isIncome
    ? financeColors.incomeSoft
    : financeColors.expenseSoft;
  const amountLabel = isIncome ? t("receivedValue") : t("paidValue");
  const nameLabel = isIncome ? t("incomeName") : t("expenseRecordName");
  const categoryLabel = t("category");
  const singleDateLabel = isIncome ? t("receiptDate") : t("expenseDate");
  const recurrenceLabelItems: Record<Exclude<RecurrenceType, "NONE">, string> = {
    DAILY: t("daily"),
    WEEKLY: t("weekly"),
    MONTHLY: t("monthly"),
    YEARLY: t("yearly"),
  };
  const weekDayItems = [
    { value: 1, label: t("monday") },
    { value: 2, label: t("tuesday") },
    { value: 3, label: t("wednesday") },
    { value: 4, label: t("thursday") },
    { value: 5, label: t("friday") },
    { value: 6, label: t("saturday") },
    { value: 7, label: t("sunday") },
  ];
  const monthItems = monthsByLanguage[language].map((label, index) => ({ value: index + 1, label }));
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
    if (saving) return;
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
    <AppDialog
      open={open}
      onClose={onClose}
      eyebrow={isIncome ? t("incomeEyebrow") : t("expenseEyebrow")}
      title={modalTitle}
      titleAccent={accentColor}
      actions={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <LoadingActionButton
            type="submit"
            form="financial-entry-form"
            variant="contained"
            disabled={
              currencyToNumber(form.amount) <= 0 ||
              !form.name.trim() ||
              !form.category.trim() ||
              invalidCustomRecurrenceRange
            }
            loading={saving}
            loadingLabel={t("saving")}
          >
            {t("save")}
          </LoadingActionButton>
        </>
      }
    >
        <S.FormStack
          component="form"
          id="financial-entry-form"
          spacing={2.25}
          onSubmit={handleSubmit}
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
            helperText={t("configureCategories")}
          >
            {availableCategories.map((category) => (
              <MenuItem key={category.id} value={category.name}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    width={12}
                    height={12}
                    borderRadius="50%"
                    bgcolor={category.color}
                  />
                  {translateCategoryName(category.name, language)}
                </Box>
              </MenuItem>
            ))}
            {form.category && !selectedCategoryExists ? (
              <MenuItem value={form.category}>{translateCategoryName(form.category, language)}</MenuItem>
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
                ? t("incomeExample")
                : t("expenseExample")
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

          <S.HighlightPanel
            $panelBorderColor="rgba(15,23,42,0.08)"
            $panelBackground={softColor || "#F8FAFC"}
          >
            <Stack spacing={2}>
              <S.SplitFormControlLabel
                label={
                  <Box display={"flex"}>
                    <Typography fontWeight={900}>{t("recurring")}: </Typography>
                    <Typography
                      fontWeight={900}
                      ml={1}
                      color={form.isFixed ? "success" : "error"}
                    >{form.isFixed ? t("yes") : t("no")}</Typography>
                  </Box>
                }
                labelPlacement="start"
                control={
                  <Switch
                    color="success"
                    checked={form.isFixed}
                    onChange={(event) => updateRecurring(event.target.checked)}
                  />
                }
              />

              {form.isFixed ? (
                <>
                  <TextField
                    select
                    label={t("recurrence")}
                    value={
                      form.recurrenceType === "NONE"
                        ? "MONTHLY"
                        : form.recurrenceType
                    }
                    onChange={(event) =>
                      updateRecurrenceType(event.target.value as RecurrenceType)
                    }
                  >
                    {Object.entries(recurrenceLabelItems).map(([value, label]) => (
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
                          ? t("incomeWeekDay")
                          : t("expenseWeekDay")
                      }
                      required
                      value={form.dueDay}
                      onChange={(event) =>
                        setForm({ ...form, dueDay: event.target.value })
                      }
                    >
                      {weekDayItems.map((day) => (
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
                            ? t("incomeMonthDay")
                            : t("expenseMonthDay")
                        }
                        required
                        value={form.dueDay}
                        onChange={(event) =>
                          setForm({ ...form, dueDay: event.target.value })
                        }
                      >
                        {monthDays.map((day) => (
                          <MenuItem key={day} value={day}>
                            {t("dayNumber").replace("{day}", String(day))}
                          </MenuItem>
                        ))}
                      </TextField>

                      {!item ? (
                        <>
                          <Typography variant="caption" color="text.secondary" fontWeight={900}>
                            {t("whenStarts")}
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                              select
                              label={t("startMonth")}
                              value={form.recurrenceStartMonth}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceStartMonth: event.target.value })
                              }
                              fullWidth
                            >
                              {monthItems.map((monthItem) => (
                                <MenuItem key={monthItem.value} value={monthItem.value}>
                                  {monthItem.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label={t("startYear")}
                              value={form.recurrenceStartYear}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceStartYear: event.target.value })
                              }
                              fullWidth
                            >
                              {yearOptions.map((year) => (
                                <MenuItem key={year} value={year}>
                                  {year}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>

                          <Typography variant="caption" color="text.secondary" fontWeight={900}>
                            {t("whenEnds")}
                          </Typography>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                            <TextField
                              select
                              label={t("endMonth")}
                              value={form.recurrenceEndMonth}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceEndMonth: event.target.value })
                              }
                              error={invalidCustomRecurrenceRange}
                              fullWidth
                            >
                              {monthItems.map((monthItem) => (
                                <MenuItem key={monthItem.value} value={monthItem.value}>
                                  {monthItem.label}
                                </MenuItem>
                              ))}
                            </TextField>
                            <TextField
                              select
                              label={t("endYear")}
                              value={form.recurrenceEndYear}
                              onChange={(event) =>
                                setForm({ ...form, recurrenceEndYear: event.target.value })
                              }
                              error={invalidCustomRecurrenceRange}
                              helperText={invalidCustomRecurrenceRange ? t("endAfterStart") : " "}
                              fullWidth
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
                          ? t("annualIncomeDate")
                          : t("annualExpenseDate")
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
          </S.HighlightPanel>

          <TextField
            label={t("optionalNote")}
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
          />
        </S.FormStack>
    </AppDialog>
  );
}
