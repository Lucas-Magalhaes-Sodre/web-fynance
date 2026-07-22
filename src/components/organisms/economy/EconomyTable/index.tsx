import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { FinancialGoal, Saving } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName } from "@/i18n/display";

type EconomyTableProps = {
  savings: Saving[];
  goals: FinancialGoal[];
  onEdit: (saving: Saving) => void;
  onDelete: (saving: Saving) => void;
  onDetails: (saving: Saving) => void;
};

export function EconomyTable({
  savings,
  goals,
  onEdit,
  onDelete,
  onDetails,
}: EconomyTableProps) {
  const { language, t } = usePreferences();

  return (
    <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("singleSaving")}</TableCell>
            <TableCell>{t("category")}</TableCell>
            <TableCell>{t("date")}</TableCell>
            <TableCell>{t("menuGoals")}</TableCell>
            <TableCell>{t("description")}</TableCell>
            <TableCell align="right">{t("value")}</TableCell>
            <TableCell align="right">{t("actions")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {savings.map((saving) => (
            <TableRow key={saving.id} hover>
              <TableCell>{saving.title}</TableCell>
              <TableCell>{translateCategoryName(saving.category, language)}</TableCell>
              <TableCell>{formatDate(saving.date)}</TableCell>
              <TableCell>
                {goals.find((goal) => goal.id === saving.goalId)?.title ?? "-"}
              </TableCell>
              <TableCell>{saving.description || "-"}</TableCell>
              <TableCell
                align="right"
                sx={{ color: financeColors.saving, fontWeight: 900 }}
              >
                {formatMoney(saving.amount)}
              </TableCell>
              <TableCell align="right">
                <Tooltip title={t("edit")}>
                  <IconButton onClick={() => onEdit(saving)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("viewDetails")}>
                  <IconButton color="primary" onClick={() => onDetails(saving)}>
                    <InfoOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("delete")}>
                  <IconButton color="error" onClick={() => onDelete(saving)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {!savings.length ? (
            <TableRow>
              <TableCell colSpan={7}>
                <EmptyState message={t("noRegisteredSavingPeriod")} />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Paper>
  );
}
