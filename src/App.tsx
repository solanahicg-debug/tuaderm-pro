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
  Users,
} from "lucide-react";

import FichaPaciente from "./features/FichaPaciente";
import FichaSesion from "./features/FichaSesion";
import HistorialPacientes from "./features/HistorialPacientes";
import Ingresos from "./features/Ingresos";
import Egresos from "./features/Egresos";
import FlujoNeto from "./features/FlujoNeto";
import Dashboard from "./features/Dashboard";
import Login from "./features/Login";
import BloqueoDemo from "./features/BloqueoDemo";
import UsuariosAdmin from "./features/UsuariosAdmin";

import { obtenerUsuarioActual, cerrarSesionAuth } from "./utils/auth";
import {
  obtenerPerfilUsuario,
  type PerfilUsuario,
  type RolApp,
} from "./utils/perfil";
import {
  obtenerEmpresaPorId,
  empresaEstaVencida,
  empresaEsDemo,
  empresaEsPremium,
  empresaEsBasica,
  obtenerNombrePlan,
  type Empresa,
} from "./utils/empresa";
import { setEmpresaId } from "./config/empresa";
import { supabase } from "./api/supabase";

export type VistaApp =
  | "dashboard"
  | "paciente"
  | "sesion"
  | "historial"
  | "ingresos"
  | "egresos"
  | "flujo"
  | "usuarios";

type NavItem = {
  key: VistaApp;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  rolesPermitidos: RolApp[];
  requierePremium?: boolean;
};

const navItems: NavItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    rolesPermitidos: ["admin", "recepcion", "doctor", "demo", "usuario"],
  },
  {
    key: "paciente",
    label: "Ficha Paciente",
    icon: UserRound,
    rolesPermitidos: ["admin", "recepcion", "doctor", "demo"],
  },
  {
    key: "sesion",
    label: "Ficha Sesión",
    icon: ClipboardPenLine,
    rolesPermitidos: ["admin", "recepcion", "doctor"],
  },
  {
    key: "historial",
    label: "Historial",
    icon: FolderOpen,
    rolesPermitidos: ["admin", "recepcion", "doctor", "demo"],
  },
  {
    key: "ingresos",
    label: "Ingresos",
    icon: Wallet,
    rolesPermitidos: ["admin"],
    requierePremium: true,
  },
  {
    key: "egresos",
    label: "Egresos",
    icon: ReceiptText,
    rolesPermitidos: ["admin"],
    requierePremium: true,
  },
  {
    key: "flujo",
    label: "Flujo Neto",
    icon: ChartNoAxesCombined,
    rolesPermitidos: ["admin"],
    requierePremium: true,
  },
  {
    key: "usuarios",
    label: "Usuarios",
    icon: Users,
    rolesPermitidos: ["admin"],
  },
];

export default function App() {
  const [vista, setVista] = useState<VistaApp>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresaVencida, setEmpresaVencida] = useState(false);

  const rolActual: RolApp = (perfil?.rol as RolApp) || "usuario";
  const planActual = obtenerNombrePlan(empresa?.plan);

  const esDemoEmpresa = empresaEsDemo(empresa);
  const esPremiumEmpresa = empresaEsPremium(empresa);
  const esBasicaEmpresa = empresaEsBasica(empresa);

  const empresaNombre = empresa?.nombre || "TUADERM";
  const empresaSubtitulo = `Plan: ${planActual}`;

  const navPermitido = useMemo(() => {
    return navItems.filter((item) => {
      const rolOk = item.rolesPermitidos.includes(rolActual);
      const planOk = item.requierePremium ? esPremiumEmpresa : true;
      return rolOk && planOk;
    });
  }, [rolActual, esPremiumEmpresa]);

  const vistaPermitida = useMemo(() => {
    return navItems.some((item) => {
      const rolOk = item.rolesPermitidos.includes(rolActual);
      const planOk = item.requierePremium ? esPremiumEmpresa : true;
      return item.key === vista && rolOk && planOk;
    });
  }, [vista, rolActual, esPremiumEmpresa]);

  const tituloVista = useMemo(() => {
    return navItems.find((item) => item.key === vista)?.label || "Dashboard";
  }, [vista]);

  const limpiarEstadoSesion = () => {
    setEmpresaId(null);
    setLogueado(false);
    setPerfil(null);
    setEmpresa(null);
    setEmpresaVencida(false);
  };

  const cargarSesion = async () => {
    try {
      const user = await obtenerUsuarioActual();

      if (!user) {
        limpiarEstadoSesion();
        return;
      }

      const perfilUsuario = await obtenerPerfilUsuario(user.id);

      if (!perfilUsuario) {
        console.error("No existe perfil para este usuario:", user.id);
        limpiarEstadoSesion();
        return;
      }

      setEmpresaId(perfilUsuario.empresa_id);

      const empresaUsuario = await obtenerEmpresaPorId(perfilUsuario.empresa_id);

      setPerfil(perfilUsuario);
      setEmpresa(empresaUsuario);
      setEmpresaVencida(empresaEstaVencida(empresaUsuario));
      setLogueado(true);
    } catch (error) {
      console.error("Error cargando sesión:", error);
      limpiarEstadoSesion();
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

  useEffect(() => {
    if (!perfil?.rol) return;
    if (navPermitido.length === 0) return;

    const vistaActualPermitida = navPermitido.some((item) => item.key === vista);

    if (!vistaActualPermitida) {
      setVista(navPermitido[0].key);
    }
  }, [perfil?.rol, vista, navPermitido]);

  const cerrarSesion = async () => {
    try {
      await cerrarSesionAuth();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setEmpresaId(null);
      setLogueado(false);
      setPerfil(null);
      setEmpresa(null);
      setEmpresaVencida(false);
      setMenuOpen(false);
      setVista("dashboard");
    }
  };

  const renderVista = () => {
    const esAdmin = perfil?.rol === "admin";

    if (!vistaPermitida) {
      const itemActual = navItems.find((item) => item.key === vista);
      const moduloPremium = itemActual?.requierePremium === true;

      return (
        <div className="ficha-container" style={{ maxWidth: 700 }}>
          <div className="ficha-header">
            <div className="ficha-title">Acceso restringido</div>
          </div>

          <div style={{ padding: "12px 0" }}>
            {moduloPremium
              ? "Este módulo está disponible solo para empresas con plan Premium o Pro."
              : "No tienes permisos para acceder a este módulo."}
          </div>
        </div>
      );
    }

    switch (vista) {
      case "dashboard":
        return <Dashboard />;
      case "paciente":
        return <FichaPaciente />;
      case "sesion":
        return <FichaSesion />;
      case "historial":
        return <HistorialPacientes esAdmin={esAdmin} />;
      case "ingresos":
        return <Ingresos esAdmin={esAdmin} />;
      case "egresos":
        return <Egresos esAdmin={esAdmin} />;
      case "flujo":
        return <FlujoNeto />;
      case "usuarios":
        return (
          <UsuariosAdmin
            empresaId={perfil?.empresa_id || ""}
            esAdmin={esAdmin}
          />
        );
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

  if (empresaVencida) {
    return (
      <BloqueoDemo
        empresaNombre={empresa?.nombre}
        fechaVencimiento={empresa?.fecha_vencimiento}
      />
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
          {navPermitido.map((item) => {
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
                {esDemoEmpresa ? " · Empresa Demo" : ""}
                {esBasicaEmpresa ? " · Plan Básico" : ""}
                {esPremiumEmpresa ? " · Plan Premium" : ""}
              </div>
            </div>
          </div>
        </header>

        <main className="app-content">{renderVista()}</main>
      </div>
    </div>
  );
}