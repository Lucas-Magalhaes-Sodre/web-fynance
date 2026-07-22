import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FinancialItemForm } from "@/components/organisms/FinancialItemForm";
import type { FinancialItem, FinancialItemType } from "@/interfaces/financial";
import { formatDate, formatMoney, typeLabels } from "@/utils/format";

type Props = {
  title: string;
  description: string;
  type: FinancialItemType;
};

export function FinancialItemsPage({ title, description, type }: Props) {
  const [items, setItems] = useState<FinancialItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const isIncomePage = type.includes("INCOME");
  const dateHeader = isIncomePage ? "Data do recebimento" : "Data da saida";

  async function loadItems() {
    const { data } = await api.get("/financial-items", { params: { type } });
    setItems(data.items);
  }

  useEffect(() => {
    loadItems();
  }, [type]);

  async function removeItem(item: FinancialItem) {
    const confirmed = await confirm({
      title: "Excluir lançamento",
      description: `Deseja excluir "${item.title}"? Esta acao não pode ser desfeita.`,
      confirmLabel: "Excluir",
      tone: "danger",
    });
    if (!confirmed) return;
    await api.delete(`/financial-items/${item.id}`);
    await loadItems();
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <div>
          <Typography variant="h4" fontWeight={900}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description}</Typography>
        </div>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        >
          Novo
        </Button>
      </Stack>

      <Paper
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "none",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Titulo</TableCell>
              <TableCell>Categoria</TableCell>
              <TableCell>{dateHeader}</TableCell>
              <TableCell>
                {isIncomePage
                  ? "Dia combinado para receber"
                  : "Vencimento e pagamento"}
              </TableCell>
              <TableCell align="right">Valor</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.title}</TableCell>
                <TableCell>{typeLabels[item.type]}</TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {dateHeader}
                  </Typography>
                  {formatDate(item.date)}
                </TableCell>
                <TableCell>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {isIncomePage
                      ? "Dia combinado para receber"
                      : `Situacao: ${item.status}`}
                  </Typography>
                  {isIncomePage
                    ? formatDate(item.dueDate)
                    : `Venc.: ${formatDate(item.dueDate)}${item.paymentDate ? ` / Pago: ${formatDate(item.paymentDate)}` : ""}`}
                </TableCell>
                <TableCell align="right">{formatMoney(item.amount)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Editar">
                    <IconButton
                      onClick={() => {
                        setEditingItem(item);
                        setFormOpen(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton color="error" onClick={() => removeItem(item)}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <FinancialItemForm
        open={formOpen}
        defaultType={type}
        item={editingItem}
        onClose={() => setFormOpen(false)}
        onSubmit={async (data) => {
          const payload = { ...data, dueDate: data.dueDate || null };
          if (editingItem)
            await api.put(`/financial-items/${editingItem.id}`, payload);
          else await api.post("/financial-items", payload);
          await loadItems();
        }}
      />
      {confirmDialog}
    </Stack>
  );
}
