import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  Wallet,
  ReceiptText,
  ChartNoAxesCombined,
} from 'lucide-react';
import { supabase } from '../api/supabase';
import { getEmpresaId } from '../config/empresa';
import { obtenerEmpresaUsuario, calcularDiasRestantes } from '../utils/empresa';

type Paciente = {
  id: string;
  nombre: string | null;
  fecha_nacimiento: string | null;
  created_at?: string | null;
};

type Sesion = {
  id: string;
  paciente_id: string | null;
  nombre?: string | null;
  fecha: string | null;
  monto: number | null;
};

type OtroIngreso = {
  id: string;
  fecha: string | null;
  monto: number | null;
};

type Egreso = {
  id: string;
  fecha: string | null;
  monto: number | null;
};

type Empresa = {
  id: string;
  nombre: string | null;
  plan: string | null;
  activa: boolean | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  demo_dias: number | null;
};

const Dashboard: React.FC = () => {
  const empresaId = getEmpresaId();

  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');

  const inicioMes = `${anio}-${mes}-01`;
  const finMesDate = new Date(anio, Number(mes), 0);
  const finMes = finMesDate.toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [sesionesMes, setSesionesMes] = useState<Sesion[]>([]);
  const [todasSesiones, setTodasSesiones] = useState<Sesion[]>([]);
  const [otrosIngresos, setOtrosIngresos] = useState<OtroIngreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);

  const formatearFecha = (fecha?: string | null) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-BO');
  };

  const cargarEmpresa = async () => {
    const data = await obtenerEmpresaUsuario();
    setEmpresa((data || null) as Empresa | null);
  };

  const cargarDatos = async () => {
    setLoading(true);

    const [
      pacientesRes,
      sesionesMesRes,
      todasSesionesRes,
      otrosRes,
      egresosRes,
    ] = await Promise.all([
      supabase
        .from('pacientes')
        .select('id, nombre, fecha_nacimiento, created_at')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false }),

      supabase
        .from('sesiones')
        .select('id, paciente_id, nombre, fecha, monto')
        .eq('empresa_id', empresaId)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes)
        .order('fecha', { ascending: false }),

      supabase
        .from('sesiones')
        .select('id, paciente_id, nombre, fecha, monto')
        .eq('empresa_id', empresaId)
        .order('fecha', { ascending: false }),

      supabase
        .from('otros_ingresos')
        .select('id, fecha, monto')
        .eq('empresa_id', empresaId)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes),

      supabase
        .from('egresos')
        .select('id, fecha, monto')
        .eq('empresa_id', empresaId)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes),
    ]);

    setLoading(false);

    if (
      pacientesRes.error ||
      sesionesMesRes.error ||
      todasSesionesRes.error ||
      otrosRes.error ||
      egresosRes.error
    ) {
      alert(
        pacientesRes.error?.message ||
          sesionesMesRes.error?.message ||
          todasSesionesRes.error?.message ||
          otrosRes.error?.message ||
          egresosRes.error?.message ||
          'Error cargando dashboard'
      );
      return;
    }

    setPacientes((pacientesRes.data || []) as Paciente[]);
    setSesionesMes((sesionesMesRes.data || []) as Sesion[]);
    setTodasSesiones((todasSesionesRes.data || []) as Sesion[]);
    setOtrosIngresos((otrosRes.data || []) as OtroIngreso[]);
    setEgresos((egresosRes.data || []) as Egreso[]);
  };

  useEffect(() => {
    cargarEmpresa();
    cargarDatos();
  }, []);

  const totalPacientes = pacientes.length;
  const totalSesionesMes = sesionesMes.length;

  const totalIngresosMes = useMemo(() => {
    const sesionesMonto = sesionesMes.reduce((acc, item) => acc + Number(item.monto || 0), 0);
    const otrosMonto = otrosIngresos.reduce((acc, item) => acc + Number(item.monto || 0), 0);
    return sesionesMonto + otrosMonto;
  }, [sesionesMes, otrosIngresos]);

  const totalEgresosMes = useMemo(
    () => egresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [egresos]
  );

  const flujoNetoMes = totalIngresosMes - totalEgresosMes;

  const proximosCumples = useMemo(() => {
    const hoyBase = new Date();
    hoyBase.setHours(0, 0, 0, 0);

    return pacientes
      .filter((p) => p.fecha_nacimiento)
      .map((p) => {
        const fechaTexto = (p.fecha_nacimiento || '').trim();

        let dia = 0;
        let mesNac = 0;
        let anioNac = 0;

        if (fechaTexto.includes('/')) {
          const partes = fechaTexto.split('/');
          if (partes.length === 3) {
            dia = Number(partes[0]);
            mesNac = Number(partes[1]);
            anioNac = Number(partes[2]);
          }
        } else if (fechaTexto.includes('-')) {
          const partes = fechaTexto.split('-');
          if (partes.length === 3) {
            anioNac = Number(partes[0]);
            mesNac = Number(partes[1]);
            dia = Number(partes[2]);
          }
        }

        if (!dia || !mesNac || !anioNac) {
          return {
            ...p,
            dias: 9999,
            edadCumple: 0,
            mesDia: 'Fecha inválida',
          };
        }

        const fechaNacimiento = new Date(anioNac, mesNac - 1, dia);

        let cumpleProximo = new Date(hoyBase.getFullYear(), mesNac - 1, dia);
        cumpleProximo.setHours(0, 0, 0, 0);

        if (cumpleProximo < hoyBase) {
          cumpleProximo = new Date(hoyBase.getFullYear() + 1, mesNac - 1, dia);
          cumpleProximo.setHours(0, 0, 0, 0);
        }

        const diff = Math.round(
          (cumpleProximo.getTime() - hoyBase.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          ...p,
          dias: diff,
          edadCumple: cumpleProximo.getFullYear() - fechaNacimiento.getFullYear(),
          mesDia: `${String(dia).padStart(2, '0')}/${String(mesNac).padStart(2, '0')}`,
        };
      })
      .filter((p) => p.dias >= 0 && p.dias <= 7)
      .sort((a, b) => a.dias - b.dias);
  }, [pacientes]);

  const pacientesSinSesionReciente = useMemo(() => {
    const hoyTime = new Date().getTime();
    const ultimasSesiones = new Map<string, string>();

    todasSesiones.forEach((s) => {
      if (!s.paciente_id || !s.fecha) return;
      const actual = ultimasSesiones.get(s.paciente_id);
      if (!actual || s.fecha > actual) {
        ultimasSesiones.set(s.paciente_id, s.fecha);
      }
    });

    return pacientes
      .map((p) => {
        const ultima = ultimasSesiones.get(p.id);
        if (!ultima) {
          return { ...p, ultimaSesion: 'Sin sesiones', dias: 9999 };
        }

        const diff = Math.floor(
          (hoyTime - new Date(ultima).getTime()) / (1000 * 60 * 60 * 24)
        );

        return { ...p, ultimaSesion: ultima, dias: diff };
      })
      .filter((p) => p.dias >= 30)
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 5);
  }, [pacientes, todasSesiones]);

  const pagosBajos = useMemo(() => {
    return sesionesMes
      .filter((s) => Number(s.monto || 0) > 0 && Number(s.monto || 0) <= 100)
      .slice(0, 5);
  }, [sesionesMes]);

  const diasSinIngresos = useMemo(() => {
    const diasDelMes = new Date(anio, Number(mes), 0).getDate();
    const diasConIngresos = new Set<string>();

    sesionesMes.forEach((s) => {
      if (s.fecha) diasConIngresos.add(s.fecha);
    });

    otrosIngresos.forEach((i) => {
      if (i.fecha) diasConIngresos.add(i.fecha);
    });

    let count = 0;
    for (let d = 1; d <= diasDelMes; d++) {
      const fecha = `${anio}-${mes}-${String(d).padStart(2, '0')}`;
      if (!diasConIngresos.has(fecha)) count += 1;
    }

    return count;
  }, [sesionesMes, otrosIngresos, anio, mes]);

  const diasRestantes = calcularDiasRestantes(empresa?.fecha_vencimiento || null);

  const fechaInicioEmpresa = empresa?.fecha_inicio ? new Date(empresa.fecha_inicio) : null;
  const hoyBase = new Date();
  hoyBase.setHours(0, 0, 0, 0);

  const demoAunNoInicia =
    fechaInicioEmpresa
      ? new Date(
          fechaInicioEmpresa.getFullYear(),
          fechaInicioEmpresa.getMonth(),
          fechaInicioEmpresa.getDate()
        ).getTime() > hoyBase.getTime()
      : false;

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">DASHBOARD PRINCIPAL</div>
      </div>

      {empresa && (
        <div className="empresa-banner">
          <div className="empresa-nombre">🏢 {empresa.nombre || 'Empresa'}</div>

          <div className="empresa-info">
            📦 Plan: {empresa.plan || 'Sin plan'}
          </div>

          <div className="empresa-info">
            🚀 Inicio: {formatearFecha(empresa.fecha_inicio)}
          </div>

          <div
            className="empresa-dias"
            style={{
              color:
                diasRestantes !== null && diasRestantes <= 3
                  ? '#b55f6a'
                  : '#6d5c6d',
            }}
          >
            {demoAunNoInicia
              ? `⏳ Inicia el ${formatearFecha(empresa.fecha_inicio)}`
              : diasRestantes !== null
              ? diasRestantes > 0
                ? `⏳ ${diasRestantes} día(s) restantes · vence ${formatearFecha(
                    empresa.fecha_vencimiento
                  )}`
                : `⛔ Demo vencido · venció ${formatearFecha(empresa.fecha_vencimiento)}`
              : '⏳ Sin vencimiento'}
          </div>
        </div>
      )}

      <div className="ingresos-resumen">
        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <Users size={18} />
            <span>Pacientes</span>
          </div>
          <div className="ingreso-card-value">{totalPacientes}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <FileText size={18} />
            <span>Sesiones del mes</span>
          </div>
          <div className="ingreso-card-value">{totalSesionesMes}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <Wallet size={18} />
            <span>Ingresos del mes</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalIngresosMes.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <ReceiptText size={18} />
            <span>Egresos del mes</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalEgresosMes.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <ChartNoAxesCombined size={18} />
            <span>Flujo neto</span>
          </div>
          <div
            className="ingreso-card-value"
            style={{ color: flujoNetoMes >= 0 ? '#6d5c6d' : '#b55f6a' }}
          >
            Bs. {flujoNetoMes.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="quick-alerts-grid">
        <div className="quick-alert-card">
          <div className="quick-alert-title">Cumpleaños cercanos</div>
          <div className="quick-alert-value">{proximosCumples.length}</div>
          <div className="quick-alert-sub">Próximos 7 días</div>
        </div>

        <div className="quick-alert-card">
          <div className="quick-alert-title">Pacientes sin volver</div>
          <div className="quick-alert-value">{pacientesSinSesionReciente.length}</div>
          <div className="quick-alert-sub">Más de 30 días</div>
        </div>

        <div className="quick-alert-card">
          <div className="quick-alert-title">Pagos bajos</div>
          <div className="quick-alert-value">{pagosBajos.length}</div>
          <div className="quick-alert-sub">Sesiones ≤ Bs. 100</div>
        </div>

        <div className="quick-alert-card">
          <div className="quick-alert-title">Días sin ingresos</div>
          <div className="quick-alert-value">{diasSinIngresos}</div>
          <div className="quick-alert-sub">En el mes actual</div>
        </div>
      </div>

      <div className="section-header">PRÓXIMOS CUMPLEAÑOS</div>
      <div className="ingresos-tabla-wrap">
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Cumple</th>
                <th className="px-4 py-3">Edad</th>
                <th className="px-4 py-3">Faltan</th>
              </tr>
            </thead>
            <tbody>
              {proximosCumples.map((p) => (
                <tr key={p.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3">{p.mesDia}</td>
                  <td className="px-4 py-3">{p.edadCumple}</td>
                  <td className="px-4 py-3">
                    {p.dias === 0 ? 'Hoy' : `${p.dias} día(s)`}
                  </td>
                </tr>
              ))}

              {!loading && proximosCumples.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No hay cumpleaños en los próximos 7 días
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-header">PACIENTES SIN MOVIMIENTO RECIENTE</div>
      <div className="ingresos-tabla-wrap">
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Última sesión</th>
                <th className="px-4 py-3">Inactividad</th>
              </tr>
            </thead>
            <tbody>
              {pacientesSinSesionReciente.map((p) => (
                <tr key={p.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3">{p.ultimaSesion}</td>
                  <td className="px-4 py-3">
                    {p.dias === 9999 ? 'Sin sesiones' : `${p.dias} días`}
                  </td>
                </tr>
              ))}

              {!loading && pacientesSinSesionReciente.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No hay pacientes con inactividad mayor a 30 días
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-header">PAGOS BAJOS DEL MES</div>
      <div className="mini-card-list">
        {pagosBajos.length > 0 ? (
          pagosBajos.map((s) => (
            <div key={s.id} className="mini-card">
              <div className="mini-card-title">Sesión con pago bajo</div>
              <div className="mini-card-sub">
                Fecha: {s.fecha || '—'} · Monto: Bs. {Number(s.monto || 0).toFixed(2)}
              </div>
            </div>
          ))
        ) : (
          <div className="mini-card">
            <div className="mini-card-title">Sin alertas</div>
            <div className="mini-card-sub">
              No hay sesiones con monto menor o igual a Bs. 100 este mes.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;