import TextField, { type TextFieldProps } from "@mui/material/TextField";
import { currencyCaretPosition, currencyDigits, digitsToCurrency } from "@/utils/format";

type MoneyTextFieldProps = Omit<TextFieldProps, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export function MoneyTextField({ value, onValueChange, ...props }: MoneyTextFieldProps) {
  return (
    <TextField
      {...props}
      value={value}
      onChange={(event) => {
        const input = event.currentTarget;
        const caret = input.selectionStart ?? input.value.length;
        const wasEditingAtEnd = caret >= input.value.length;
        const digitsBeforeCaret = currencyDigits(input.value.slice(0, caret)).length;
        const nextValue = digitsToCurrency(input.value);
        const nextCaret = wasEditingAtEnd
          ? nextValue.length
          : currencyCaretPosition(nextValue, digitsBeforeCaret);

        onValueChange(nextValue);
        window.requestAnimationFrame(() => {
          input.setSelectionRange(nextCaret, nextCaret);
        });
      }}
    />
  );
}
