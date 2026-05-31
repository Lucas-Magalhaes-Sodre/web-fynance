import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

export function EmptyState({ message }: { message: string }) {
  return (
    <Paper sx={{ p: 3, border: '1px dashed #CBD5E1', boxShadow: 'none', textAlign: 'center', color: 'text.secondary' }}>
      <Typography>{message}</Typography>
    </Paper>
  );
}
