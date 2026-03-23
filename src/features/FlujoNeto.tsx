import React, { useEffect, useMemo, useState } from 'react';
import {
  BanknoteArrowUp,
  BanknoteArrowDown,
  ChartNoAxesCombined,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { supabase } from '../api/supabase';
import { getEmpresaId } from '../config/empresa';
import { exportarExcel, exportarPdfTabla } from '../utils/exportUtils';

type SesionIngreso = {
  id: string;
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

const FlujoNeto: React.FC = () => {
  const empresaId = getEmpresaId();

  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear());

  const [loading, setLoading] = useState(false);
  const [sesiones, setSesiones] = useState<SesionIngreso[]>([]);
  const [otrosIngresos, setOtrosIngresos] = useState<OtroIngreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [mesFiltro, setMesFiltro] = useState(mesActual);
  const [anioFiltro, setAnioFiltro] = useState(anioActual);

  const inicioMes = `${anioFiltro}-${mesFiltro}-01`;
  const finMesDate = new Date(Number(anioFiltro), Number(mesFiltro), 0);
  const finMes = finMesDate.toISOString().split('T')[0];

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const cargarDatos = async () => {
    setLoading(true);

    const [sesionesRes, otrosRes, egresosRes] = await Promise.all([
      supabase
        .from('sesiones')
        .select('id, fecha, monto')
        .eq('empresa_id', empresaId)
        .gte('fecha', inicioMes)
        .lte('fecha', finMes),

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

    if (sesionesRes.error || otrosRes.error || egresosRes.error) {
      setToast({
        type: 'error',
        text:
          sesionesRes.error?.message ||
          otrosRes.error?.message ||
          egresosRes.error?.message ||
          'Error cargando datos',
      });
      return;
    }

    setSesiones((sesionesRes.data || []) as SesionIngreso[]);
    setOtrosIngresos((otrosRes.data || []) as OtroIngreso[]);
    setEgresos((egresosRes.data || []) as Egreso[]);
  };

  useEffect(() => {
    cargarDatos();
  }, [mesFiltro, anioFiltro]);

  const totalSesiones = useMemo(
    () => sesiones.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [sesiones]
  );

  const totalOtrosIngresos = useMemo(
    () => otrosIngresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [otrosIngresos]
  );

  const totalIngresos = totalSesiones + totalOtrosIngresos;

  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [egresos]
  );

  const flujoNeto = totalIngresos - totalEgresos;
  const esGanancia = flujoNeto >= 0;

  const exportarFlujoExcel = () => {
    const rows = [
      { Concepto: 'Ingresos por sesiones', Monto: Number(totalSesiones.toFixed(2)) },
      { Concepto: 'Otros ingresos', Monto: Number(totalOtrosIngresos.toFixed(2)) },
      { Concepto: 'Ingresos totales', Monto: Number(totalIngresos.toFixed(2)) },
      { Concepto: 'Egresos totales', Monto: Number(totalEgresos.toFixed(2)) },
      { Concepto: 'Flujo neto', Monto: Number(flujoNeto.toFixed(2)) },
    ];

    exportarExcel(
      `flujo-neto-${anioFiltro}-${mesFiltro}`,
      'Flujo Neto',
      rows
    );
  };

  const exportarFlujoPdf = () => {
    const filas = [
      ['Ingresos por sesiones', `Bs. ${totalSesiones.toFixed(2)}`],
      ['Otros ingresos', `Bs. ${totalOtrosIngresos.toFixed(2)}`],
      ['Ingresos totales', `Bs. ${totalIngresos.toFixed(2)}`],
      ['Egresos totales', `Bs. ${totalEgresos.toFixed(2)}`],
      ['Flujo neto', `Bs. ${flujoNeto.toFixed(2)}`],
    ];

    exportarPdfTabla({
      titulo: `Reporte de Flujo Neto ${mesFiltro}/${anioFiltro}`,
      nombreArchivo: `flujo-neto-${anioFiltro}-${mesFiltro}`,
      columnas: ['Concepto', 'Monto'],
      filas,
      resumen: [
        `Mes: ${mesFiltro}/${anioFiltro}`,
        'Resumen financiero del periodo seleccionado',
      ],
    });
  };

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">FLUJO NETO</div>
      </div>

      {toast && (
        <div className={`toast-inline ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div className="filtro-mes-wrap">
        <div className="filtro-mes-card">
          <div className="filtro-mes-grid">
            <div className="form-row">
              <label>Mes:</label>
              <select
                className="excel-input"
                value={mesFiltro}
                onChange={(e) => setMesFiltro(e.target.value)}
              >
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>

            <div className="form-row">
              <label>Año:</label>
              <input
                className="excel-input"
                value={anioFiltro}
                onChange={(e) => setAnioFiltro(e.target.value)}
                placeholder="2026"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        <button
          type="button"
          onClick={exportarFlujoExcel}
          className="btn btn-clear flex items-center gap-2"
          disabled={loading}
        >
          <FileSpreadsheet size={14} />
          Excel
        </button>

        <button
          type="button"
          onClick={exportarFlujoPdf}
          className="btn btn-clear flex items-center gap-2"
          disabled={loading}
        >
          <FileDown size={14} />
          PDF
        </button>
      </div>

      <div className="ingresos-resumen">
        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <BanknoteArrowUp size={18} />
            <span>Ingresos totales</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalIngresos.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <BanknoteArrowDown size={18} />
            <span>Egresos totales</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalEgresos.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <ChartNoAxesCombined size={18} />
            <span>Flujo neto</span>
          </div>
          <div
            className="ingreso-card-value"
            style={{ color: esGanancia ? '#6d5c6d' : '#b55f6a' }}
          >
            Bs. {flujoNeto.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="ingresos-tabla-wrap">
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#f0e8f0]">
                <td className="px-4 py-3">Ingresos por sesiones</td>
                <td className="px-4 py-3">Bs. {totalSesiones.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-[#f0e8f0]">
                <td className="px-4 py-3">Otros ingresos</td>
                <td className="px-4 py-3">Bs. {totalOtrosIngresos.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-[#f0e8f0]">
                <td className="px-4 py-3">Egresos</td>
                <td className="px-4 py-3">Bs. {totalEgresos.toFixed(2)}</td>
              </tr>
              <tr className="border-t border-[#f0e8f0] font-bold">
                <td className="px-4 py-3">Flujo neto</td>
                <td className="px-4 py-3">Bs. {flujoNeto.toFixed(2)}</td>
              </tr>

              {!loading && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                    Resumen financiero del mes seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FlujoNeto;