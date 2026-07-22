import AddIcon from "@mui/icons-material/Add";
import CakeIcon from "@mui/icons-material/Cake";
import CelebrationIcon from "@mui/icons-material/Celebration";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import PaidIcon from "@mui/icons-material/Paid";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { AppDialog } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { PageHelpButton } from "@/components/molecules/PageHelpButton";
import { StatCard } from "@/components/molecules/StatCard";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FinancialRemindersDialog } from "@/components/organisms/FinancialRemindersDialog";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { FinancialItem } from "@/interfaces/financial";
import {
  createEntry,
  deleteEntry,
  listFinancialCategories,
  listFinancialItems,
  updateEntry,
  type FinancialEntryPayload,
} from "@/services/financialControl";
import { currencyToNumber, digitsToCurrency, financeColors, formatMoney } from "@/utils/format";
import { realCurrentYear } from "@/modules/financial-control/components/constants";
import { monthsByLanguage } from "@/i18n/display";

const birthdayCategory = "Aniversários";
const birthdayColor = "#EC4899";

type BirthdayForm = {
  personName: string;
  amount: string;
  date: string;
  description: string;
};

const initialForm: BirthdayForm = {
  personName: "",
  amount: "",
  date: "",
  description: "",
};

function yearDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function birthdayDateParts(date: string) {
  const [yearPart, monthPart, dayPart] = date.slice(0, 10).split("-").map(Number);
  return {
    day: dayPart,
    month: monthPart,
    year: yearPart,
  };
}

