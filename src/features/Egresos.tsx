import React, { useEffect, useMemo, useState } from 'react';
import {
  Save,
  ReceiptText,
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
  mapEgresosExcel,
  mapEgresosPdf,
} from '../utils/exportUtils';

type Egreso = {
  id: string;
  fecha: string | null;
  concepto: string | null;
  descripcion: string | null;
  monto: number | null;
};

const Egresos: React.FC = () => {
  const empresaId = getEmpresaId();

  const hoy = new Date();
  const mesActual = String(hoy.getMonth() + 1).padStart(2, '0');
  const anioActual = String(hoy.getFullYear());
  const fechaHoy = hoy.toISOString().split('T')[0];

  const [loading, setLoading] = useState(false);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [editando, setEditando] = useState(false);
  const [egresoIdEditando, setEgresoIdEditando] = useState<string | null>(null);
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

    const { data, error } = await supabase
      .from('egresos')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('fecha', inicioMes)
      .lte('fecha', finMes)
      .order('fecha', { ascending: false });

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    setEgresos((data || []) as Egreso[]);
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
    setEditando(false);
    setEgresoIdEditando(null);
  };

  const guardarEgreso = async () => {
    if (!form.fecha || !form.concepto || !form.monto) {
      setToast({ type: 'error', text: 'Fecha, concepto y monto son obligatorios.' });
      return;
    }

    setLoading(true);

    let error = null;

    if (editando && egresoIdEditando) {
      const res = await supabase
        .from('egresos')
        .update({
          fecha: form.fecha,
          concepto: form.concepto,
          descripcion: form.descripcion,
          monto: Number(form.monto),
        })
        .eq('id', egresoIdEditando)
        .eq('empresa_id', empresaId);

      error = res.error;
    } else {
      const res = await supabase.from('egresos').insert([
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
      text: editando ? 'Egreso actualizado correctamente.' : 'Egreso guardado correctamente.',
    });

    limpiarFormulario();
    cargarDatos();
  };

  const editarEgreso = (egreso: Egreso) => {
    setForm({
      fecha: egreso.fecha || fechaHoy,
      concepto: egreso.concepto || '',
      descripcion: egreso.descripcion || '',
      monto:
        egreso.monto !== null && egreso.monto !== undefined
          ? String(egreso.monto)
          : '',
    });
    setEgresoIdEditando(egreso.id);
    setEditando(true);
  };

  const eliminarEgreso = async (id: string) => {
    const ok = confirm('¿Eliminar este egreso?');
    if (!ok) return;

    setLoading(true);

    const { error } = await supabase
      .from('egresos')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    if (egresoIdEditando === id) {
      limpiarFormulario();
    }

    setToast({ type: 'success', text: 'Egreso eliminado correctamente.' });
    cargarDatos();
  };

  const totalEgresos = useMemo(
    () => egresos.reduce((acc, item) => acc + Number(item.monto || 0), 0),
    [egresos]
  );

  const exportarEgresosExcel = () => {
    const rows = mapEgresosExcel(egresos);

    exportarExcel(
      `egresos-${anioFiltro}-${mesFiltro}`,
      'Egresos',
      rows
    );
  };

  const exportarEgresosPdf = () => {
    const filas = mapEgresosPdf(egresos);

    exportarPdfTabla({
      titulo: `Reporte de Egresos ${mesFiltro}/${anioFiltro}`,
      nombreArchivo: `egresos-${anioFiltro}-${mesFiltro}`,
      columnas: ['Fecha', 'Concepto', 'Descripción', 'Monto'],
      filas,
      resumen: [`Total egresos: Bs. ${totalEgresos.toFixed(2)}`],
    });
  };

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">EGRESOS</div>
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
          onClick={exportarEgresosExcel}
          className="btn btn-clear flex items-center gap-2"
          disabled={loading}
        >
          <FileSpreadsheet size={14} />
          Excel
        </button>

        <button
          type="button"
          onClick={exportarEgresosPdf}
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
            <ReceiptText size={18} />
            <span>Total egresos</span>
          </div>
          <div className="ingreso-card-value">Bs. {totalEgresos.toFixed(2)}</div>
        </div>
      </div>

      <div className="section-header">REGISTRAR EGRESO</div>
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
                placeholder="Ej: Compra de insumos"
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
        {editando && (
          <button type="button" onClick={limpiarFormulario} className="btn btn-clear" disabled={loading}>
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={guardarEgreso}
          disabled={loading}
          className="btn btn-save flex items-center gap-2"
        >
          <Save size={14} />
          {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar egreso'}
        </button>
      </div>

      <div className="section-header">LISTADO DE EGRESOS</div>
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
              {egresos.map((e) => (
                <tr key={e.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{e.fecha}</td>
                  <td className="px-4 py-3">{e.concepto}</td>
                  <td className="px-4 py-3">{e.descripcion}</td>
                  <td className="px-4 py-3">Bs. {Number(e.monto || 0).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => editarEgreso(e)}
                        className="btn btn-clear flex items-center justify-center"
                        title="Editar"
                        disabled={loading}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarEgreso(e.id)}
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

              {!loading && egresos.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No hay egresos registrados
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

export default Egresos;