import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { Saving } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import { usePreferences } from "@/contexts/PreferencesContext";
import { translateCategoryName } from "@/i18n/display";
import * as S from "./styles";

type SavingRowsProps = {
  items: Saving[];
};

export function SavingRows({ items }: SavingRowsProps) {
  const { language, t } = usePreferences();
  if (!items.length)
    return (
      <EmptyState message={t("noSavingThisPeriod")} />
    );

  return (
    <S.TableCard className="soft-card">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("singleSaving")}</TableCell>
            <TableCell>{t("category")}</TableCell>
            <TableCell>{t("date")}</TableCell>
            <TableCell>{t("description")}</TableCell>
            <TableCell align="right">{t("value")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.title}</TableCell>
              <TableCell>{translateCategoryName(item.category, language)}</TableCell>
              <TableCell>{formatDate(item.date)}</TableCell>
              <TableCell>{item.description || "-"}</TableCell>
              <TableCell
                align="right"
                sx={{ color: financeColors.saving, fontWeight: 850 }}
              >
                {formatMoney(item.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </S.TableCard>
  );
}
