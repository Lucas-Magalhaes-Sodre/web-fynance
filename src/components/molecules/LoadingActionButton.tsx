import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

type LoadingActionButtonProps = ButtonProps & {
  loading?: boolean;
  loadingLabel?: string;
};

export function LoadingActionButton({
  children,
  disabled,
  loading = false,
  loadingLabel,
  startIcon,
  ...props
}: LoadingActionButtonProps) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress color="inherit" size={18} /> : startIcon}
    >
      {loading ? loadingLabel ?? children : children}
    </Button>
  );
}
