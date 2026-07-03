import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/atoms/EmptyState";
import type { SavingsOverviewCategory } from "@/interfaces/financial";
import { formatMoney } from "@/utils/format";

type EconomyCategoryBoxesProps = {
  categories: SavingsOverviewCategory[];
};

export function EconomyCategoryBoxes({ categories }: EconomyCategoryBoxesProps) {
  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={950}>
        Caixinhas por categoria
      </Typography>
      <Grid container spacing={2}>
        {!categories.length ? (
          <Grid item xs={12}>
            <EmptyState message="Nenhuma caixinha com saldo ate hoje." />
          </Grid>
        ) : null}
        {categories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
            <Paper
              className="soft-card"
              sx={{
                p: 2.5,
                borderRadius: 4,
                border: `1px solid ${category.color}55`,
                height: "100%",
              }}
            >
              <Stack spacing={2}>
                <Box minWidth={0}>
                  <Tooltip title={category.name}>
                    <Typography fontWeight={950} noWrap color={category.color}>
                      {category.name}
                    </Typography>
                  </Tooltip>
                  <Typography variant="h5" fontWeight={950}>
                    {formatMoney(category.currentSavedBalance)}
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {category.items.map((item) => (
                    <Box
                      key={item.id}
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1.5}
                      sx={{ py: 0.75, borderTop: "1px solid rgba(15,23,42,0.08)" }}
                    >
                      <Tooltip title={item.name}>
                        <Typography minWidth={0} noWrap color="text.secondary" fontWeight={800}>
                          {item.name}
                        </Typography>
                      </Tooltip>
                      <Typography flexShrink={0} fontWeight={950}>
                        {formatMoney(item.currentSavedBalance)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
