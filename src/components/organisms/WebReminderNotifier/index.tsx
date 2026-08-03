import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import type { FinancialReminder } from "@/interfaces/financial";
import { listFinancialReminders, updateFinancialReminder } from "@/services/financialControl";
import { formatDateTime } from "@/utils/format";

const notifiedStorageKey = "@minha-receita:web-reminders-notified";
const reminderPollingVisibleMs = 10 * 60_000;
const reminderPollingHiddenMs = 30 * 60_000;

function readNotifiedIds() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(notifiedStorageKey) || "[]"));
  } catch {
    return new Set<string>();
  }
}

function persistNotifiedIds(ids: Set<string>) {
  localStorage.setItem(notifiedStorageKey, JSON.stringify(Array.from(ids).slice(-200)));
}

function canUseBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function reminderNotificationKey(reminder: FinancialReminder) {
  return `${reminder.id}:${reminder.remindAt}`;
}

export function WebReminderNotifier() {
  const { t } = usePreferences();
  const [activeReminder, setActiveReminder] = useState<FinancialReminder | null>(null);
  const [open, setOpen] = useState(false);

  const action = useMemo(() => {
    if (!activeReminder) return null;
    return (
      <Button
        color="inherit"
        size="small"
        onClick={async () => {
          await updateFinancialReminder(activeReminder.id, { status: "READ" });
          setOpen(false);
          setActiveReminder(null);
        }}
      >
        {t("markAsRead")}
      </Button>
    );
  }, [activeReminder, t]);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    let checking = false;

    function nextDelay() {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return reminderPollingHiddenMs;
      }
      return reminderPollingVisibleMs;
    }

    function scheduleNextCheck(delay = nextDelay()) {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(notifyDueReminders, delay);
    }

    async function notifyDueReminders() {
      if (disposed || checking) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        scheduleNextCheck();
        return;
      }
      checking = true;
      let reminders: FinancialReminder[] = [];
      try {
        reminders = await listFinancialReminders({ status: "PENDING", dueOnly: true });
      } catch {
        checking = false;
        scheduleNextCheck();
        return;
      }
      checking = false;
      if (disposed) return;

      const notifiedIds = readNotifiedIds();
      const reminder = reminders.find((item) => !notifiedIds.has(reminderNotificationKey(item)));
      if (!reminder) {
        scheduleNextCheck();
        return;
      }

      notifiedIds.add(reminderNotificationKey(reminder));
      persistNotifiedIds(notifiedIds);
      setActiveReminder(reminder);
      setOpen(true);

      if (!canUseBrowserNotifications()) return;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        new Notification(reminder.title, {
          body: `${reminder.message || t("reminders")} • ${formatDateTime(reminder.remindAt)}`,
          tag: reminder.id,
        });
      }
      scheduleNextCheck();
    }

    notifyDueReminders();
    function checkWhenVisible() {
      if (document.visibilityState === "visible") notifyDueReminders();
    }
    window.addEventListener("online", notifyDueReminders);
    document.addEventListener("visibilitychange", checkWhenVisible);
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("online", notifyDueReminders);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [t]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={9000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert severity="info" variant="filled" action={action} onClose={() => setOpen(false)}>
        {activeReminder
          ? `${activeReminder.title} • ${formatDateTime(activeReminder.remindAt)}`
          : t("reminders")}
      </Alert>
    </Snackbar>
  );
}
