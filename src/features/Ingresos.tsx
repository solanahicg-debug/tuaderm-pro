import React, { useEffect, useMemo, useState } from 'react';
import {
  Save,
  Wallet,
  BadgeDollarSign,
  Pencil,
  X,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { supabase } from '../api/supabase';
import { getEmpresaId } from '../config/empresa';
import {
  exportarExcel,
  exportarPdfTabla,
  mapIngresosExcel,
  mapIngresosPdf,
} from '../utils/exportUtils';

type OtroIngreso = {
  id: string;
  fecha: string | null;
  concepto: string | null;
  descripcion: string | null;
  monto: number | null;
};

type SesionIngreso = {
  id: string;
  fecha: string | null;
  monto: number | null;
};

const Ingresos: React.FC = () => {
  const empresaId = getEmpresaId();

  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear());
  const fechaHoy = hoy.toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [sesiones, setSesiones] = useState<SesionIngreso[]>([]);
  const [otrosIngresos, setOtrosIngresos] = useState<OtroIngreso[]>([]);
  const [editandoIngreso, setEditandoIngreso] = useState(false);
  const [ingresoIdEditando, setIngresoIdEditando] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [mesFiltro, setMesFiltro] = useState(mesActual);
  const [anioFiltro, setAnioFiltro] = useState(anioActual);

  const [form, setForm] = useState({
    fecha: fechaHoy,
    concepto: '',
    descripcion: '',
    monto: '',
  });

  const inicioMes = `${anioFiltro}-${mesFiltro}-01`;
  const finMes = `${anioFiltro}-${mesFiltro}-31`;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const cargarDatos = async () => {
    setLoading(true);

    const { data: dataSesiones, error: errorSesiones } = await supabase
      .from('sesiones')
      .select('id, fecha, monto')
      .eq('empresa_id', empresaId)
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)
      .order('fecha', { ascending: false });

    const { data: dataOtros, error: errorOtros } = await supabase
      .from('otros_ingresos')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)
      .order('fecha', { ascending: false });

    setLoading(false);

    if (errorSesiones) {
      setToast({ type: 'error', text: errorSesiones.message });
      return;
    }

    if (errorOtros) {
      setToast({ type: 'error', text: errorOtros.message });
      return;
    }

    setSesiones((dataSesiones || []) as SesionIngreso[]);
    setOtrosIngresos((dataOtros || []) as OtroIngreso[]);
  };

  useEffect(() => {
    cargarDatos();
  }, [mesFiltro, anioFiltro]);

  const limpiarFormulario = () => {
    setForm({
      fecha: fechaHoy,
      concepto: '',
      descripcion: '',
      monto: '',
    });
    setEditandoIngreso(false);
    setIngresoIdEditando(null);
  };

  const guardarOtroIngreso = async () => {
    if (!form.fecha || !form.concepto || !form.monto) {
      setToast({ type: 'error', text: 'Fecha, concepto y monto son obligatorios.' });
      return;
    }

    setLoading(true);

    let error = null;

    if (editandoIngreso && ingresoIdEditando) {
      const res = await supabase
        .from('otros_ingresos')
        .update({
          fecha: form.fecha,
          concepto: form.concepto,
          descripcion: form.descripcion,
          monto: Number(form.monto),
        })
        .eq('id', ingresoIdEditando)
        .eq('empresa_id', empresaId);

      error = res.error;
    } else {
      const res = await supabase.from('otros_ingresos').insert([
        {
          empresa_id: empresaId,
          fecha: form.fecha,
          concepto: form.concepto,
          descripcion: form.descripcion,
          monto: Number(form.monto),
        },
      ]);

      error = res.error;
    }

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    setToast({
      type: 'success',
      text: editandoIngreso ? 'Ingreso actualizado correctamente.' : 'Ingreso guardado correctamente.',
    });

    limpiarFormulario();
    cargarDatos();
  };

  const editarOtroIngreso = (ingreso: OtroIngreso) => {
    setForm({
      fecha: ingreso.fecha || fechaHoy,
      concepto: ingreso.concepto || '',
      descripcion: ingreso.descripcion || '',
      monto:
        ingreso.monto !== null && ingreso.monto !== undefined
          ? String(ingreso.monto)
          : '',
    });
    setIngresoIdEditando(ingreso.id);
    setEditandoIngreso(true);
  };

  const eliminarOtroIngreso = async (id: string) => {
    const ok = confirm('¿Eliminar este ingreso?');
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase
      .from('otros_ingresos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    if (ingresoIdEditando === id) {
      limpiarFormulario();
    }

    setToast({ type: 'success', text: 'Ingreso eliminado correctamente.' });
    cargarDatos();
  };

  const totalSesiones = useMemo(
    () => sesiones.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [sesiones]
  );

  const totalOtros = useMemo(
    () => otrosIngresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [otrosIngresos]
  );

  const totalGeneral = totalSesiones + totalOtros;

  const exportarIngresosExcel = () => {
    const rows = mapIngresosExcel(sesiones, otrosIngresos);

    exportarExcel(
      `ingresos-${anioFiltro}-${mesFiltro}`,
      'Ingresos',
      rows
    );
  };

  const exportarIngresosPdf = () => {
    const filas = mapIngresosPdf(sesiones, otrosIngresos);

    exportarPdfTabla({
      titulo: `Reporte de Ingresos ${mesFiltro}/${anioFiltro}`,
      nombreArchivo: `ingresos-${anioFiltro}-${mesFiltro}`,
      columnas: ['Tipo', 'Fecha', 'Concepto', 'Descripción', 'Monto'],
      filas,
      resumen: [
        `Total sesiones: Bs. ${totalSesiones.toFixed(2)}`,
        `Total otros ingresos: Bs. ${totalOtros.toFixed(2)}`,
        `Total general: Bs. ${totalGeneral.toFixed(2)}`,
      ],
    });
  };

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">INGRESOS</div>
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
          onClick={exportarIngresosExcel}
          className="btn btn-clear flex items-center gap-2"
          disabled={loading}
        >
          <FileSpreadsheet size={14} />
          Excel
        </button>

        <button
          type="button"
          onClick={exportarIngresosPdf}
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
            <Wallet size={18} />
            <span>Sesiones</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalSesiones.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <BadgeDollarSign size={18} />
            <span>Otros ingresos</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalOtros.toFixed(2)}</div>
        </div>

        <div className="ingreso-card">
          <div className="ingreso-card-head">
            <BadgeDollarSign size={18} />
            <span>Total general</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalGeneral.toFixed(2)}</div>
        </div>
      </div>

      <div className="section-header">REGISTRAR OTRO INGRESO</div>
      <div className="ingresos-bloque">
        <div className="ingresos-bloque-body">
          <div className="form-grid">
            <div className="form-row">
              <label>Fecha:</label>
              <input
                type="date"
                className="excel-input"
                value={form.fecha}
                onChange={(e) => setForm((prev) => ({ ...prev, fecha: e.target.value }))}
              />
            </div>

            <div className="form-row">
              <label>Concepto:</label>
              <input
                className="excel-input"
                value={form.concepto}
                onChange={(e) => setForm((prev) => ({ ...prev, concepto: e.target.value }))}
                placeholder="Ej: Venta de producto"
              />
            </div>

            <div className="form-row col-span-2">
              <label>Descripción:</label>
              <input
                className="excel-input"
                value={form.descripcion}
                onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Detalle opcional"
              />
            </div>

            <div className="form-row">
              <label>Monto:</label>
              <input
                className="excel-input"
                value={form.monto}
                onChange={(e) => setForm((prev) => ({ ...prev, monto: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group">
        {editandoIngreso && (
          <button type="button" onClick={limpiarFormulario} className="btn btn-clear" disabled={loading}>
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={guardarOtroIngreso}
          disabled={loading}
          className="btn btn-save flex items-center gap-2"
        >
          <Save size={14} />
          {loading ? 'Guardando...' : editandoIngreso ? 'Guardar cambios' : 'Guardar ingreso'}
        </button>
      </div>

      <div className="section-header">DETALLE DE INGRESOS POR SESIÓN</div>
      <div className="ingresos-tabla-wrap">
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{s.fecha}</td>
                  <td className="px-4 py-3">Sesión clínica</td>
                  <td className="px-4 py-3">Bs. {Number(s.monto || 0).toFixed(2)}</td>
                </tr>
              ))}

              {!loading && sesiones.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No hay ingresos por sesión
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section-header">OTROS INGRESOS</div>
      <div className="ingresos-tabla-wrap">
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Concepto</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {otrosIngresos.map((i) => (
                <tr key={i.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{i.fecha}</td>
                  <td className="px-4 py-3">{i.concepto}</td>
                  <td className="px-4 py-3">{i.descripcion}</td>
                  <td className="px-4 py-3">Bs. {Number(i.monto || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => editarOtroIngreso(i)}
                        className="btn btn-clear flex items-center justify-center"
                        title="Editar"
                        disabled={loading}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarOtroIngreso(i.id)}
                        className="btn btn-clear flex items-center justify-center"
                        style={{ color: '#b55f6a' }}
                        title="Eliminar"
                        disabled={loading}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && otrosIngresos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No hay otros ingresos registrados
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

export default Ingresos;