import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { FormEvent, useEffect, useState } from 'react';
import type { FinancialItem, FinancialItemType } from '@/interfaces/financial';
import { currencyToNumber, digitsToCurrency, formatMoney, typeLabels } from '@/utils/format';
import { AppDialog, AppDialogStyles as S } from '@/components/molecules/AppDialog';
import { LoadingActionButton } from '@/components/molecules/LoadingActionButton';

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
        amount: formatMoney(item.amount),
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
    if (saving) return;
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        amount: currencyToNumber(form.amount),
        dueDate: form.dueDate || ''
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={item ? 'Editar registro' : 'Novo registro'}
      actions={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <LoadingActionButton type="submit" form="financial-item-form" variant="contained" loading={saving} loadingLabel="Salvando...">
            Salvar
          </LoadingActionButton>
        </>
      }
    >
        <S.FormStack component="form" id="financial-item-form" spacing={2} onSubmit={handleSubmit}>
          <TextField label="Nome da entrada ou despesa" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField
            label="Observação opcional"
            multiline
            minRows={2}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <TextField
            label="Valor em reais"
            required
            value={form.amount}
            onChange={(event) => setForm({ ...form, amount: digitsToCurrency(event.target.value) })}
          />
          <TextField select label="Tipo de registro" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as FinancialItemType })}>
            {Object.entries(typeLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Data da entrada, pagamento ou débito" type="date" required InputLabelProps={{ shrink: true }} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <TextField label="Data de vencimento, se tiver" type="date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </S.FormStack>
    </AppDialog>
  );
}
