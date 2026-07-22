import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { Saving } from "@/interfaces/financial";
import { financeColors, formatDate, formatMoney } from "@/utils/format";
import * as S from "./styles";

type SavingRowsProps = {
  items: Saving[];
};

export function SavingRows({ items }: SavingRowsProps) {
  if (!items.length)
    return (
      <EmptyState message="Nenhuma economia neste período." />
    );

  return (
    <S.TableCard className="soft-card">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Economia</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Data</TableCell>
            <TableCell>Descrição</TableCell>
            <TableCell align="right">Valor</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.category}</TableCell>
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
