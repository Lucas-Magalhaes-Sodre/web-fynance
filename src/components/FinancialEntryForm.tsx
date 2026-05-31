import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { FinancialEntryPayload } from '../api/financialControl';
import type { EntryType, FinancialItem, RecurrenceType } from '../types/financial';
import { isoDate } from '../utils/format';

const incomeCategories = ['Salario 1', 'Salario 2', 'Investimentos', 'Salario extra', 'Outros'];
const expenseCategories = [
  'Parcela carro',
  'Parcela casa',
  'Parcela construtora',
  'IPTU',
  'Licenciamento',
  'IPVA',
  'Conta de agua',
  'Conta de energia',
  'Conta de internet',
  'Cartoes',
  'Faculdade',
  'Farmacia',
  'Gasolina',
  'Imposto de renda',
  'Pix ou dinheiro',
  'Entrada FIPE',
  'Investimento/Aposentadoria',
  'Outros'
];

const recurrenceLabels: Record<RecurrenceType, string> = {
  NONE: 'Sem recorrencia',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual'
};

type FormState = {
  name: string;
  description: string;
  amount: string;
  type: EntryType;
  category: string;
  date: string;
  dueDate: string;
  paymentDate: string;
  status: 'PENDENTE' | 'PAGO' | 'ATRASADO';
  dueDay: string;
  isFixed: boolean;
  recurrenceType: RecurrenceType;
};

type Props = {
  open: boolean;
  item?: FinancialItem | null;
  defaultType?: EntryType;
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (payload: FinancialEntryPayload) => Promise<void>;
};

export function FinancialEntryForm({ open, item, defaultType = 'EXPENSE', defaultDate = isoDate(), onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    amount: '',
    type: defaultType,
    category: defaultType === 'INCOME' ? incomeCategories[0] : expenseCategories[0],
    date: defaultDate,
    dueDate: '',
    paymentDate: '',
    status: 'PENDENTE',
    dueDay: '',
    isFixed: false,
    recurrenceType: 'NONE'
  });
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => (form.type === 'INCOME' ? incomeCategories : expenseCategories), [form.type]);
  const isIncome = form.type === 'INCOME';
  const dateLabel = isIncome ? 'Data do recebimento' : 'Data da saida';
  const dateHelper = isIncome ? 'Data em que o valor foi recebido' : 'Data em que o valor saiu da conta';
  const nameLabel = isIncome ? 'De onde veio o dinheiro' : 'Nome da conta ou gasto';
  const amountLabel = isIncome ? 'Valor recebido' : 'Valor pago';

  useEffect(() => {
    if (item) {
      const normalizedType = item.type.includes('INCOME') ? 'INCOME' : 'EXPENSE';
      setForm({
        name: item.name ?? item.title,
        description: item.description ?? '',
        amount: String(item.amount),
        type: normalizedType,
        category: item.category ?? 'Outros',
        date: item.date.slice(0, 10),
        dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
        paymentDate: item.paymentDate ? item.paymentDate.slice(0, 10) : '',
        status: item.status,
        dueDay: item.dueDay ? String(item.dueDay) : '',
        isFixed: item.isFixed,
        recurrenceType: item.recurrenceType
      });
      return;
    }

    setForm({
      name: '',
      description: '',
      amount: '',
      type: defaultType,
      category: defaultType === 'INCOME' ? incomeCategories[0] : expenseCategories[0],
      date: defaultDate,
      dueDate: '',
      paymentDate: '',
      status: 'PENDENTE',
      dueDay: '',
      isFixed: false,
      recurrenceType: 'NONE'
    });
  }, [item, defaultType, defaultDate, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const date = new Date(`${form.date}T00:00:00`);
    setSaving(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description || null,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        date: form.date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        dueDate: form.dueDate || null,
        paymentDate: form.paymentDate || null,
        status: form.status,
        dueDay: form.dueDay ? Number(form.dueDay) : null,
        isFixed: form.isFixed,
        recurrenceType: form.recurrenceType
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{item ? 'Editar registro financeiro' : 'Adicionar dinheiro recebido ou gasto'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="financial-entry-form" spacing={2} pt={1} onSubmit={handleSubmit}>
          <TextField select label="Este registro e o que?" value={form.type} onChange={(event) => {
            const type = event.target.value as EntryType;
            setForm({ ...form, type, category: type === 'INCOME' ? incomeCategories[0] : expenseCategories[0] });
          }}>
            <MenuItem value="INCOME">Dinheiro que entrou</MenuItem>
            <MenuItem value="EXPENSE">Conta ou gasto pago</MenuItem>
          </TextField>
          <TextField label={nameLabel} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextField select label={isIncome ? 'Tipo de entrada' : 'Tipo de despesa'} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </TextField>
          <TextField label={amountLabel} type="number" required inputProps={{ min: 0, step: '0.01' }} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <TextField label={dateLabel} helperText={dateHelper} type="date" required InputLabelProps={{ shrink: true }} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          {!isIncome ? (
            <>
              <TextField label="Data de vencimento" helperText="Dia limite para pagar essa despesa" type="date" InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              <TextField label="Data de pagamento" helperText="Preencha quando a despesa for paga" type="date" InputLabelProps={{ shrink: true }} value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value, status: event.target.value ? 'PAGO' : form.status })} />
              <TextField select label="Situacao da despesa" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'PENDENTE' | 'PAGO' | 'ATRASADO' })}>
                <MenuItem value="PENDENTE">Pendente</MenuItem>
                <MenuItem value="PAGO">Pago</MenuItem>
                <MenuItem value="ATRASADO">Atrasado</MenuItem>
              </TextField>
            </>
          ) : null}
          <TextField label={isIncome ? 'Dia em que costuma receber' : 'Dia de vencimento da conta'} type="number" inputProps={{ min: 1, max: 31 }} value={form.dueDay} onChange={(event) => setForm({ ...form, dueDay: event.target.value })} />
          <TextField label="Observacao opcional" multiline minRows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <FormControlLabel control={<Switch checked={form.isFixed} onChange={(event) => setForm({ ...form, isFixed: event.target.checked })} />} label="Repete todo mes" />
          <TextField select label="Como isso se repete?" value={form.recurrenceType} onChange={(event) => setForm({ ...form, recurrenceType: event.target.value as RecurrenceType })}>
            {Object.entries(recurrenceLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="financial-entry-form" variant="contained" disabled={saving}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
