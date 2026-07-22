import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import styled from "styled-components";

export const HeroCard = styled(Paper)`
  padding: 16px;
  border-radius: 16px;

  @media (min-width: 900px) {
    padding: 20px 26px;
  }
`;

export const HeroActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px 14px;
  min-width: 100%;

  @media (min-width: 600px) {
    grid-template-columns: repeat(2, minmax(172px, 1fr));
  }

  @media (min-width: 900px) {
    min-width: 372px;
  }
`;

export const HeroActionButton = styled(Button)<{
  $tone: "income" | "expense" | "saving" | "withdraw";
}>`
  min-height: 38px;
  justify-content: flex-start;
  padding: 8px 14px;
  border-radius: 8px;
  text-transform: none;
  font-weight: 850;
  letter-spacing: 0;
  box-shadow: none;

  ${({ $tone }) =>
    $tone === "income"
      ? `
        color: #2563eb;
        border-color: rgba(37, 99, 235, 0.18);
        background-color: rgba(239, 246, 255, 0.78);
      `
      : $tone === "expense"
        ? `
        color: #ea580c;
        border-color: rgba(234, 88, 12, 0.18);
        background-color: rgba(255, 247, 237, 0.78);
      `
        : $tone === "saving"
          ? `
        color: #d4a017;
        border-color: rgba(212, 160, 23, 0.24);
        background-color: rgba(255, 251, 235, 0.78);
      `
          : `
        color: #16a34a;
        border-color: rgba(22, 163, 74, 0.18);
        background-color: rgba(240, 253, 244, 0.78);
      `}

  &:hover {
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
    ${({ $tone }) =>
      $tone === "income"
        ? `
          border-color: rgba(37, 99, 235, 0.34);
          background-color: rgba(239, 246, 255, 0.96);
        `
        : $tone === "expense"
          ? `
          border-color: rgba(234, 88, 12, 0.34);
          background-color: rgba(255, 247, 237, 0.96);
        `
          : $tone === "saving"
            ? `
          border-color: rgba(212, 160, 23, 0.42);
          background-color: rgba(255, 251, 235, 0.96);
        `
            : `
          border-color: rgba(22, 163, 74, 0.34);
          background-color: rgba(240, 253, 244, 0.96);
        `}
  }
`;

export const HeroActionIcon = styled.span<{
  $tone: "income" | "expense" | "saving" | "withdraw";
}>`
  width: 20px;
  height: 20px;
  border-radius: 5px;
  display: inline-grid;
  place-items: center;
  margin-right: 8px;
  color: white;
  flex: 0 0 auto;

  ${({ $tone }) =>
    $tone === "income"
      ? "background-color: #2563eb;"
      : $tone === "expense"
        ? "background-color: #ea580c;"
        : $tone === "saving"
          ? "background-color: #f59e0b;"
          : "background-color: #16a34a;"}
`;

export const IncomeButton = styled(Button)`
  min-height: 40px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 10px;
  background-color: #2563eb;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
  font-weight: 950;
  letter-spacing: 0;

  &:hover {
    background-color: #1d4ed8;
    box-shadow: 0 16px 34px rgba(37, 99, 235, 0.28);
  }
`;

export const ExpenseButton = styled(Button)`
  min-height: 40px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 10px;
  border-color: rgba(234, 88, 12, 0.42);
  color: #ea580c;
  background-color: rgba(255, 247, 237, 0.72);
  font-weight: 950;
  letter-spacing: 0;

  &:hover {
    border-color: #ea580c;
    background-color: rgba(255, 237, 213, 0.72);
    box-shadow: 0 14px 28px rgba(234, 88, 12, 0.16);
  }

  :root[data-theme='dark'] & {
    color: #fb923c;
    border-color: rgba(251, 146, 60, 0.38);
    background-color: rgba(124, 45, 18, 0.24);
  }

  :root[data-theme='dark'] &:hover {
    border-color: rgba(251, 146, 60, 0.58);
    background-color: rgba(124, 45, 18, 0.34);
  }
`;

export const SavingButton = styled(Button)`
  min-height: 40px;
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 10px;
  border-color: rgba(212, 160, 23, 0.5);
  color: #d4a017;
  background-color: rgba(255, 248, 219, 0.72);
  font-weight: 950;
  letter-spacing: 0;

  &:hover {
    border-color: #d4a017;
    background-color: rgba(255, 248, 219, 0.92);
    box-shadow: 0 14px 28px rgba(212, 160, 23, 0.18);
  }

  :root[data-theme='dark'] & {
    color: #fbbf24;
    border-color: rgba(251, 191, 36, 0.38);
    background-color: rgba(113, 63, 18, 0.24);
  }

  :root[data-theme='dark'] &:hover {
    border-color: rgba(251, 191, 36, 0.58);
    background-color: rgba(113, 63, 18, 0.34);
  }
`;

export const FilterCard = styled(Paper)`
  padding: 10px 16px;
  border-radius: 24px;
`;

export const YearField = styled(TextField)`
  width: 190px;
`;

export const YearIconButton = styled(IconButton)`
  border: 1px solid rgba(15, 23, 42, 0.12);
  background-color: var(--mr-card);
`;

export const SectionCard = styled(Paper)`
  padding: 24px;
  border-radius: 32px;
`;

export const TableCard = styled(Paper)`
  border-radius: 32px;
  overflow: hidden;
`;

export const WeekCard = styled(Paper)`
  padding: 16px;
  border: 1px solid #e5e7eb;
  box-shadow: none;
`;
