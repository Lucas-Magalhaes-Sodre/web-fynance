import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ReplayIcon from "@mui/icons-material/Replay";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { FinancialItem } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName, typeLabel } from "@/i18n/display";
import { itemDateLabel } from "./helpers";
import * as S from "./styles";

type EntryRowsProps = {
  items: FinancialItem[];
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
  onMarkPaid: (item: FinancialItem) => void;
  onMarkPending: (item: FinancialItem) => void;
  onManageReminders?: (item: FinancialItem) => void;
};

export function EntryRows({
  items,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
  onManageReminders,
}: EntryRowsProps) {
  const { language, t } = usePreferences();
  if (!items.length)
    return <EmptyState message={t("nothingThisPeriod")} />;

  return (
    <S.TableCard className="soft-card">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("name")}</TableCell>
            <TableCell>{t("category")}</TableCell>
            <TableCell>{t("movementDate")}</TableCell>
            <TableCell>{t("situation")}</TableCell>
            <TableCell>{t("type")}</TableCell>
            <TableCell align="right">{t("value")}</TableCell>
            <TableCell align="right">{t("actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name ?? item.title}</TableCell>
              <TableCell>{translateCategoryName(item.category, language)}</TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {itemDateLabel(item)}
                </Typography>
                {formatDate(item.date)}
              </TableCell>
              <TableCell>
                {item.type.includes("EXPENSE") ? (
                  <Stack spacing={0.5}>
                    <Chip
                      size="small"
                      label={item.status}
                      color={
                        item.status === "PAGO"
                          ? "success"
                          : item.status === "ATRASADO"
                            ? "error"
                            : "warning"
                      }
                    />
                    <Typography variant="caption" color="text.secondary">
                      {t("dueDate")}: {formatDate(item.dueDate)}
                    </Typography>
                  </Stack>
                ) : (
                  t("received")
                )}
              </TableCell>
              <TableCell>{typeLabel(item.type, language)}</TableCell>
              <TableCell
                align="right"
                sx={{
                  color: item.type.includes("EXPENSE")
                    ? financeColors.expense
                    : financeColors.income,
                  fontWeight: 800,
                }}
              >
                {formatMoney(item.amount)}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton onClick={() => onEdit(item)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                {item.type.includes("EXPENSE") && item.status !== "PAGO" ? (
                  <Tooltip title="Marcar como pago">
                    <IconButton
                      color="success"
                      onClick={() => onMarkPaid(item)}
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {item.type.includes("EXPENSE") && onManageReminders ? (
                  <Tooltip title={t("reminders")}>
                    <IconButton onClick={() => onManageReminders(item)}>
                      <NotificationsIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {item.type.includes("EXPENSE") && item.status === "PAGO" ? (
                  <Tooltip title="Voltar para pendente">
                    <IconButton
                      color="warning"
                      onClick={() => onMarkPending(item)}
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                ) : null}
                <Tooltip title="Excluir">
                  <IconButton color="error" onClick={() => onDelete(item)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </S.TableCard>
  );
}
