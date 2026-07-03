import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0F766E" },
    secondary: { main: "#F59E0B" },
    background: { default: "#F7FAF9" },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),
  },
});