function formatBirthdayDate(date: string) {
  const parts = birthdayDateParts(date);
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

export function BirthdaysPage() {
  const { language, t } = usePreferences();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const [year, setYear] = useState(realCurrentYear);
  const [birthdays, setBirthdays] = useState<FinancialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBirthday, setEditingBirthday] = useState<FinancialItem | null>(null);
  const [reminderItem, setReminderItem] = useState<FinancialItem | null>(null);
  const [form, setForm] = useState<BirthdayForm>(initialForm);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const months = monthsByLanguage[language];
  const sortedBirthdays = useMemo(
    () => [...birthdays].sort((a, b) => {
      const first = birthdayDateParts(a.date);
      const second = birthdayDateParts(b.date);
      return new Date(first.year, first.month - 1, first.day).getTime() - new Date(second.year, second.month - 1, second.day).getTime();
    }),
    [birthdays],
  );
  const totalPlanned = useMemo(() => birthdays.reduce((sum, item) => sum + item.amount, 0), [birthdays]);
  const nextBirthday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sortedBirthdays.find((item) => {
      const parts = birthdayDateParts(item.date);
      return new Date(parts.year, parts.month - 1, parts.day) >= today;
    }) ?? sortedBirthdays[0] ?? null;
  }, [sortedBirthdays]);
  const groupedByMonth = useMemo(() => {
    return months.map((label, index) => ({
      label,
      month: index + 1,
      items: sortedBirthdays.filter((item) => item.month === index + 1),
    }));
  }, [months, sortedBirthdays]);
  const selectedMonthData = useMemo(
    () => groupedByMonth.find((month) => month.month === selectedMonth) ?? null,
    [groupedByMonth, selectedMonth],
  );
  const selectedMonthCalendarDays = useMemo(() => {
    if (!selectedMonth) return [];
    const firstDay = new Date(year, selectedMonth - 1, 1).getDay();
    const daysInMonth = new Date(year, selectedMonth, 0).getDate();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [selectedMonth, year]);

  async function loadBirthdays() {
    setLoading(true);
    setError("");
    try {
      await listFinancialCategories({ type: "EXPENSE" });
      const items = await listFinancialItems({
        type: "EXPENSE",
        startDate: yearDate(year, 1, 1),
        endDate: yearDate(year, 12, 31),
      });
      setBirthdays(items.filter((item) => normalize(item.category) === normalize(birthdayCategory)));
    } catch {
      setError(t("birthdaysLoadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBirthdays();
  }, [year]);

  function openCreate() {
    setEditingBirthday(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEdit(item: FinancialItem) {
    setEditingBirthday(item);
    setForm({
      personName: item.name ?? item.title,
      amount: formatMoney(item.amount),
      date: item.date.slice(0, 10),
      description: item.description ?? "",
    });
    setFormOpen(true);
  }

  function birthdayPayload(): FinancialEntryPayload {
    const amount = currencyToNumber(form.amount);
    const date = form.date;
    const parts = birthdayDateParts(date);
    return {
      name: form.personName.trim(),
      description: form.description.trim() || null,
      amount,
      type: "EXPENSE",
      category: birthdayCategory,
      date,
      month: parts.month,
      year: parts.year,
      dueDate: date,
      paymentDate: null,
      status: "PENDENTE",
      dueDay: parts.day,
      isFixed: true,
      recurrenceType: "YEARLY",
    };
  }

  async function saveBirthday(event?: FormEvent) {
    event?.preventDefault();
    if (!form.personName.trim() || !form.amount || !form.date) return;
    setSaving(true);
    setError("");
    try {
      if (editingBirthday) await updateEntry(editingBirthday.id, birthdayPayload());
      else await createEntry(birthdayPayload());
      setFormOpen(false);
      await loadBirthdays();
    } catch {
      setError(t("birthdaySaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function removeBirthday(item: FinancialItem) {
    const confirmed = await confirm({
      title: t("deleteBirthday"),
      description: t("deleteBirthdayConfirm").replace("{name}", item.name ?? item.title),
      confirmLabel: t("delete"),
      cancelLabel: t("cancel"),
      tone: "danger",
    });
    if (!confirmed) return;
    await deleteEntry(item.id);
    await loadBirthdays();
  }

  return (
    <Stack spacing={3}>
      <Paper
        className="glass-card"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(236,72,153,0.14), rgba(251,191,36,0.12) 48%, rgba(45,212,191,0.08))",
            pointerEvents: "none",
          }}
        />
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} position="relative">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <CakeIcon sx={{ color: birthdayColor }} />
              <Typography color="primary" fontWeight={900}>
                {t("birthdaysEyebrow")}
              </Typography>
              <PageHelpButton title={t("birthdaysHelpTitle")}>
                <Typography color="text.secondary">{t("birthdaysHelpText1")}</Typography>
                <Typography color="text.secondary">{t("birthdaysHelpText2")}</Typography>
                <Typography color="text.secondary">{t("birthdaysHelpText3")}</Typography>
              </PageHelpButton>
            </Stack>
            <Typography variant="h3" fontWeight={950} letterSpacing={0}>
              {t("birthdaysTitle")}
            </Typography>
            <Typography color="text.secondary" fontSize={17}>
              {t("birthdaysSubtitle")}
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={openCreate}
            sx={{ alignSelf: { xs: "stretch", md: "center" }, minHeight: 48, borderRadius: 2.5, fontWeight: 950 }}
          >
            {t("newBirthday")}
          </Button>
        </Stack>
      </Paper>

      <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
          <TextField
            select
            size="small"
            label={t("year")}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            sx={{ minWidth: 150 }}
          >
            {Array.from({ length: 7 }, (_, index) => realCurrentYear - 2 + index).map((yearOption) => (
              <MenuItem key={yearOption} value={yearOption}>
                {yearOption}
              </MenuItem>
            ))}
          </TextField>
          <Chip
            icon={<CelebrationIcon />}
            label={t("birthdayCategoryProtected")}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" }, fontWeight: 850, color: birthdayColor, borderColor: `${birthdayColor}55` }}
            variant="outlined"
          />
        </Stack>
      </Paper>

      {loading ? (
        <Stack spacing={2}>
          <Grid container spacing={2}>
            {[0, 1, 2].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Skeleton variant="rounded" height={86} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rounded" height={260} />
        </Stack>
      ) : null}

      {error ? <EmptyState message={error} /> : null}

      {!loading && !error ? (
        <>
          <Grid container spacing={2} sx={{ mx: 0, width: "100%" }}>
            <Grid item xs={12} md={4}>
              <Paper className="soft-card" sx={{ p: 2, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                <Box sx={{ position: "absolute", right: -18, top: -22, width: 82, height: 82, borderRadius: "50%", bgcolor: `${birthdayColor}16` }} />
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  {t("birthdaysRegistered")}
                </Typography>
                <Typography variant="h5" fontWeight={900} color="text.primary">
                  {birthdays.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label={t("birthdayBudget")} value={totalPlanned} tone="expense" />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label={t("nextBirthdayValue")} value={nextBirthday?.amount ?? 0} tone="saving" helperText={nextBirthday?.name ?? t("noBirthday")} />
            </Grid>
          </Grid>

          <Paper className="soft-card" sx={{ p: 2.5, borderRadius: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <EventIcon sx={{ color: birthdayColor }} />
              <Typography variant="h6" fontWeight={950}>
                {t("birthdayCalendar")}
              </Typography>
            </Stack>
            <Grid container spacing={1.5}>
              {groupedByMonth.map((month) => {
                const visibleItems = month.items.slice(0, 1);
                const hiddenCount = Math.max(0, month.items.length - visibleItems.length);
                return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={month.month}>
                  <Paper
                    onClick={() => setSelectedMonth(month.month)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedMonth(month.month);
                    }}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      height: 150,
                      boxShadow: "none",
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                      cursor: "pointer",
                      transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: `${birthdayColor}88`,
                        boxShadow: "0 16px 34px rgba(15,23,42,0.12)",
                      },
                    }}
                  >
                    <Stack height="100%" spacing={1}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography fontWeight={950} color={month.items.length ? birthdayColor : "text.secondary"} textTransform="capitalize">
                          {month.label}
                        </Typography>
                        {month.items.length ? (
                          <Chip
                            size="small"
                            label={month.items.length}
                            sx={{
                              height: 22,
                              minWidth: 28,
                              fontWeight: 950,
                              color: birthdayColor,
                              bgcolor: `${birthdayColor}18`,
                              border: `1px solid ${birthdayColor}44`,
                            }}
                          />
                        ) : null}
                      </Stack>
                      <Stack spacing={1} sx={{ minHeight: 0, flex: 1 }}>
                      {visibleItems.map((item) => {
                        const parts = birthdayDateParts(item.date);
                        return (
                          <Box
                            key={item.id}
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(236,72,153,0.12)" : "rgba(253,242,248,0.86)",
                              border: `1px solid ${birthdayColor}33`,
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" spacing={1}>
                              <Box minWidth={0}>
                                <Typography fontWeight={900} noWrap>{item.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {parts.day}/{String(parts.month).padStart(2, "0")} · {formatMoney(item.amount)}
                                </Typography>
                              </Box>
                              <CakeIcon sx={{ color: birthdayColor, fontSize: 20 }} />
                            </Stack>
                          </Box>
                        );
                      })}
                      {!month.items.length ? (
                        <Typography variant="body2" color="text.secondary">
                          {t("noBirthdaysInMonth")}
                        </Typography>
                      ) : null}
                      {hiddenCount > 0 ? (
                        <Chip
                          size="small"
                          label={t("moreBirthdays").replace("{count}", String(hiddenCount))}
                          sx={{
                            alignSelf: "flex-start",
                            mt: "auto",
                            fontWeight: 850,
                            color: birthdayColor,
                            bgcolor: `${birthdayColor}14`,
                            border: `1px solid ${birthdayColor}33`,
                          }}
                          variant="outlined"
                        />
                      ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                </Grid>
                );
              })}
            </Grid>
          </Paper>

          <Grid container spacing={2} sx={{ mx: 0, width: "100%" }}>
            {sortedBirthdays.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Paper className="soft-card" sx={{ p: 2.25, borderRadius: 4, borderColor: `${birthdayColor}44` }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                    <Stack direction="row" spacing={1.5} minWidth={0}>
                      <Box
                        width={44}
                        height={44}
                        display="grid"
                        sx={{ placeItems: "center", borderRadius: 2.5, bgcolor: `${birthdayColor}22`, color: birthdayColor, flexShrink: 0 }}
                      >
                        <PersonIcon />
                      </Box>
                      <Box minWidth={0}>
                        <Typography fontWeight={950} noWrap>{item.name}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {formatBirthdayDate(item.date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title={t("reminders")}>
                        <IconButton onClick={() => setReminderItem(item)}>
                          <NotificationsIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("edit")}>
                        <IconButton onClick={() => openEdit(item)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("delete")}>
                        <IconButton color="error" onClick={() => removeBirthday(item)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1} mt={2}>
                    <PaidIcon sx={{ color: financeColors.expense }} />
                    <Typography variant="h5" fontWeight={950} color={financeColors.expense}>
                      {formatMoney(item.amount)}
                    </Typography>
                  </Stack>
                  {item.description ? (
                    <Typography color="text.secondary" mt={1.25}>
                      {item.description}
                    </Typography>
                  ) : null}
                </Paper>
              </Grid>
            ))}
            {!sortedBirthdays.length ? (
              <Grid item xs={12}>
                <EmptyState message={t("noBirthdaysRegistered")} />
              </Grid>
            ) : null}
          </Grid>
        </>
      ) : null}

      <AppDialog
        open={Boolean(selectedMonthData)}
        onClose={() => setSelectedMonth(null)}
        title={selectedMonthData ? `${t("birthdayCalendar")} - ${selectedMonthData.label} ${year}` : t("birthdayCalendar")}
        titleAccent={birthdayColor}
        maxWidth="md"
        actions={<Button onClick={() => setSelectedMonth(null)}>{t("close")}</Button>}
      >
        {selectedMonthData ? (
          <Stack spacing={2}>
            <Grid container spacing={1}>
              {[t("sunday"), t("monday"), t("tuesday"), t("wednesday"), t("thursday"), t("friday"), t("saturday")].map((day) => (
                <Grid item xs={12 / 7} key={day}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900} display="block" textAlign="center" noWrap>
                    {day.slice(0, 3)}
                  </Typography>
                </Grid>
              ))}
              {selectedMonthCalendarDays.map((day, index) => {
                const dayBirthdays = day
                  ? selectedMonthData.items.filter((item) => birthdayDateParts(item.date).day === day)
                  : [];
                const hasBirthdays = dayBirthdays.length > 0;
                return (
                  <Grid item xs={12 / 7} key={`${day ?? "empty"}-${index}`}>
                    <Paper
                      sx={{
                        p: 1,
                        minHeight: { xs: 78, md: 112 },
                        borderRadius: 2.5,
                        boxShadow: "none",
                        border: "1px solid",
                        borderColor: hasBirthdays ? `${birthdayColor}88` : "divider",
                        bgcolor: (theme) =>
                          hasBirthdays
                            ? theme.palette.mode === "dark"
                              ? "rgba(236,72,153,0.18)"
                              : "rgba(253,242,248,0.96)"
                            : "background.default",
                        opacity: day ? 1 : 0.36,
                      }}
                    >
                      {day ? (
                        <Stack spacing={0.75}>
                          <Typography fontWeight={950} color={hasBirthdays ? birthdayColor : "text.secondary"}>
                            {day}
                          </Typography>
                          {dayBirthdays.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                p: 0.75,
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                border: `1px solid ${birthdayColor}33`,
                              }}
                            >
                              <Typography variant="caption" fontWeight={950} display="block" noWrap>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color={financeColors.expense} fontWeight={900} display="block" noWrap>
                                {formatMoney(item.amount)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      ) : null}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {!selectedMonthData.items.length ? (
              <EmptyState message={t("noBirthdaysInMonth")} />
            ) : null}
          </Stack>
        ) : null}
      </AppDialog>

      <AppDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBirthday ? t("editBirthday") : t("newBirthday")}
        titleAccent={birthdayColor}
        actions={
          <>
            <Button onClick={() => setFormOpen(false)}>{t("cancel")}</Button>
            <LoadingActionButton
              type="submit"
              form="birthday-form"
              variant="contained"
              loading={saving}
              loadingLabel={t("saving")}
              disabled={!form.personName.trim() || !form.amount || !form.date}
            >
              {t("save")}
            </LoadingActionButton>
          </>
        }
      >
        <Stack component="form" id="birthday-form" spacing={2} onSubmit={saveBirthday}>
          <TextField
            autoFocus
            label={t("birthdayPersonName")}
            value={form.personName}
            onChange={(event) => setForm({ ...form, personName: event.target.value })}
            required
            fullWidth
          />
          <TextField
            label={t("birthdayGiftValue")}
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: digitsToCurrency(event.target.value) })}
            required
            fullWidth
          />
          <TextField
            label={t("birthdayDate")}
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />
          <TextField
            label={t("optionalNote")}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </AppDialog>

      <FinancialRemindersDialog
        item={reminderItem}
        open={Boolean(reminderItem)}
        onClose={() => setReminderItem(null)}
      />

      {confirmDialog}
    </Stack>
  );
}
