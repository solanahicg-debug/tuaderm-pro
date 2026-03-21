import { useState } from "react";
import {
  LayoutDashboard,
  UserRound,
  ClipboardPenLine,
  FolderOpen,
  Wallet,
  ReceiptText,
  ChartNoAxesCombined,
  Menu,
  X,
} from "lucide-react";

import FichaPaciente from "./features/FichaPaciente";
import FichaSesion from "./features/FichaSesion";
import HistorialPacientes from "./features/HistorialPacientes";
import Ingresos from "./features/Ingresos";
import Egresos from "./features/Egresos";
import FlujoNeto from "./features/FlujoNeto";
import Dashboard from "./features/Dashboard";

export type VistaApp =
  | "dashboard"
  | "paciente"
  | "sesion"
  | "historial"
  | "ingresos"
  | "egresos"
  | "flujo";

type NavItem = {
  key: VistaApp;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "paciente", label: "Ficha Paciente", icon: UserRound },
  { key: "sesion", label: "Ficha Sesión", icon: ClipboardPenLine },
  { key: "historial", label: "Historial", icon: FolderOpen },
  { key: "ingresos", label: "Ingresos", icon: Wallet },
  { key: "egresos", label: "Egresos", icon: ReceiptText },
  { key: "flujo", label: "Flujo Neto", icon: ChartNoAxesCombined },
];

export default function App() {
  const [vista, setVista] = useState<VistaApp>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const renderVista = () => {
    switch (vista) {
      case "dashboard":
        return <Dashboard />;
      case "paciente":
        return <FichaPaciente />;
      case "sesion":
        return <FichaSesion />;
      case "historial":
        return <HistorialPacientes />;
      case "ingresos":
        return <Ingresos />;
      case "egresos":
        return <Egresos />;
      case "flujo":
        return <FlujoNeto />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div
      className="app-shell"
      style={{ background: "var(--background)" }}
    >
      <aside className={`app-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="app-brand">
          <div className="app-brand-badge">T</div>
          <div>
            <div className="app-brand-title">TUADERM</div>
            <div className="app-brand-subtitle">Sistema Clínico</div>
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = vista === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`app-nav-item ${active ? "active" : ""}`}
                onClick={() => {
                  setVista(item.key);
                  setMenuOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {menuOpen && (
        <div
          className="app-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-menu-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div>
              <div className="app-page-title">
                {navItems.find((item) => item.key === vista)?.label}
              </div>
              <div className="app-page-subtitle">
                Centro estético · gestión diaria
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">{renderVista()}</main>
      </div>
    </div>
  );
}