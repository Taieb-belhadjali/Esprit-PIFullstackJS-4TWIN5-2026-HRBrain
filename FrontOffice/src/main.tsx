import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App.tsx";
import "./styles/index.css";
// Bootstrap removed — all styles use Tailwind CSS
import { CursorProvider } from "./app/context/CursorContext.tsx";
import { ReadingMaskProvider } from "./app/context/ReadingMaskContext.tsx";
import { ReadingMask } from "./app/components/accessibility/ReadingMask.tsx";

const THEME_KEY = 'hrbrain_theme';
const savedTheme = localStorage.getItem(THEME_KEY) as 'light' | 'dark' | null;
const theme = savedTheme === 'dark' ? 'dark' : 'light';
// Appliquer le thème immédiatement avant le rendu React
document.documentElement.classList.toggle('dark', theme === 'dark');

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <CursorProvider>
      <ReadingMaskProvider>
        <ReadingMask />
        <App initialTheme={theme} />
      </ReadingMaskProvider>
    </CursorProvider>
  </BrowserRouter>
);
