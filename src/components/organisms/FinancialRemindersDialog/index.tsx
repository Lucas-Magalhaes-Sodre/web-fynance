import AddAlertIcon from "@mui/icons-material/AddAlert";
import DeleteIcon from "@mui/icons-material/Delete";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { AppDialog } from "@/components/molecules/AppDialog";
import { LoadingActionButton } from "@/components/molecules/LoadingActionButton";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { FinancialItem, FinancialReminder } from "@/interfaces/financial";
import {
  createFinancialReminder,
  deleteFinancialReminder,
  listFinancialReminders,
} from "@/services/financialControl";
import { formatDate } from "@/utils/format";

type FinancialRemindersDialogProps = {
  item: FinancialItem | null;
  open: boolean;
  onClose: () => void;
};

function dateOnly(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function reminderDate(baseDate: string, offsetDays: number, time: string) {
  const [year, month, day] = baseDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function FinancialRemindersDialog({ item, open, onClose }: FinancialRemindersDialogProps) {
  const { t } = usePreferences();
  const [reminders, setReminders] = useState<FinancialReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offsetDays, setOffsetDays] = useState("0");
  const [time, setTime] = useState("09:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const baseDate = useMemo(() => dateOnly(item?.dueDate ?? item?.date), [item]);
  const canCreate = Boolean(item && baseDate && reminders.length < 3 && Number(offsetDays) >= 0 && time);

  async function loadReminders() {
    if (!item) return;
    setLoading(true);
    setError("");
    try {
      setReminders(await listFinancialReminders({ financialItemId: item.id }));
    } catch {
      setError(t("remindersLoadError"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setOffsetDays("0");
    setTime("09:00");
    setMessage("");
    loadReminders();
  }, [open, item?.id]);

  async function addReminder() {
    if (!item || !canCreate) return;
    setSaving(true);
    setError("");
    try {
      const days = Number(offsetDays);
      await createFinancialReminder({
        financialItemId: item.id,
        title: item.name ?? item.title,
        message: message.trim() || null,
        offsetDays: days,
        remindAt: reminderDate(baseDate, days, time),
      });
      setMessage("");
      await loadReminders();
    } catch {
      setError(t("reminderSaveError"));
    } finally {
      setSaving(false);
    }
  }

  async function removeReminder(reminder: FinancialReminder) {
    setSaving(true);
    try {
      await deleteFinancialReminder(reminder.id);
      await loadReminders();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={item ? `${t("reminders")} - ${item.name ?? item.title}` : t("reminders")}
      titleAccent="#EC4899"
      maxWidth="sm"
      actions={<Button onClick={onClose}>{t("close")}</Button>}
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">
          {t("remindersHelpText")}
        </Typography>

        {loading ? (
          <Stack spacing={1}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} variant="rounded" height={58} />
            ))}
          </Stack>
        ) : null}

        {error ? <EmptyState message={error} /> : null}

        {!loading ? (
          <Stack spacing={1}>
            {reminders.map((reminder) => (
              <Paper
                key={reminder.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Box minWidth={0}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NotificationsIcon sx={{ color: "#EC4899", fontSize: 20 }} />
                      <Typography fontWeight={900}>
                        {reminder.offsetDays === 0
                          ? t("sameDay")
                          : t("daysBefore").replace("{days}", String(reminder.offsetDays))}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {formatDate(reminder.remindAt)}
                    </Typography>
                    {reminder.message ? (
                      <Typography color="text.secondary" variant="body2">
                        {reminder.message}
                      </Typography>
                    ) : null}
                  </Box>
                  <Tooltip title={t("delete")}>
                    <IconButton color="error" onClick={() => removeReminder(reminder)} disabled={saving}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
            {!reminders.length ? <EmptyState message={t("noReminders")} /> : null}
          </Stack>
        ) : null}

        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: "1px solid", borderColor: "divider" }}>
          <Stack spacing={1.5}>
            <Typography fontWeight={950}>{t("addReminder")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <TextField
                select
                label={t("whenRemind")}
                value={offsetDays}
                onChange={(event) => setOffsetDays(event.target.value)}
                fullWidth
              >
                {[0, 1, 2, 3, 5, 7, 15, 30].map((days) => (
                  <MenuItem key={days} value={String(days)}>
                    {days === 0 ? t("sameDay") : t("daysBefore").replace("{days}", String(days))}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={t("time")}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <TextField
              label={t("optionalMessage")}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <LoadingActionButton
              variant="contained"
              startIcon={<AddAlertIcon />}
              onClick={addReminder}
              loading={saving}
              disabled={!canCreate || saving}
              loadingLabel={t("saving")}
              sx={{ alignSelf: "flex-start" }}
            >
              {t("addReminder")}
            </LoadingActionButton>
            {reminders.length >= 3 ? (
              <Typography color="text.secondary" variant="caption">
                {t("maxReminders")}
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </AppDialog>
  );
}
