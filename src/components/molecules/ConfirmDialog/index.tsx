import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ReactNode, useCallback, useState } from "react";
import { AppDialog, AppDialogStyles as S } from "@/components/molecules/AppDialog";

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
};

type ConfirmState = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  function close(confirmed: boolean) {
    state?.resolve(confirmed);
    setState(null);
  }

  const dialog: ReactNode = (
    <AppDialog
      open={Boolean(state)}
      onClose={() => close(false)}
      maxWidth="xs"
      title={
        <Stack direction="row" spacing={1.5} alignItems="center">
          <S.IconBadge
            $badgeBackground={
              state?.tone === "primary"
                ? "rgba(37,99,235,0.1)"
                : "rgba(220,38,38,0.1)"
            }
            $badgeColor={state?.tone === "primary" ? "#2563EB" : "#DC2626"}
          >
            <WarningAmberIcon />
          </S.IconBadge>
          <Typography variant="h6" fontWeight={950}>
            {state?.title}
          </Typography>
        </Stack>
      }
      actions={
        <>
          <Button onClick={() => close(false)}>
            {state?.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            variant="contained"
            color={state?.tone === "primary" ? "primary" : "error"}
            onClick={() => close(true)}
          >
            {state?.confirmLabel ?? "Confirmar"}
          </Button>
        </>
      }
    >
        <Typography color="text.secondary">{state?.description}</Typography>
    </AppDialog>
  );

  return { confirm, dialog };
}
