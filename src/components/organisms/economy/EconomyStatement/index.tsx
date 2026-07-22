import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/atoms/EmptyState";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName } from "@/i18n/display";
import type { Saving } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";

type EconomyStatementProps = {
  savings: Saving[];
};

export function EconomyStatement({ savings }: EconomyStatementProps) {
  const { language, t } = usePreferences();
  const orderedSavings = [...savings].sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <Paper className="soft-card" sx={{ borderRadius: 4, overflow: "hidden" }}>
      <Typography variant="h6" fontWeight={950} p={2}>
        {t("savingsExtract")}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("type")}</TableCell>
            <TableCell>{t("date")}</TableCell>
            <TableCell>{t("category")}</TableCell>
            <TableCell>{t("subitem")}</TableCell>
            <TableCell>{t("description")}</TableCell>
            <TableCell align="right">{t("value")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orderedSavings.map((saving) => {
            const isWithdraw = saving.amount < 0;
            return (
              <TableRow key={saving.id} hover>
                <TableCell sx={{ color: isWithdraw ? financeColors.negative : financeColors.positive, fontWeight: 900 }}>
                  {isWithdraw ? `🔴 ${t("savingWithdrawnLabel")}` : `🟢 ${t("savingAddedLabel")}`}
                </TableCell>
                <TableCell>{formatDate(saving.date)}</TableCell>
                <TableCell>{translateCategoryName(saving.category, language)}</TableCell>
                <TableCell>{saving.title}</TableCell>
                <TableCell>{saving.description || "-"}</TableCell>
                <TableCell
                  align="right"
                  sx={{ color: isWithdraw ? financeColors.negative : financeColors.positive, fontWeight: 900 }}
                >
                  {formatMoney(Math.abs(saving.amount))}
                </TableCell>
              </TableRow>
            );
          })}
          {!orderedSavings.length ? (
            <TableRow>
              <TableCell colSpan={6}>
                <EmptyState message={t("noSavingMovementRegistered")} />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Paper>
  );
}
