import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '../api/supabase';
import { getEmpresaId } from '../config/empresa';

const FichaPaciente: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    sexo: 'Femenino',
    fecha_nacimiento: '',
    telefono: '',
    edad: '',
    hijos: '',
    ocupacion: '',
    enfermedades: '',
    alergias: '',
    cirugias: '',
    medicamentos: '',
    anticonceptivos: '',
    procedimientos: '',
    tiempo_procedimientos: '',
    observaciones: '',
    habitos: {
      actividad_fisica: '',
      fuma: '',
      agua: '',
      alcohol: '',
      sueno: '',
      sol: '',
      productos: ''
    },
    analisis: [] as string[],
    fototipo: '',
    lesiones: [] as string[],
    motivo_consulta: '',
    tratamiento: ''
  });

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleMulti = (field: 'analisis' | 'lesiones', item: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i: string) => i !== item)
        : [...prev[field], item]
    }));
  };

  const limpiarFicha = () => {
    setForm({
      nombre: '',
      sexo: 'Femenino',
      fecha_nacimiento: '',
      telefono: '',
      edad: '',
      hijos: '',
      ocupacion: '',
      enfermedades: '',
      alergias: '',
      cirugias: '',
      medicamentos: '',
      anticonceptivos: '',
      procedimientos: '',
      tiempo_procedimientos: '',
      observaciones: '',
      habitos: {
        actividad_fisica: '',
        fuma: '',
        agua: '',
        alcohol: '',
        sueno: '',
        sol: '',
        productos: ''
      },
      analisis: [],
      fototipo: '',
      lesiones: [],
      motivo_consulta: '',
      tratamiento: ''
    });
  };

  const savePaciente = async () => {
    if (!form.nombre.trim()) return alert('Nombre requerido');

    setLoading(true);

    const { error } = await supabase.from('pacientes').insert([{
      empresa_id: getEmpresaId(),
      nombre: form.nombre,
      sexo: form.sexo,
      fecha_nacimiento: form.fecha_nacimiento,
      nro_telefono: form.telefono,
      edad: parseInt(form.edad) || null,
      nro_hijos: parseInt(form.hijos) || null,
      ocupacion: form.ocupacion,

      enfermedades: form.enfermedades,
      alergias: form.alergias,
      cirugias: form.cirugias,
      medicamentos: form.medicamentos,
      anticonceptivos: form.anticonceptivos,
      procedimientos_esteticos: form.procedimientos,
      tiempo_procedimientos: form.tiempo_procedimientos,
      observacion_clinica: form.observaciones,

      actividad_fisica: form.habitos.actividad_fisica,
      fuma: form.habitos.fuma,
      consumo_agua: form.habitos.agua,
      alcohol: form.habitos.alcohol,
      sueño: form.habitos.sueno,
      sol: form.habitos.sol,
      productos_rostro: form.habitos.productos,

      biotipo: form.analisis.join(', '),
      fototipo: form.fototipo,
      lesiones: form.lesiones.join(', '),

      motivo_consulta: form.motivo_consulta,
      tratamiento_primario: form.tratamiento
    }]);

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert('Paciente guardado correctamente');
      limpiarFicha();
    }
  };

  const analisisOpciones = [
    'Eudermica', 'Grasa', 'Seca', 'Rosacea', 'Mixta', 'Seborreica',
    'Deshidratada', 'Sensible', 'Asfixiada', 'Hidratada', 'Alipida',
    'Gruesa', 'Aspera', 'Lisa', 'Poros', 'Acne'
  ];

  const lesionesOpciones = [
    'Comedones cerrados', 'Comedones abiertos', 'Manchas', 'Melasma', 'Vitiligo',
    'Pustulas', 'Papulas', 'Lineas de Expresion', 'Arrugas', 'Telangiectasias',
    'Verrugas', 'Million', 'Heridas', 'Costras', 'Cicatriz'
  ];

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">
          FICHA CLÍNICA DEL PACIENTE
        </div>
      </div>

      <div>
        <div className="section-header">
          DATOS PERSONALES
        </div>

        <div className="form-grid">
          <div className="form-row">
            <label>Nombre:</label>
            <input
              className="excel-input"
              value={form.nombre}
              onChange={e => handleChange('nombre', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Sexo:</label>
            <select
              className="excel-input"
              value={form.sexo}
              onChange={e => handleChange('sexo', e.target.value)}
            >
              <option>Femenino</option>
              <option>Masculino</option>
            </select>
          </div>

          <div className="form-row">
            <label>Fecha Nacimiento:</label>
            <input
              type="date"
              className="excel-input"
              value={form.fecha_nacimiento}
              onChange={e => handleChange('fecha_nacimiento', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Teléfono:</label>
            <input
              className="excel-input"
              value={form.telefono}
              onChange={e => handleChange('telefono', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Edad:</label>
            <input
              className="excel-input"
              value={form.edad}
              onChange={e => handleChange('edad', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Nro Hijos:</label>
            <input
              className="excel-input"
              value={form.hijos}
              onChange={e => handleChange('hijos', e.target.value)}
            />
          </div>

          <div className="form-row col-span-2">
            <label>Ocupación:</label>
            <input
              className="excel-input"
              value={form.ocupacion}
              onChange={e => handleChange('ocupacion', e.target.value)}
            />
          </div>
        </div>

        <div className="section-header">
          ANTECEDENTES CLÍNICOS
        </div>

        <div className="form-grid">
          <div className="form-row">
            <label>Enfermedades:</label>
            <input
              className="excel-input"
              value={form.enfermedades}
              onChange={e => handleChange('enfermedades', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Alergias:</label>
            <input
              className="excel-input"
              value={form.alergias}
              onChange={e => handleChange('alergias', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Cirugías:</label>
            <input
              className="excel-input"
              value={form.cirugias}
              onChange={e => handleChange('cirugias', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Medicamentos:</label>
            <input
              className="excel-input"
              value={form.medicamentos}
              onChange={e => handleChange('medicamentos', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Anticonceptivos:</label>
            <input
              className="excel-input"
              value={form.anticonceptivos}
              onChange={e => handleChange('anticonceptivos', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Procedimientos:</label>
            <input
              className="excel-input"
              value={form.procedimientos}
              onChange={e => handleChange('procedimientos', e.target.value)}
            />
          </div>

          <div className="form-row">
            <label>Tiempo:</label>
            <input
              className="excel-input"
              value={form.tiempo_procedimientos}
              onChange={e => handleChange('tiempo_procedimientos', e.target.value)}
            />
          </div>

          <div className="form-row col-span-2">
            <label>Observación clínica:</label>
            <input
              className="excel-input"
              value={form.observaciones}
              onChange={e => handleChange('observaciones', e.target.value)}
            />
          </div>
        </div>

        <div className="section-header">
          HÁBITOS
        </div>

        <div className="form-grid">
          <div className="form-row">
            <label>Actividad Física:</label>
            <select
              className="excel-input"
              value={form.habitos.actividad_fisica}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, actividad_fisica: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>Poca</option>
              <option>Regular</option>
              <option>Mucha</option>
            </select>
          </div>

          <div className="form-row">
            <label>Fuma:</label>
            <select
              className="excel-input"
              value={form.habitos.fuma}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, fuma: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>Si</option>
              <option>No</option>
            </select>
          </div>

          <div className="form-row">
            <label>Consumo de Agua:</label>
            <select
              className="excel-input"
              value={form.habitos.agua}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, agua: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>Poca</option>
              <option>Regular</option>
              <option>Mucha</option>
            </select>
          </div>

          <div className="form-row">
            <label>Consumo de Alcohol:</label>
            <select
              className="excel-input"
              value={form.habitos.alcohol}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, alcohol: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>No</option>
              <option>A veces</option>
              <option>Frecuentemente</option>
            </select>
          </div>

          <div className="form-row">
            <label>Periodo de Sueño:</label>
            <select
              className="excel-input"
              value={form.habitos.sueno}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, sueno: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>1-3 hrs</option>
              <option>4-7 hrs</option>
              <option>8+ hrs</option>
              <option>Insomnio</option>
              <option>Desvelos</option>
              <option>Normal</option>
            </select>
          </div>

          <div className="form-row">
            <label>Exposición al Sol:</label>
            <select
              className="excel-input"
              value={form.habitos.sol}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, sol: e.target.value }
              }))}
            >
              <option value="">Seleccionar</option>
              <option>Poca</option>
              <option>Media</option>
              <option>Mucha</option>
            </select>
          </div>

          <div className="form-row col-span-2">
            <label>Productos para el rostro:</label>
            <input
              className="excel-input"
              value={form.habitos.productos}
              onChange={e => setForm(prev => ({
                ...prev,
                habitos: { ...prev.habitos, productos: e.target.value }
              }))}
            />
          </div>
        </div>

        <div className="section-header">
          ANÁLISIS ESTÉTICO
        </div>

        <div className="p-6 flex flex-wrap gap-3">
          {analisisOpciones.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => toggleMulti('analisis', item)}
              className={`badge ${form.analisis.includes(item) ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="section-header">
          LESIONES
        </div>

        <div className="p-6 flex flex-wrap gap-3">
          {lesionesOpciones.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => toggleMulti('lesiones', item)}
              className={`badge ${form.lesiones.includes(item) ? 'active' : ''}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="section-header">
          MOTIVO DE CONSULTA
        </div>

        <div className="p-6">
          <textarea
            className="text-area"
            value={form.motivo_consulta}
            onChange={e => handleChange('motivo_consulta', e.target.value)}
          />
        </div>

        <div className="section-header">
          TRATAMIENTO
        </div>

        <div className="p-6">
          <textarea
            className="text-area"
            value={form.tratamiento}
            onChange={e => handleChange('tratamiento', e.target.value)}
          />
        </div>

        <div className="btn-group">
          <button type="button" onClick={limpiarFicha} className="btn btn-clear">
            Limpiar
          </button>

          <button
            type="button"
            onClick={savePaciente}
            disabled={loading}
            className="btn btn-save flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Save />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FichaPaciente;