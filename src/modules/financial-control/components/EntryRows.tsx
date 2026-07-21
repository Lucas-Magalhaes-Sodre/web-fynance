import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ReplayIcon from "@mui/icons-material/Replay";
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
import { financeColors, formatDate, formatMoney, typeLabels } from "@/utils/format";
import { itemDateLabel } from "./helpers";
import * as S from "./styles";

type EntryRowsProps = {
  items: FinancialItem[];
  onEdit: (item: FinancialItem) => void;
  onDelete: (item: FinancialItem) => void;
  onMarkPaid: (item: FinancialItem) => void;
  onMarkPending: (item: FinancialItem) => void;
};

export function EntryRows({
  items,
  onEdit,
  onDelete,
  onMarkPaid,
  onMarkPending,
}: EntryRowsProps) {
  if (!items.length)
    return <EmptyState message="Nada cadastrado para este periodo." />;

  return (
    <S.TableCard className="soft-card">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Data da movimentacao</TableCell>
            <TableCell>Situacao</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell align="right">Valor</TableCell>
            <TableCell align="right">Acoes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>{item.name ?? item.title}</TableCell>
              <TableCell>{item.category}</TableCell>
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
                      Vencimento: {formatDate(item.dueDate)}
                    </Typography>
                  </Stack>
                ) : (
                  "Recebido"
                )}
              </TableCell>
              <TableCell>{typeLabels[item.type]}</TableCell>
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
