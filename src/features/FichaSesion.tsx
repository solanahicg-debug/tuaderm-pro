import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { Save, Loader2 } from 'lucide-react';

type SesionAnterior = {
  id: string;
  fecha: string | null;
  descripcion: string | null;
  observaciones: string | null;
  monto: number | null;
};

type ErroresSesion = {
  fecha?: string;
  paciente_id?: string;
  descripcion?: string;
  monto?: string;
};

const FichaSesion: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [ultimasSesiones, setUltimasSesiones] = useState<SesionAnterior[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errores, setErrores] = useState<ErroresSesion>({});

  const [form, setForm] = useState({
    fecha: '',
    paciente_id: '',
    nombre: '',
    sexo: '',
    fecha_nacimiento: '',
    telefono: '',
    edad: '',
    descripcion: '',
    observaciones: '',
    monto: ''
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const buscarPacientes = async () => {
      if (busqueda.length < 2) {
        setResultados([]);
        return;
      }

      const { data } = await supabase
        .from('pacientes')
        .select('*')
        .ilike('nombre', `%${busqueda}%`);

      if (data) setResultados(data);
    };

    buscarPacientes();
  }, [busqueda]);

  const cargarUltimasSesiones = async (pacienteId: string) => {
    const { data } = await supabase
      .from('sesiones')
      .select('id, fecha, descripcion, observaciones, monto')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .limit(5);

    setUltimasSesiones((data || []) as SesionAnterior[]);
  };

  const seleccionarPaciente = async (p: any) => {
    setForm(prev => ({
      ...prev,
      paciente_id: p.id,
      nombre: p.nombre,
      sexo: p.sexo,
      fecha_nacimiento: p.fecha_nacimiento,
      telefono: p.nro_telefono || p.telefono || '',
      edad: p.edad ? String(p.edad) : '',
    }));

    setErrores((prev) => ({ ...prev, paciente_id: undefined }));
    setBusqueda(p.nombre);
    setMostrarResultados(false);
    await cargarUltimasSesiones(p.id);
  };

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrores((prev) => ({ ...prev, [field]: undefined }));
  };

  const limpiarFormulario = () => {
    setForm({
      fecha: '',
      paciente_id: '',
      nombre: '',
      sexo: '',
      fecha_nacimiento: '',
      telefono: '',
      edad: '',
      descripcion: '',
      observaciones: '',
      monto: ''
    });
    setBusqueda('');
    setResultados([]);
    setMostrarResultados(false);
    setUltimasSesiones([]);
    setErrores({});
  };

  const validarFormulario = () => {
    const nuevosErrores: ErroresSesion = {};

    if (!form.paciente_id) nuevosErrores.paciente_id = 'Debes seleccionar un paciente';
    if (!form.fecha) nuevosErrores.fecha = 'La fecha es obligatoria';
    if (!form.descripcion.trim()) nuevosErrores.descripcion = 'La descripción es obligatoria';
    if (form.monto && Number(form.monto) < 0) nuevosErrores.monto = 'El monto no puede ser negativo';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarSesion = async () => {
    if (!validarFormulario()) {
      setToast({ type: 'error', text: 'Revisa los campos marcados.' });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('sesiones').insert([
      {
        fecha: form.fecha || null,
        paciente_id: form.paciente_id,
        nombre: form.nombre,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        telefono: form.telefono,
        edad: form.edad ? Number(form.edad) : null,
        descripcion: form.descripcion,
        observaciones: form.observaciones,
        monto: form.monto ? Number(form.monto) : null
      }
    ]);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Sesión guardada correctamente.' });
      limpiarFormulario();
    }
  };

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">
          FICHA DE SESIÓN
        </div>
      </div>

      {toast && (
        <div className={`toast-inline ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div>
        <div className="sesion-topbar">
          <div className="sesion-top-row">
            <div className="sesion-field">
              <label>Fecha</label>
              <input
                type="date"
                className={`excel-input ${errores.fecha ? 'input-error' : ''}`}
                value={form.fecha}
                onChange={e => handleChange('fecha', e.target.value)}
              />
              {errores.fecha && <span className="field-error">{errores.fecha}</span>}
            </div>

            <div className="sesion-field sesion-search-wrap">
              <label>Buscar paciente</label>
              <input
                className={`excel-input w-full ${errores.paciente_id ? 'input-error' : ''}`}
                placeholder="Buscar paciente..."
                value={busqueda}
                onChange={e => {
                  setBusqueda(e.target.value);
                  setMostrarResultados(true);
                }}
              />
              {errores.paciente_id && <span className="field-error">{errores.paciente_id}</span>}

              {mostrarResultados && resultados.length > 0 && (
                <div className="sesion-search-results">
                  {resultados.map(p => (
                    <div
                      key={p.id}
                      onClick={() => seleccionarPaciente(p)}
                      className="sesion-search-item"
                    >
                      {p.nombre} - {p.nro_telefono || p.telefono || 'Sin teléfono'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {form.paciente_id && (
          <div className="ultimas-sesiones-box">
            <div className="section-header">ÚLTIMAS SESIONES DEL PACIENTE</div>
            <div className="ultimas-sesiones-body">
              {ultimasSesiones.length > 0 ? (
                ultimasSesiones.map((s) => (
                  <div key={s.id} className="ultimas-sesiones-item">
                    <div className="ultimas-sesiones-fecha">
                      {s.fecha || 'Sin fecha'} · Bs. {Number(s.monto || 0).toFixed(2)}
                    </div>
                    <div className="ultimas-sesiones-texto">
                      {s.descripcion || 'Sin descripción'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="ultimas-sesiones-texto">Este paciente aún no tiene sesiones registradas.</div>
              )}
            </div>
          </div>
        )}

        <div className="section-header">DATOS PERSONALES</div>

        <div className="sesion-grid">
          <div className="sesion-field">
            <label>Nombre</label>
            <input className="excel-input sesion-readonly" value={form.nombre} disabled />
          </div>

          <div className="sesion-field">
            <label>Sexo</label>
            <input className="excel-input sesion-readonly" value={form.sexo} disabled />
          </div>

          <div className="sesion-field">
            <label>Fecha de nacimiento</label>
            <input className="excel-input sesion-readonly" value={form.fecha_nacimiento} disabled />
          </div>

          <div className="sesion-field">
            <label>Teléfono</label>
            <input className="excel-input sesion-readonly" value={form.telefono} disabled />
          </div>

          <div className="sesion-field">
            <label>Edad</label>
            <input className="excel-input sesion-readonly" value={form.edad} disabled />
          </div>
        </div>

        <div className="section-header">DESCRIPCIÓN DE LA SESIÓN</div>

        <div className="p-6">
          <textarea
            className={`sesion-textarea ${errores.descripcion ? 'input-error' : ''}`}
            placeholder="Describe el procedimiento realizado..."
            value={form.descripcion}
            onChange={e => handleChange('descripcion', e.target.value)}
          />
          {errores.descripcion && <span className="field-error">{errores.descripcion}</span>}
        </div>

        <div className="section-header">OBSERVACIONES</div>

        <div className="p-6">
          <textarea
            className="sesion-textarea"
            placeholder="Observaciones clínicas, evolución, reacción, etc."
            value={form.observaciones}
            onChange={e => handleChange('observaciones', e.target.value)}
          />
        </div>

        <div className="sesion-footer">
          <div className="sesion-price sesion-field">
            <label>Precio de la sesión</label>
            <input
              className={`excel-input ${errores.monto ? 'input-error' : ''}`}
              placeholder="0.00"
              value={form.monto}
              onChange={e => handleChange('monto', e.target.value)}
            />
            {errores.monto && <span className="field-error">{errores.monto}</span>}
          </div>

          <button
            type="button"
            onClick={guardarSesion}
            disabled={loading}
            className="btn btn-save flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FichaSesion;