import Dialog, { type DialogProps } from "@mui/material/Dialog";
import type { ReactNode } from "react";
import * as S from "./styles";

type AppDialogProps = {
  open: boolean;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  maxWidth?: DialogProps["maxWidth"];
  titleAccent?: string;
};

export function AppDialog({
  open,
  title,
  eyebrow,
  children,
  actions,
  onClose,
  maxWidth = "sm",
  titleAccent,
}: AppDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <S.Header>
        {eyebrow ? (
          <S.ColoredEyebrow variant="overline" $accent={titleAccent}>
            {eyebrow}
          </S.ColoredEyebrow>
        ) : null}
        {typeof title === "string" ? (
          <S.Heading variant="h5">{title}</S.Heading>
        ) : (
          title
        )}
      </S.Header>
      <S.Content>{children}</S.Content>
      <S.Actions>{actions}</S.Actions>
    </Dialog>
  );
}

export * as AppDialogStyles from "./styles";
