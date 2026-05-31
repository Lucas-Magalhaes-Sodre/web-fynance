import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { FormEvent, useEffect, useState } from 'react';
import type { FinancialItem, FinancialItemType } from '../types/financial';
import { typeLabels } from '../utils/format';

type FormState = {
  title: string;
  description: string;
  amount: string;
  type: FinancialItemType;
  date: string;
  dueDate: string;
};

type Props = {
  open: boolean;
  defaultType: FinancialItemType;
  item?: FinancialItem | null;
  onClose: () => void;
  onSubmit: (data: Omit<FormState, 'amount'> & { amount: number }) => Promise<void>;
};

const today = new Date().toISOString().slice(0, 10);

export function FinancialItemForm({ open, defaultType, item, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    amount: '',
    type: defaultType,
    date: today,
    dueDate: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        description: item.description ?? '',
        amount: String(item.amount),
        type: item.type,
        date: item.date.slice(0, 10),
        dueDate: item.dueDate ? item.dueDate.slice(0, 10) : ''
      });
      return;
    }

    setForm({ title: '', description: '', amount: '', type: defaultType, date: today, dueDate: '' });
  }, [item, defaultType, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount),
        dueDate: form.dueDate || ''
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{item ? 'Editar registro' : 'Novo registro'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="financial-item-form" spacing={2} pt={1} onSubmit={handleSubmit}>
          <TextField label="Nome da entrada ou despesa" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField
            label="Observacao opcional"
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <TextField
            label="Valor em reais"
            type="number"
            required
            inputProps={{ min: 0, step: '0.01' }}
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: event.target.value })}
          />
          <TextField select label="Tipo de registro" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FinancialItemType })}>
            {Object.entries(typeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Data da entrada, pagamento ou debito" type="date" required InputLabelProps={{ shrink: true }} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <TextField label="Data de vencimento, se tiver" type="date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="financial-item-form" variant="contained" disabled={saving}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
