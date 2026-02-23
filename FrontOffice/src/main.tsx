
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import "bootstrap/dist/css/bootstrap.min.css";

  createRoot(document.getElementById("root")!).render(<App />);
  