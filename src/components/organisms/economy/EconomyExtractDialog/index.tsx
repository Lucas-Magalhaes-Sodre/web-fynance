import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/atoms/EmptyState";
import { AppDialog } from "@/components/molecules/AppDialog";
import type { SavingsExtract, SavingsExtractMode } from "@/interfaces/financial";
import { getSavingsExtract } from "@/services/financialControl";
import { financeColors, formatDate, formatMoney } from "@/utils/format";

type EconomyExtractDialogProps = {
  open: boolean;
  initialMode?: SavingsExtractMode;
  onClose: () => void;
};

const limit = 10;

export function EconomyExtractDialog({ open, initialMode = "current", onClose }: EconomyExtractDialogProps) {
  const [mode, setMode] = useState<SavingsExtractMode>("current");
  const [page, setPage] = useState(1);
  const [extract, setExtract] = useState<SavingsExtract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMode(initialMode);
    setPage(1);
  }, [initialMode, open]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    getSavingsExtract({ mode, page, limit })
      .then(setExtract)
      .catch(() => setError("Nao foi possivel carregar o extrato de economias."))
      .finally(() => setLoading(false));
  }, [mode, open, page]);

  function changeMode(nextMode: SavingsExtractMode) {
    setMode(nextMode);
    setPage(1);
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Extrato de economias"
      titleAccent={financeColors.saving}
      maxWidth="lg"
      actions={<Button onClick={onClose}>Fechar</Button>}
    >
      <Stack spacing={2}>
        <Tabs value={mode} onChange={(_, value) => changeMode(value)}>
          <Tab value="current" label="Atual" />
          <Tab value="future" label="Futuro" />
        </Tabs>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)", flex: 1 }}>
            <Typography color="text.secondary" fontWeight={900}>
              {mode === "current" ? "Saldo atual economizado" : "Saldo atual"}
            </Typography>
            <Typography variant="h5" fontWeight={950} color={financeColors.saving}>
              {formatMoney(extract?.currentSavedBalance ?? 0)}
            </Typography>
          </Paper>
          {mode === "future" ? (
            <Paper sx={{ p: 2, borderRadius: 3, boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)", flex: 1 }}>
              <Typography color="text.secondary" fontWeight={900}>
                Saldo futuro previsto
              </Typography>
              <Typography variant="h5" fontWeight={950} color={financeColors.positive}>
                {formatMoney(extract?.futureProjectedBalance ?? 0)}
              </Typography>
            </Paper>
          ) : null}
        </Stack>

        {loading ? (
          <Stack spacing={1}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={52} />
            ))}
          </Stack>
        ) : null}
        {error ? <EmptyState message={error} /> : null}

        {!loading && !error ? (
          <Paper sx={{ borderRadius: 3, overflow: "hidden", boxShadow: "none", border: "1px solid rgba(15,23,42,0.08)" }}>
            <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Subitem</TableCell>
                  <TableCell>Descricao</TableCell>
                  <TableCell>Registro</TableCell>
                  <TableCell>Entrada/Saida</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(extract?.items ?? []).map((item) => {
                  const isWithdraw = item.type === "WITHDRAW";
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Chip
                          label={isWithdraw ? "Economia sacada" : "Economia adicionada"}
                          size="small"
                          sx={{
                            fontWeight: 900,
                            color: isWithdraw ? financeColors.negative : financeColors.positive,
                            bgcolor: isWithdraw ? financeColors.negativeSoft : financeColors.positiveSoft,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: isWithdraw ? financeColors.negative : financeColors.positive, fontWeight: 950 }}>
                        {formatMoney(item.amount)}
                      </TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{item.subItemName}</TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>{formatDate(item.registeredAt)}</TableCell>
                      <TableCell>{formatDate(item.movementDate)}</TableCell>
                    </TableRow>
                  );
                })}
                {!extract?.items.length ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState message={mode === "current" ? "Nenhuma movimentacao atual." : "Nenhuma movimentacao futura."} />
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            </Box>
          </Paper>
        ) : null}

        {(extract?.totalPages ?? 0) > 1 ? (
          <Box display="flex" justifyContent="flex-end">
            <Pagination
              page={page}
              count={extract?.totalPages ?? 1}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        ) : null}
      </Stack>
    </AppDialog>
  );
}
