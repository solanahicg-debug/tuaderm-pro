import React from 'react';
import {
  LayoutDashboard,
  UserRound,
  FilePenLine,
  FolderOpenDot,
  BanknoteArrowUp,
  BanknoteArrowDown,
  ChartNoAxesCombined
} from 'lucide-react';
import type { VistaApp } from '../App';

const MenuPrincipal: React.FC<{ setVista: React.Dispatch<React.SetStateAction<VistaApp>> }> = ({ setVista }) => {
  return (
    <div className="menu-container">
      <div className="menu-title">Panel Principal</div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => setVista('dashboard')}>
          <div className="menu-icon">
            <LayoutDashboard size={38} />
          </div>
          <div className="menu-text">Dashboard</div>
        </div>

        <div className="menu-card" onClick={() => setVista('paciente')}>
          <div className="menu-icon">
            <UserRound size={38} />
          </div>
          <div className="menu-text">Ficha Paciente</div>
        </div>

        <div className="menu-card" onClick={() => setVista('sesion')}>
          <div className="menu-icon">
            <FilePenLine size={38} />
          </div>
          <div className="menu-text">Ficha Sesión</div>
        </div>

        <div className="menu-card" onClick={() => setVista('historial')}>
          <div className="menu-icon">
            <FolderOpenDot size={38} />
          </div>
          <div className="menu-text">Historial Pacientes</div>
        </div>

        <div className="menu-card" onClick={() => setVista('ingresos')}>
          <div className="menu-icon">
            <BanknoteArrowUp size={38} />
          </div>
          <div className="menu-text">Ingresos</div>
        </div>

        <div className="menu-card" onClick={() => setVista('egresos')}>
          <div className="menu-icon">
            <BanknoteArrowDown size={38} />
          </div>
          <div className="menu-text">Egresos</div>
        </div>

        <div className="menu-card" onClick={() => setVista('flujo')}>
          <div className="menu-icon">
            <ChartNoAxesCombined size={38} />
          </div>
          <div className="menu-text">Flujo Neto</div>
        </div>
      </div>
    </div>
  );
};

export default MenuPrincipal;