import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type {
  FinancialCategory,
  FinancialGoal,
  RecurrenceType,
  Saving,
  SavingTransferDirection,
} from "@/interfaces/financial";
import { currencyToNumber, digitsToCurrency, financeColors, formatMoney } from "@/utils/format";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import { monthsByLanguage, translateCategoryName } from "@/i18n/display";

export type SavingAction = "REGISTER" | SavingTransferDirection;

export type SavingMovementFormState = {
  action: SavingAction;
  title: string;
  category: string;
  color: string;
  description: string;
  amount: string;
  date: string;
  dueDay: string;
  isFixed: boolean;
  recurrenceType: RecurrenceType;
  recurrenceStartMonth: string;
  recurrenceStartYear: string;
  recurrenceEndMonth: string;
  recurrenceEndYear: string;
  goalId: string;
  hasYield: boolean;
  yieldRateMonthly: string;
};

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

type SavingMovementDialogProps = {
  open: boolean;
  form: SavingMovementFormState;
  goals: FinancialGoal[];
  categories: FinancialCategory[];
  availableSavings?: Saving[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: SavingMovementFormState) => void;
};

export function SavingMovementDialog({
  open,
  form,
  goals,
  categories,
  availableSavings = [],
  saving,
  onClose,
  onSave,
  onFormChange,
}: SavingMovementDialogProps) {
  const { language, t } = usePreferences();
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

  function updateForm(nextForm: Partial<SavingMovementFormState>) {
    onFormChange({ ...form, ...nextForm });
  }

  function updateRecurring(checked: boolean) {
    updateForm({
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
    updateForm({
      recurrenceType,
      dueDay:
        recurrenceType === "WEEKLY" || recurrenceType === "MONTHLY"
          ? form.dueDay
          : "",
    });
  }

  const isWithdraw = form.action === "WITHDRAW_TO_BALANCE";
  const investmentCategories = categories.filter((category) => category.type === "INVESTMENT");
  const withdrawOptions = Object.entries(
    availableSavings.reduce<Record<string, number>>((acc, saving) => {
      const key = `${saving.category}|||${saving.title}`;
      acc[key] = (acc[key] ?? 0) + saving.amount;
      return acc;
    }, {}),
  )
    .map(([key, amount]) => {
      const [category, title] = key.split("|||");
      return { category, title, amount };
    })
    .filter((option) => option.amount > 0)
    .sort((a, b) => a.category.localeCompare(b.category, "pt-BR") || a.title.localeCompare(b.title, "pt-BR"));
  const withdrawCategories = Array.from(new Set(withdrawOptions.map((option) => option.category)));
  const withdrawSubitems = withdrawOptions.filter((option) => option.category === form.category);
  const selectedWithdrawBalance =
    withdrawOptions.find((option) => option.category === form.category && option.title === form.title)?.amount ?? 0;
  const requestedAmount = currencyToNumber(form.amount) || 0;
  const balanceAfterWithdraw = selectedWithdrawBalance - requestedAmount;
  const invalidCustomRecurrenceRange =
    !isWithdraw &&
    form.isFixed &&
    form.recurrenceType === "MONTHLY" &&
    Number(form.recurrenceEndYear) * 12 + Number(form.recurrenceEndMonth) <
      Number(form.recurrenceStartYear) * 12 + Number(form.recurrenceStartMonth);
  const invalidWithdraw =
    isWithdraw &&
    (!form.title.trim() || requestedAmount <= 0 || requestedAmount > selectedWithdrawBalance);
  const selectedGoal = goals.find((goal) => goal.id === form.goalId);

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      eyebrow={t("savings")}
      title={isWithdraw ? t("withdrawSavingTitle") : t("addSaving")}
      titleAccent={isWithdraw ? financeColors.negative : financeColors.saving}
      actions={
        <>
          <Button onClick={onClose}>{t("cancel")}</Button>
          <LoadingActionButton
            variant="contained"
            disabled={
              !form.title.trim() ||
              !form.category.trim() ||
              currencyToNumber(form.amount) <= 0 ||
              invalidCustomRecurrenceRange ||
              invalidWithdraw
            }
            onClick={onSave}
            color={isWithdraw ? "error" : "warning"}
            loading={saving}
            loadingLabel={t("saving")}
          >
            {isWithdraw ? t("confirmWithdraw") : t("save")}
          </LoadingActionButton>
        </>
      }
    >
      <S.FormStack spacing={2}>
        <Typography color="text.secondary">
          {isWithdraw
            ? t("withdrawSavingText")
            : t("addSavingText")}
        </Typography>

        <TextField
          select
          label={t("category")}
          required
          value={form.category}
          onChange={(event) => {
            const category = event.target.value;
            updateForm({
              category,
              title: isWithdraw
                ? withdrawOptions.find((option) => option.category === category)?.title ?? ""
                : form.title,
            });
          }}
        >
          {isWithdraw
            ? withdrawCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {translateCategoryName(category, language)}
                </MenuItem>
              ))
            : investmentCategories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {translateCategoryName(category.name, language)}
                </MenuItem>
              ))}
          {!isWithdraw && !investmentCategories.length ? <MenuItem value="Outros">{translateCategoryName("Outros", language)}</MenuItem> : null}
          {!isWithdraw && form.category && !investmentCategories.some((category) => category.name === form.category) ? (
            <MenuItem value={form.category}>{translateCategoryName(form.category, language)}</MenuItem>
          ) : null}
        </TextField>

        {isWithdraw ? (
          <TextField
            select
            autoFocus
            label={t("subitemCategory")}
            required
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            disabled={!form.category || !withdrawSubitems.length}
          >
            {withdrawSubitems.map((option) => (
              <MenuItem key={`${option.category}:${option.title}`} value={option.title}>
                {option.title} - {formatMoney(option.amount)}
              </MenuItem>
            ))}
          </TextField>
        ) : (
          <TextField
            autoFocus
            label={t("savingName")}
            required
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
          />
        )}

        <TextField
          label={isWithdraw ? t("amountToWithdraw") : t("value")}
          required
          value={form.amount}
          onChange={(event) => updateForm({ amount: digitsToCurrency(event.target.value) })}
        />

        {isWithdraw ? (
          <>
            <TextField
              label={t("date")}
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={form.date}
              onChange={(event) => updateForm({ date: event.target.value })}
              sx={{ "& input": { py: 1.65 } }}
            />
            <TextField
              label={t("optionalNote")}
              multiline
              minRows={2}
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
            />
            <S.HighlightPanel
              $panelBorderColor="rgba(220,38,38,0.18)"
              $panelBackground={financeColors.negativeSoft}
            >
              <Stack spacing={1.25}>
                <Typography fontWeight={950}>{t("preview")}</Typography>
                <Divider />
                <Typography>{t("availableBalance")}: {formatMoney(selectedWithdrawBalance)}</Typography>
                <Typography>{t("requestedAmount")}: {formatMoney(requestedAmount)}</Typography>
                <Typography color={balanceAfterWithdraw < 0 ? financeColors.negative : "text.primary"}>
                  {t("balanceAfterWithdraw")}: {formatMoney(Math.max(balanceAfterWithdraw, 0))}
                </Typography>
                <Typography color={financeColors.income} fontWeight={900}>
                  {t("incomeCreatedCurrentMonth")}: {formatMoney(requestedAmount)}
                </Typography>
              </Stack>
            </S.HighlightPanel>
          </>
        ) : (
          <>
            <S.HighlightPanel
              $panelBorderColor="rgba(15,23,42,0.08)"
              $panelBackground={financeColors.savingSoft}
            >
              <Stack spacing={2}>
                <S.SplitFormControlLabel
                  label={
                    <Box display="flex">
                      <Typography fontWeight={900}>{t("recurring")}: </Typography>
                      <Typography fontWeight={900} ml={1} color={form.isFixed ? "success" : "error"}>
                        {form.isFixed ? t("yes") : t("no")}
                      </Typography>
                    </Box>
                  }
                  labelPlacement="start"
                  control={
                    <Switch
                      color="warning"
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
                      value={form.recurrenceType === "NONE" ? "MONTHLY" : form.recurrenceType}
                      onChange={(event) => updateRecurrenceType(event.target.value as RecurrenceType)}
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
                        label={t("savingWeekDay")}
                        required
                        value={form.dueDay}
                        onChange={(event) => updateForm({ dueDay: event.target.value })}
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
                        label={t("savingMonthDay")}
                          required
                          value={form.dueDay}
                          onChange={(event) => updateForm({ dueDay: event.target.value })}
                        >
                          {monthDays.map((day) => (
                            <MenuItem key={day} value={day}>
                              {t("dayNumber").replace("{day}", String(day))}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Typography variant="caption" color="text.secondary" fontWeight={900}>
                          {t("whenStarts")}
                        </Typography>
                        <S.ColorFieldStack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <TextField
                            select
                            label={t("startMonth")}
                            value={form.recurrenceStartMonth}
                            onChange={(event) => updateForm({ recurrenceStartMonth: event.target.value })}
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
                            onChange={(event) => updateForm({ recurrenceStartYear: event.target.value })}
                            fullWidth
                          >
                            {yearOptions.map((year) => (
                              <MenuItem key={year} value={year}>
                                {year}
                              </MenuItem>
                            ))}
                          </TextField>
                        </S.ColorFieldStack>

                        <Typography variant="caption" color="text.secondary" fontWeight={900}>
                          {t("whenEnds")}
                        </Typography>
                        <S.ColorFieldStack direction={{ xs: "column", sm: "row" }} spacing={2}>
                          <TextField
                            select
                            label={t("endMonth")}
                            value={form.recurrenceEndMonth}
                            onChange={(event) => updateForm({ recurrenceEndMonth: event.target.value })}
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
                            onChange={(event) => updateForm({ recurrenceEndYear: event.target.value })}
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
                        </S.ColorFieldStack>
                      </>
                    ) : null}

                    {form.recurrenceType === "YEARLY" ? (
                      <TextField
                        label={t("annualSavingDate")}
                        type="date"
                        required
                        InputLabelProps={{ shrink: true }}
                        value={form.date}
                        onChange={(event) => updateForm({ date: event.target.value })}
                        sx={{ "& input": { py: 1.65 } }}
                      />
                    ) : null}
                  </>
                ) : (
                  <TextField
                    label={t("savingDate")}
                    type="date"
                    required
                    InputLabelProps={{ shrink: true }}
                    value={form.date}
                    onChange={(event) => updateForm({ date: event.target.value })}
                    sx={{ "& input": { py: 1.65 } }}
                  />
                )}
              </Stack>
            </S.HighlightPanel>
            <TextField
              select
              label={t("linkedGoal")}
              value={form.goalId}
              onChange={(event) => {
                const goal = goals.find((item) => item.id === event.target.value);
                updateForm({
                  goalId: event.target.value,
                  hasYield: goal?.hasYield ?? form.hasYield,
                  yieldRateMonthly: goal?.hasYield
                    ? String(goal.yieldRateMonthly ?? 0)
                    : form.yieldRateMonthly,
                });
              }}
            >
              <MenuItem value="">{t("noGoalShort")}</MenuItem>
              {goals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.title}
                </MenuItem>
              ))}
            </TextField>
            <S.HighlightPanel
              $panelBorderColor="rgba(15,118,110,0.16)"
              $panelBackground="rgba(240,253,250,0.72)"
            >
              <Stack spacing={2}>
                <S.SplitFormControlLabel
                  label={
                    <Box display="flex">
                      <Typography fontWeight={900}>{t("compoundYield")}: </Typography>
                      <Typography fontWeight={900} ml={1} color={form.hasYield ? "success" : "text.secondary"}>
                        {form.hasYield ? t("yes") : t("no")}
                      </Typography>
                    </Box>
                  }
                  labelPlacement="start"
                  control={
                    <Switch
                      color="success"
                      checked={form.hasYield}
                      onChange={(event) =>
                        updateForm({
                          hasYield: event.target.checked,
                          yieldRateMonthly: event.target.checked
                            ? form.yieldRateMonthly || String(selectedGoal?.yieldRateMonthly ?? "")
                            : "",
                        })
                      }
                    />
                  }
                />
                {form.hasYield ? (
                  <TextField
                    label={`${t("monthlyYield")} (%)`}
                    type="number"
                    inputProps={{ min: 0, step: "0.01" }}
                    value={form.yieldRateMonthly}
                    onChange={(event) => updateForm({ yieldRateMonthly: event.target.value })}
                    helperText={selectedGoal?.hasYield ? t("goalRateAutoFilled") : t("yieldExample")}
                  />
                ) : null}
              </Stack>
            </S.HighlightPanel>
            <TextField
              label={t("optionalNote")}
              multiline
              minRows={2}
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
            />
          </>
        )}
      </S.FormStack>
    </AppDialog>
  );
}
