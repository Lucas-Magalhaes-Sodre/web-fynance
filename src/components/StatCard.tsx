import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ArrowDownRight, ArrowUpRight, Landmark } from 'lucide-react';
import { amountToneColor, formatMoney } from '../utils/format';

type StatCardProps = {
  label: string;
  value: number;
  tone: 'income' | 'expense' | 'balance';
};

export function StatCard({ label, value, tone }: StatCardProps) {
  const color = amountToneColor(tone, value);
  const Icon = tone === 'expense' ? ArrowDownRight : tone === 'income' ? ArrowUpRight : Landmark;

  return (
    <Paper className="soft-card" sx={{ p: 2.75, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', right: -24, top: -24, width: 96, height: 96, borderRadius: '50%', bgcolor: `${color}14` }} />
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={800} color={color}>
            {formatMoney(value)}
          </Typography>
        </Box>
        <Box width={44} height={44} borderRadius={3} display="grid" sx={{ placeItems: 'center', bgcolor: `${color}14`, color }}>
          <Icon size={22} />
        </Box>
      </Box>
    </Paper>
  );
}
