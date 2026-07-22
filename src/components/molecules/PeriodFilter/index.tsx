import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { months } from "@/utils/format";

type PeriodFilterProps = {
  month: number;
  year: number;
  yearOptions: number[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

export function PeriodFilter({
  month,
  year,
  yearOptions,
  onMonthChange,
  onYearChange,
}: PeriodFilterProps) {
  return (
    <Paper className="soft-card" sx={{ p: 2, borderRadius: 4 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          select
          size="small"
          label="Mês"
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
          sx={{ minWidth: 180 }}
        >
          {months.map((label, index) => (
            <MenuItem key={label} value={index + 1}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Ano"
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          sx={{ minWidth: 140 }}
        >
          {yearOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </Paper>
  );
}
