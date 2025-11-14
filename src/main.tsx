import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log('Main.tsx loading - Environment:', (import.meta as any).env.MODE);
console.log('Base URL:', (import.meta as any).env.BASE_URL);

createRoot(document.getElementById("root")!).render(<App />);
