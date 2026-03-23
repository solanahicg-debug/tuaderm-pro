import { useEffect, useMemo, useState } from "react";
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
  LogOut,
} from "lucide-react";

import FichaPaciente from "./features/FichaPaciente";
import FichaSesion from "./features/FichaSesion";
import HistorialPacientes from "./features/HistorialPacientes";
import Ingresos from "./features/Ingresos";
import Egresos from "./features/Egresos";
import FlujoNeto from "./features/FlujoNeto";
import Dashboard from "./features/Dashboard";
import Login from "./features/Login";

import { obtenerUsuarioActual, cerrarSesionAuth } from "./utils/auth";
import { obtenerPerfilUsuario } from "./utils/perfil";
import { setEmpresaId } from "./config/empresa";
import { supabase } from "./api/supabase";

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

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);

  const empresaNombre = "TUADERM";
  const empresaSubtitulo = "Sistema Clínico";

  const tituloVista = useMemo(() => {
    return navItems.find((item) => item.key === vista)?.label || "Dashboard";
  }, [vista]);

  const cargarSesion = async () => {
    try {
      const user = await obtenerUsuarioActual();

      if (!user) {
        setLogueado(false);
        setPerfil(null);
        setCargandoSesion(false);
        return;
      }

      const perfilUsuario = await obtenerPerfilUsuario(user.id);

      setEmpresaId(perfilUsuario.empresa_id);
      setPerfil(perfilUsuario);
      setLogueado(true);
    } catch (error) {
      console.error("Error cargando sesión:", error);
      setLogueado(false);
      setPerfil(null);
    } finally {
      setCargandoSesion(false);
    }
  };

  useEffect(() => {
    cargarSesion();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      cargarSesion();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const cerrarSesion = async () => {
    await cerrarSesionAuth();
    setLogueado(false);
    setPerfil(null);
    setMenuOpen(false);
  };

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

  if (cargandoSesion) {
    return (
      <div className="app-shell" style={{ background: "var(--background)" }}>
        <div className="ficha-container" style={{ maxWidth: 420, marginTop: 60 }}>
          <div className="ficha-header">
            <div className="ficha-title">Cargando sesión...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!logueado) {
    return (
      <div className="app-shell" style={{ background: "var(--background)" }}>
        <div className="app-main">
          <main className="app-content">
            <Login onLoginSuccess={cargarSesion} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ background: "var(--background)" }}>
      <aside className={`app-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="app-brand">
          <div className="app-brand-badge">T</div>
          <div className="app-brand-texts">
            <div className="app-brand-title">{empresaNombre}</div>
            <div className="app-brand-subtitle">{empresaSubtitulo}</div>
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

          <button
            type="button"
            className="app-nav-item"
            onClick={cerrarSesion}
          >
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      {menuOpen && <div className="app-overlay" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-menu-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Abrir menú"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="app-topbar-texts">
              <div className="app-page-title">{tituloVista}</div>
              <div className="app-page-subtitle">
                {perfil?.nombre || "Usuario"} · {perfil?.rol || "usuario"}
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">{renderVista()}</main>
      </div>
    </div>
  );

if (true) {
  return (
    <div className="app-shell" style={{ background: "var(--background)" }}>
      <div className="app-main">
        <main className="app-content">
          <Login onLoginSuccess={() => {}} />
        </main>
      </div>
    </div>
  );
}
}