
  import { createRoot } from "react-dom/client";
  import { BrowserRouter } from "react-router-dom";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "bootstrap/dist/css/bootstrap.min.css";

  const THEME_KEY = 'hrbrain_theme';
  const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
  const theme = savedTheme || 'light';
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <App initialTheme={theme} />
    </BrowserRouter>
  );
  