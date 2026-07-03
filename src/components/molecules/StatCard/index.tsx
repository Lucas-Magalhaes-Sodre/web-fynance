import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ArrowDownRight, ArrowUpRight, PiggyBank, ThumbsDown, ThumbsUp, Wallet } from 'lucide-react';
import { amountToneColor, formatMoney } from '@/utils/format';

type StatCardProps = {
  label: string;
  value: number;
  tone: 'income' | 'expense' | 'balance' | 'saving' | 'neutral';
  helperText?: string;
  onClick?: () => void;
};

export function StatCard({ label, value, tone, helperText, onClick }: StatCardProps) {
  const color = amountToneColor(tone, value);
  const Icon = tone === 'expense'
    ? ArrowDownRight
    : tone === 'income'
      ? ArrowUpRight
      : tone === 'saving'
        ? PiggyBank
        : tone === 'neutral'
          ? Wallet
          : value > 0
            ? ThumbsUp
            : value < 0
              ? ThumbsDown
              : Wallet;

  return (
    <Paper
      className="soft-card"
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: '0 18px 36px rgba(15,23,42,0.14)'
            }
          : undefined
      }}
    >
      <Box sx={{ position: 'absolute', right: -18, top: -22, width: 82, height: 82, borderRadius: '50%', bgcolor: `${color}14` }} />
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={1.5}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={700}>
            {label}
          </Typography>
          {helperText ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {helperText}
            </Typography>
          ) : null}
          <Typography variant="h5" fontWeight={800} color={color} sx={{ fontSize: { xs: 22, md: 24 } }}>
            {formatMoney(value)}
          </Typography>
        </Box>
        <Box width={40} height={40} borderRadius={2.5} display="grid" sx={{ placeItems: 'center', bgcolor: `${color}14`, color }}>
          <Icon size={20} />
        </Box>
      </Box>
    </Paper>
  );
}
