import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { AppDialog } from "@/components/molecules/AppDialog";
import type { SavingsProjection } from "@/interfaces/financial";
import { getSavingsProjection } from "@/services/financialControl";
import { financeColors, formatDate, formatMoney, isoDate } from "@/utils/format";

type EconomyProjectionDialogProps = {
  open: boolean;
  onClose: () => void;
};

function defaultFutureDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return isoDate(date);
}

export function EconomyProjectionDialog({ open, onClose }: EconomyProjectionDialogProps) {
  const [targetDate, setTargetDate] = useState(defaultFutureDate);
  const [projection, setProjection] = useState<SavingsProjection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isInvalidDate = new Date(`${targetDate}T23:59:59`) <= new Date();

  useEffect(() => {
    if (!open || isInvalidDate) {
      if (isInvalidDate) setProjection(null);
      return;
    }
    setLoading(true);
    setError("");
    getSavingsProjection(targetDate)
      .then(setProjection)
      .catch(() => setError("Nao foi possivel simular o saldo futuro."))
      .finally(() => setLoading(false));
  }, [isInvalidDate, open, targetDate]);

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Simular saldo futuro"
      titleAccent={financeColors.saving}
      maxWidth="md"
      actions={<Button onClick={onClose}>Fechar</Button>}
    >
      <Stack spacing={2}>
        <Typography color="text.secondary">
          Escolha uma data para ver quanto voce tera economizado se seguir o planejamento registrado no sistema.
        </Typography>
        <TextField
          label="Selecionar data futura"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={targetDate}
          error={isInvalidDate}
          helperText={isInvalidDate ? "A data precisa ser futura." : " "}
          onChange={(event) => setTargetDate(event.target.value)}
        />

        {loading ? <Skeleton variant="rounded" height={110} /> : null}
        {error ? <EmptyState message={error} /> : null}

        {!loading && !error && projection ? (
          <>
            <Paper sx={{ p: 2.5, borderRadius: 3, boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)" }}>
              <Typography color="text.secondary" fontWeight={900}>
                Saldo previsto em {formatDate(projection.targetDate)}
              </Typography>
              <Typography variant="h4" fontWeight={950} color={financeColors.saving}>
                {formatMoney(projection.projectedBalance)}
              </Typography>
              <Typography color="text.secondary">
                Saldo atual: {formatMoney(projection.currentSavedBalance)}
              </Typography>
            </Paper>
            <Divider />
            <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Subitem</TableCell>
                  <TableCell>Data prevista</TableCell>
                  <TableCell align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projection.items.map((item) => {
                  const isWithdraw = item.type === "WITHDRAW";
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip
                          size="small"
                          label={isWithdraw ? "Saida" : "Entrada"}
                          sx={{
                            fontWeight: 900,
                            color: isWithdraw ? financeColors.negative : financeColors.positive,
                            bgcolor: isWithdraw ? financeColors.negativeSoft : financeColors.positiveSoft,
                          }}
                        />
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{item.subItemName}</TableCell>
                      <TableCell>{formatDate(item.movementDate)}</TableCell>
                      <TableCell align="right" sx={{ color: isWithdraw ? financeColors.negative : financeColors.positive, fontWeight: 950 }}>
                        {formatMoney(item.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!projection.items.length ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState message="Nenhuma movimentacao futura ate esta data." />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            </Box>
          </>
        ) : null}
      </Stack>
    </AppDialog>
  );
}
