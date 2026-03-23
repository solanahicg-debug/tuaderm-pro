import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Trash2,
  FileDown,
  Save,
  X,
  Pencil,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '../api/supabase';
import { getEmpresaId } from '../config/empresa';

type Paciente = {
  id: string;
  nombre: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  nro_telefono: string | null;
  edad: number | null;
  nro_hijos: number | null;
  ocupacion: string | null;
  enfermedades: string | null;
  alergias: string | null;
  cirugias: string | null;
  medicamentos: string | null;
  anticonceptivos: string | null;
  procedimientos_esteticos: string | null;
  tiempo_procedimientos: string | null;
  observacion_clinica: string | null;
  actividad_fisica: string | null;
  fuma: string | null;
  consumo_agua: string | null;
  alcohol: string | null;
  sueño: string | null;
  sol: string | null;
  productos_rostro: string | null;
  biotipo: string | null;
  fototipo: string | null;
  lesiones: string | null;
  motivo_consulta: string | null;
  tratamiento_primario: string | null;
};

type Sesion = {
  id: string;
  paciente_id: string | null;
  fecha: string | null;
  descripcion: string | null;
  observaciones: string | null;
  monto: number | null;
};

const initialEdit: Paciente = {
  id: '',
  nombre: '',
  sexo: '',
  fecha_nacimiento: '',
  nro_telefono: '',
  edad: null,
  nro_hijos: null,
  ocupacion: '',
  enfermedades: '',
  alergias: '',
  cirugias: '',
  medicamentos: '',
  anticonceptivos: '',
  procedimientos_esteticos: '',
  tiempo_procedimientos: '',
  observacion_clinica: '',
  actividad_fisica: '',
  fuma: '',
  consumo_agua: '',
  alcohol: '',
  sueño: '',
  sol: '',
  productos_rostro: '',
  biotipo: '',
  fototipo: '',
  lesiones: '',
  motivo_consulta: '',
  tratamiento_primario: '',
};

const analisisOpciones: string[] = [
  'Eudermica',
  'Grasa',
  'Seca',
  'Rosacea',
  'Mixta',
  'Seborreica',
  'Deshidratada',
  'Sensible',
  'Asfixiada',
  'Hidratada',
  'Alipida',
  'Gruesa',
  'Aspera',
  'Lisa',
  'Poros',
  'Acne',
];

const lesionesOpciones: string[] = [
  'Comedones cerrados',
  'Comedones abiertos',
  'Manchas',
  'Melasma',
  'Vitiligo',
  'Pustulas',
  'Papulas',
  'Lineas de Expresion',
  'Arrugas',
  'Telangiectasias',
  'Verrugas',
  'Million',
  'Heridas',
  'Costras',
  'Cicatriz',
];

const splitCsv = (value: string | null): string[] =>
  (value || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);

const joinCsv = (values: string[]): string => values.join(', ');

const HistorialPacientes: React.FC = () => {
  const empresaId = getEmpresaId();

  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);

  const [verFicha, setVerFicha] = useState(false);
  const [verSesiones, setVerSesiones] = useState(false);
  const [pacienteDetalle, setPacienteDetalle] = useState<Paciente | null>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Paciente>(initialEdit);
  const [biotipoSeleccionado, setBiotipoSeleccionado] = useState<string[]>([]);
  const [lesionesSeleccionadas, setLesionesSeleccionadas] = useState<string[]>([]);

  const [sesionesDetalle, setSesionesDetalle] = useState<Sesion[]>([]);
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const [editandoSesion, setEditandoSesion] = useState(false);
  const [sesionForm, setSesionForm] = useState<Sesion>({
    id: '',
    paciente_id: '',
    fecha: '',
    descripcion: '',
    observaciones: '',
    monto: null,
  });

  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmData, setConfirmData] = useState<{
    open: boolean;
    title: string;
    text: string;
    onConfirm: null | (() => void);
  }>({
    open: false,
    title: '',
    text: '',
    onConfirm: null,
  });
  const [erroresEdit, setErroresEdit] = useState<{ nombre?: string }>({});

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const abrirConfirmacion = (title: string, text: string, onConfirm: () => void) => {
    setConfirmData({
      open: true,
      title,
      text,
      onConfirm,
    });
  };

  const cerrarConfirmacion = () => {
    setConfirmData({
      open: false,
      title: '',
      text: '',
      onConfirm: null,
    });
  };

  const toggleBiotipo = (item: string) => {
    setBiotipoSeleccionado((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  const toggleLesion = (item: string) => {
    setLesionesSeleccionadas((prev) =>
      prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]
    );
  };

  const cargarPacientes = async () => {
    setLoading(true);

    const query = supabase
      .from('pacientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    const { data, error } =
      busqueda.trim().length >= 1
        ? await query.ilike('nombre', `%${busqueda}%`)
        : await query.limit(100);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    setPacientes((data || []) as Paciente[]);
  };

  useEffect(() => {
    const t = setTimeout(() => {
      cargarPacientes();
    }, 300);

    return () => clearTimeout(t);
  }, [busqueda]);

  const abrirFichaPaciente = (p: Paciente) => {
    setPacienteDetalle(p);
    setVerFicha(true);
  };

  const cerrarFichaPaciente = () => {
    setVerFicha(false);
    setPacienteDetalle(null);
  };

  const abrirEdicion = (p: Paciente) => {
    setForm({
      ...initialEdit,
      ...p,
    });
    setBiotipoSeleccionado(splitCsv(p.biotipo));
    setLesionesSeleccionadas(splitCsv(p.lesiones));
    setErroresEdit({});
    setEditando(true);
  };

  const cerrarEdicion = () => {
    setEditando(false);
    setForm(initialEdit);
    setBiotipoSeleccionado([]);
    setLesionesSeleccionadas([]);
    setErroresEdit({});
  };

  const guardarEdicion = async () => {
    if (!form.id) return;

    if (!form.nombre?.trim()) {
      setErroresEdit({ nombre: 'El nombre es obligatorio' });
      setToast({ type: 'error', text: 'Revisa los campos marcados.' });
      return;
    }

    setErroresEdit({});
    setLoading(true);

    const { error } = await supabase
      .from('pacientes')
      .update({
        nombre: form.nombre,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        nro_telefono: form.nro_telefono,
        edad: form.edad ? Number(form.edad) : null,
        nro_hijos: form.nro_hijos ? Number(form.nro_hijos) : null,
        ocupacion: form.ocupacion,
        enfermedades: form.enfermedades,
        alergias: form.alergias,
        cirugias: form.cirugias,
        medicamentos: form.medicamentos,
        anticonceptivos: form.anticonceptivos,
        procedimientos_esteticos: form.procedimientos_esteticos,
        tiempo_procedimientos: form.tiempo_procedimientos,
        observacion_clinica: form.observacion_clinica,
        actividad_fisica: form.actividad_fisica,
        fuma: form.fuma,
        consumo_agua: form.consumo_agua,
        alcohol: form.alcohol,
        sueño: form.sueño,
        sol: form.sol,
        productos_rostro: form.productos_rostro,
        biotipo: joinCsv(biotipoSeleccionado),
        fototipo: form.fototipo,
        lesiones: joinCsv(lesionesSeleccionadas),
        motivo_consulta: form.motivo_consulta,
        tratamiento_primario: form.tratamiento_primario,
      })
      .eq('id', form.id)
      .eq('empresa_id', empresaId);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    if (pacienteDetalle?.id === form.id) {
      setPacienteDetalle({
        ...form,
        biotipo: joinCsv(biotipoSeleccionado),
        lesiones: joinCsv(lesionesSeleccionadas),
      });
    }

    setToast({ type: 'success', text: 'Paciente actualizado correctamente.' });
    cerrarEdicion();
    cargarPacientes();
  };

  const eliminarPaciente = async (id: string, nombre?: string | null) => {
    abrirConfirmacion(
      'Eliminar paciente',
      `¿Seguro que deseas eliminar a ${nombre || 'este paciente'}?`,
      async () => {
        cerrarConfirmacion();
        setLoading(true);

        const { error } = await supabase
          .from('pacientes')
          .delete()
          .eq('id', id)
          .eq('empresa_id', empresaId);

        setLoading(false);

        if (error) {
          setToast({ type: 'error', text: error.message });
          return;
        }

        setToast({ type: 'success', text: 'Paciente eliminado correctamente.' });
        cargarPacientes();
      }
    );
  };

  const abrirSesionesPaciente = async (p: Paciente) => {
    setLoading(true);

    const { data, error } = await supabase
      .from('sesiones')
      .select('id, paciente_id, fecha, descripcion, observaciones, monto')
      .eq('empresa_id', empresaId)
      .eq('paciente_id', p.id)
      .order('fecha', { ascending: false });

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    setPacienteDetalle(p);
    setSesionesDetalle((data || []) as Sesion[]);
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setVerSesiones(true);
  };

  const cerrarSesionesPaciente = () => {
    setVerSesiones(false);
    setPacienteDetalle(null);
    setSesionesDetalle([]);
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
  };

  const sesionesFiltradas = useMemo(() => {
    return sesionesDetalle.filter((s) => {
      if (!s.fecha) return false;
      const cumpleDesde = !filtroFechaDesde || s.fecha >= filtroFechaDesde;
      const cumpleHasta = !filtroFechaHasta || s.fecha <= filtroFechaHasta;
      return cumpleDesde && cumpleHasta;
    });
  }, [sesionesDetalle, filtroFechaDesde, filtroFechaHasta]);

  const abrirEdicionSesion = (sesion: Sesion) => {
    setSesionForm({
      id: sesion.id,
      paciente_id: sesion.paciente_id || '',
      fecha: sesion.fecha || '',
      descripcion: sesion.descripcion || '',
      observaciones: sesion.observaciones || '',
      monto: sesion.monto ?? null,
    });
    setEditandoSesion(true);
  };

  const cerrarEdicionSesion = () => {
    setEditandoSesion(false);
    setSesionForm({
      id: '',
      paciente_id: '',
      fecha: '',
      descripcion: '',
      observaciones: '',
      monto: null,
    });
  };

  const guardarEdicionSesion = async () => {
    if (!sesionForm.id) return;

    setLoading(true);

    const { error } = await supabase
      .from('sesiones')
      .update({
        fecha: sesionForm.fecha || null,
        descripcion: sesionForm.descripcion,
        observaciones: sesionForm.observaciones,
        monto: sesionForm.monto ? Number(sesionForm.monto) : null,
      })
      .eq('id', sesionForm.id)
      .eq('empresa_id', empresaId);

    setLoading(false);

    if (error) {
      setToast({ type: 'error', text: error.message });
      return;
    }

    if (sesionForm.paciente_id) {
      const { data } = await supabase
        .from('sesiones')
        .select('id, paciente_id, fecha, descripcion, observaciones, monto')
        .eq('empresa_id', empresaId)
        .eq('paciente_id', sesionForm.paciente_id)
        .order('fecha', { ascending: false });

      setSesionesDetalle((data || []) as Sesion[]);
    }

    setToast({ type: 'success', text: 'Sesión actualizada correctamente.' });
    cerrarEdicionSesion();
  };

  const eliminarSesion = async (sesionId: string, pacienteId: string) => {
    abrirConfirmacion(
      'Eliminar sesión',
      '¿Seguro que deseas eliminar esta sesión?',
      async () => {
        cerrarConfirmacion();
        setLoading(true);

        const { error } = await supabase
          .from('sesiones')
          .delete()
          .eq('id', sesionId)
          .eq('empresa_id', empresaId);

        setLoading(false);

        if (error) {
          setToast({ type: 'error', text: error.message });
          return;
        }

        const { data } = await supabase
          .from('sesiones')
          .select('id, paciente_id, fecha, descripcion, observaciones, monto')
          .eq('empresa_id', empresaId)
          .eq('paciente_id', pacienteId)
          .order('fecha', { ascending: false });

        setSesionesDetalle((data || []) as Sesion[]);
        setToast({ type: 'success', text: 'Sesión eliminada correctamente.' });
      }
    );
  };

  const descargarPDF = async (p: Paciente) => {
    const { data: sesionesData, error: sesionesError } = await supabase
      .from('sesiones')
      .select('id, paciente_id, fecha, descripcion, observaciones, monto')
      .eq('empresa_id', empresaId)
      .eq('paciente_id', p.id)
      .order('fecha', { ascending: false });

    if (sesionesError) {
      setToast({ type: 'error', text: sesionesError.message });
      return;
    }

    const sesionesPaciente = (sesionesData || []) as Sesion[];
    const totalSesiones = sesionesPaciente.reduce(
      (acc, s) => acc + Number(s.monto || 0),
      0
    );

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const colors = {
      primary: [142, 123, 141] as const,
      primaryDark: [110, 92, 109] as const,
      soft: [232, 214, 232] as const,
      softBox: [252, 250, 252] as const,
      text: [70, 70, 70] as const,
      lightText: [110, 110, 110] as const,
      border: [225, 225, 225] as const,
    };

    let y = 20;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 18) {
        doc.addPage();
        y = 20;
      }
    };

    const drawHeader = () => {
      doc.setFillColor(...colors.soft);
      doc.roundedRect(margin, y, contentWidth, 20, 4, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...colors.primary);
      doc.text('Ficha Clínica del Paciente', margin + 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-BO')}`, margin + 6, y + 14);
      doc.text(`Paciente: ${p.nombre || '—'}`, margin + 70, y + 14);

      y += 26;
    };

    const sectionTitle = (title: string) => {
      ensureSpace(14);
      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, margin + 4, y + 5.5);
      y += 12;
    };

    const field = (label: string, value: any, x: number, width: number) => {
      const safe = value !== null && value !== undefined && value !== '' ? String(value) : '—';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.text(label, x, y);

      doc.setDrawColor(...colors.border);
      doc.line(x, y + 7, x + width, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(safe, x, y + 5);
    };

    const fieldRow = (
      leftLabel: string,
      leftValue: any,
      rightLabel?: string,
      rightValue?: any
    ) => {
      ensureSpace(14);
      const gap = 8;
      const colWidth = (contentWidth - gap) / 2;
      const leftX = margin;
      const rightX = margin + colWidth + gap;

      field(leftLabel, leftValue, leftX, colWidth);

      if (rightLabel) {
        field(rightLabel, rightValue, rightX, colWidth);
      }

      y += 14;
    };

    const blockText = (label: string, value: any) => {
      const safe = value !== null && value !== undefined && value !== '' ? String(value) : '—';
      const lines = doc.splitTextToSize(safe, contentWidth - 8);
      const blockHeight = Math.max(16, lines.length * 5 + 8);

      ensureSpace(blockHeight + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.text(label, margin, y);

      doc.setFillColor(...colors.softBox);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y + 3, contentWidth, blockHeight, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...colors.text);
      doc.text(lines, margin + 4, y + 10);

      y += blockHeight + 10;
    };

    const summarySessionsBox = () => {
      ensureSpace(20);
      doc.setFillColor(...colors.softBox);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 18, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...colors.primaryDark);
      doc.text(`Cantidad de sesiones: ${sesionesPaciente.length}`, margin + 6, y + 7);
      doc.text(`Total acumulado: Bs. ${totalSesiones.toFixed(2)}`, margin + 100, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.lightText);
      doc.text('Resumen general del historial de sesiones del paciente', margin + 6, y + 13);

      y += 24;
    };

    const sesionCard = (sesion: Sesion, index: number) => {
      const descripcion = sesion.descripcion || '—';
      const observaciones = sesion.observaciones || '—';
      const monto =
        sesion.monto !== null && sesion.monto !== undefined
          ? `Bs. ${Number(sesion.monto).toFixed(2)}`
          : '—';

      const descripcionLines = doc.splitTextToSize(descripcion, contentWidth - 12);
      const observacionesLines = doc.splitTextToSize(observaciones, contentWidth - 12);

      const blockHeight =
        20 +
        descripcionLines.length * 5 +
        8 +
        observacionesLines.length * 5 +
        10;

      ensureSpace(blockHeight + 8);

      doc.setFillColor(...colors.softBox);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, blockHeight, 4, 4, 'FD');

      doc.setFillColor(...colors.primary);
      doc.roundedRect(margin, y, contentWidth, 10, 4, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`Sesión ${index + 1}`, margin + 4, y + 6.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...colors.text);
      doc.text(`Fecha: ${sesion.fecha || '—'}`, margin + 4, y + 17);
      doc.text(`Monto: ${monto}`, margin + contentWidth - 42, y + 17);

      let innerY = y + 25;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.lightText);
      doc.text('Descripción:', margin + 4, innerY);

      innerY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(descripcionLines, margin + 4, innerY);

      innerY += descripcionLines.length * 5 + 6;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.lightText);
      doc.text('Observaciones:', margin + 4, innerY);

      innerY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.text);
      doc.text(observacionesLines, margin + 4, innerY);

      y += blockHeight + 8;
    };

    drawHeader();

    sectionTitle('DATOS PERSONALES');
    fieldRow('Nombre', p.nombre, 'Sexo', p.sexo);
    fieldRow('Fecha de nacimiento', p.fecha_nacimiento, 'Teléfono', p.nro_telefono);
    fieldRow('Edad', p.edad, 'Nro. de hijos', p.nro_hijos);
    fieldRow('Ocupación', p.ocupacion);

    sectionTitle('ANTECEDENTES CLÍNICOS');
    fieldRow('Enfermedades', p.enfermedades, 'Alergias', p.alergias);
    fieldRow('Cirugías', p.cirugias, 'Medicamentos', p.medicamentos);
    fieldRow('Anticonceptivos', p.anticonceptivos, 'Procedimientos estéticos', p.procedimientos_esteticos);
    fieldRow('Hace cuánto tiempo', p.tiempo_procedimientos);
    blockText('Observación clínica', p.observacion_clinica);

    sectionTitle('HÁBITOS');
    fieldRow('Actividad física', p.actividad_fisica, 'Fuma', p.fuma);
    fieldRow('Consumo de agua', p.consumo_agua, 'Alcohol', p.alcohol);
    fieldRow('Periodo de sueño', p.sueño, 'Exposición al sol', p.sol);
    blockText('Productos para el rostro', p.productos_rostro);

    sectionTitle('ANÁLISIS ESTÉTICO');
    blockText('Biotipo y estado de la piel', p.biotipo);
    fieldRow('Fototipo', p.fototipo);
    blockText('Lesiones elementales', p.lesiones);

    sectionTitle('CONSULTA');
    blockText('Motivo de consulta', p.motivo_consulta);
    blockText('Tratamiento primario', p.tratamiento_primario);

    sectionTitle('SESIONES REGISTRADAS');
    summarySessionsBox();

    if (sesionesPaciente.length === 0) {
      blockText('Sesiones', 'Este paciente no tiene sesiones registradas.');
    } else {
      sesionesPaciente.forEach((sesion, index) => {
        sesionCard(sesion, index);
      });
    }

    ensureSpace(40);
    y += 10;

    const lineWidth = 70;
    const leftSignatureX = margin + 10;
    const rightSignatureX = pageWidth - margin - lineWidth - 10;

    doc.setDrawColor(...colors.border);
    doc.line(leftSignatureX, y, leftSignatureX + lineWidth, y);
    doc.line(rightSignatureX, y, rightSignatureX + lineWidth, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.lightText);
    doc.text('Firma del Doctor', leftSignatureX + 12, y + 6);
    doc.text('Firma del Paciente', rightSignatureX + 10, y + 6);

    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('TUADERM · Ficha clínica generada desde el sistema', margin, pageHeight - 8);

    doc.save(`ficha-${(p.nombre || 'paciente').replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const resultados = useMemo(() => pacientes, [pacientes]);

  return (
    <div className="ficha-container">
      <div className="ficha-header">
        <div className="ficha-title">HISTORIAL DE PACIENTES</div>
      </div>

      {toast && (
        <div className={`toast-inline ${toast.type}`}>
          {toast.text}
        </div>
      )}

      <div className="p-6">
        <div className="sesion-field">
          <label>Buscar paciente por nombre</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="excel-input pl-9"
              placeholder="Escribe el nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="overflow-x-auto rounded-xl border border-[#eee] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f0f7]">
              <tr className="text-left text-[#6d5c6d]">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Edad</th>
                <th className="px-4 py-3">Sexo</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((p) => (
                <tr key={p.id} className="border-t border-[#f0e8f0]">
                  <td className="px-4 py-3">{p.nombre}</td>
                  <td className="px-4 py-3">{p.nro_telefono}</td>
                  <td className="px-4 py-3">{p.edad}</td>
                  <td className="px-4 py-3">{p.sexo}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => abrirFichaPaciente(p)}
                        className="btn btn-clear flex items-center gap-2"
                      >
                        <FileText size={14} />
                        Ver ficha
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirSesionesPaciente(p)}
                        className="btn btn-clear flex items-center gap-2"
                      >
                        <CalendarDays size={14} />
                        Ver sesiones
                      </button>

                      <button
                        type="button"
                        onClick={() => descargarPDF(p)}
                        className="btn btn-clear flex items-center gap-2"
                      >
                        <FileDown size={14} />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => eliminarPaciente(p.id, p.nombre)}
                        className="btn btn-save flex items-center gap-2"
                        style={{ background: '#b55f6a' }}
                        disabled={loading}
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && resultados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No se encontraron pacientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {verFicha && pacienteDetalle && (
        <div className="fixed inset-0 bg-black/40 modal-smooth flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto modal-card">
            <div className="ficha-header flex justify-between items-center">
              <div className="ficha-title">FICHA DEL PACIENTE</div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirEdicion(pacienteDetalle)}
                  className="btn btn-save flex items-center gap-2"
                >
                  <Pencil size={14} />
                  Editar
                </button>

                <button type="button" onClick={cerrarFichaPaciente} className="btn btn-clear flex items-center gap-2">
                  <X size={14} />
                  Cerrar
                </button>
              </div>
            </div>

            <div className="section-header">DATOS PERSONALES</div>
            <div className="form-grid">
              <div className="form-row"><label>Nombre:</label><input className="excel-input" value={pacienteDetalle.nombre || ''} disabled /></div>
              <div className="form-row"><label>Sexo:</label><input className="excel-input" value={pacienteDetalle.sexo || ''} disabled /></div>
              <div className="form-row"><label>Fecha Nacimiento:</label><input className="excel-input" value={pacienteDetalle.fecha_nacimiento || ''} disabled /></div>
              <div className="form-row"><label>Teléfono:</label><input className="excel-input" value={pacienteDetalle.nro_telefono || ''} disabled /></div>
              <div className="form-row"><label>Edad:</label><input className="excel-input" value={pacienteDetalle.edad ?? ''} disabled /></div>
              <div className="form-row"><label>Nro Hijos:</label><input className="excel-input" value={pacienteDetalle.nro_hijos ?? ''} disabled /></div>
              <div className="form-row col-span-2"><label>Ocupación:</label><input className="excel-input" value={pacienteDetalle.ocupacion || ''} disabled /></div>
            </div>

            <div className="section-header">ANTECEDENTES CLÍNICOS</div>
            <div className="form-grid">
              <div className="form-row"><label>Enfermedades:</label><input className="excel-input" value={pacienteDetalle.enfermedades || ''} disabled /></div>
              <div className="form-row"><label>Alergias:</label><input className="excel-input" value={pacienteDetalle.alergias || ''} disabled /></div>
              <div className="form-row"><label>Cirugías:</label><input className="excel-input" value={pacienteDetalle.cirugias || ''} disabled /></div>
              <div className="form-row"><label>Medicamentos:</label><input className="excel-input" value={pacienteDetalle.medicamentos || ''} disabled /></div>
              <div className="form-row"><label>Anticonceptivos:</label><input className="excel-input" value={pacienteDetalle.anticonceptivos || ''} disabled /></div>
              <div className="form-row"><label>Procedimientos Estéticos:</label><input className="excel-input" value={pacienteDetalle.procedimientos_esteticos || ''} disabled /></div>
              <div className="form-row"><label>Hace cuánto tiempo:</label><input className="excel-input" value={pacienteDetalle.tiempo_procedimientos || ''} disabled /></div>
              <div className="form-row col-span-2">
                <label>Observación clínica:</label>
                <textarea className="text-area" value={pacienteDetalle.observacion_clinica || ''} disabled />
              </div>
            </div>

            <div className="section-header">HÁBITOS</div>
            <div className="form-grid">
              <div className="form-row"><label>Actividad Física:</label><input className="excel-input" value={pacienteDetalle.actividad_fisica || ''} disabled /></div>
              <div className="form-row"><label>Fuma:</label><input className="excel-input" value={pacienteDetalle.fuma || ''} disabled /></div>
              <div className="form-row"><label>Consumo de Agua:</label><input className="excel-input" value={pacienteDetalle.consumo_agua || ''} disabled /></div>
              <div className="form-row"><label>Consumo de Alcohol:</label><input className="excel-input" value={pacienteDetalle.alcohol || ''} disabled /></div>
              <div className="form-row"><label>Periodo de Sueño:</label><input className="excel-input" value={pacienteDetalle.sueño || ''} disabled /></div>
              <div className="form-row"><label>Exposición al Sol:</label><input className="excel-input" value={pacienteDetalle.sol || ''} disabled /></div>
              <div className="form-row col-span-2"><label>Productos para el rostro:</label><input className="excel-input" value={pacienteDetalle.productos_rostro || ''} disabled /></div>
            </div>

            <div className="section-header">ANÁLISIS ESTÉTICO</div>
            <div className="p-6 flex flex-wrap gap-3">
              {splitCsv(pacienteDetalle.biotipo).map((item) => (
                <span key={item} className="badge active">{item}</span>
              ))}
              {splitCsv(pacienteDetalle.biotipo).length === 0 && <span className="text-sm text-gray-400">Sin datos</span>}
            </div>

            <div className="form-grid">
              <div className="form-row"><label>Fototipo:</label><input className="excel-input" value={pacienteDetalle.fototipo || ''} disabled /></div>
            </div>

            <div className="section-header">LESIONES</div>
            <div className="p-6 flex flex-wrap gap-3">
              {splitCsv(pacienteDetalle.lesiones).map((item) => (
                <span key={item} className="badge active">{item}</span>
              ))}
              {splitCsv(pacienteDetalle.lesiones).length === 0 && <span className="text-sm text-gray-400">Sin datos</span>}
            </div>

            <div className="section-header">MOTIVO DE CONSULTA</div>
            <div className="p-6">
              <textarea className="text-area" value={pacienteDetalle.motivo_consulta || ''} disabled />
            </div>

            <div className="section-header">TRATAMIENTO PRIMARIO</div>
            <div className="p-6">
              <textarea className="text-area" value={pacienteDetalle.tratamiento_primario || ''} disabled />
            </div>
          </div>
        </div>
      )}

      {verSesiones && pacienteDetalle && (
        <div className="fixed inset-0 bg-black/40 modal-smooth flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto modal-card">
            <div className="ficha-header flex justify-between items-center">
              <div className="ficha-title">SESIONES DE {pacienteDetalle.nombre}</div>
              <button
                type="button"
                onClick={cerrarSesionesPaciente}
                className="btn btn-clear flex items-center gap-2"
              >
                <X size={14} />
                Cerrar
              </button>
            </div>

            <div className="p-6 border-b border-[#f0e8f0] bg-[#fcf8fc]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="sesion-field">
                  <label>Desde</label>
                  <input
                    type="date"
                    className="excel-input"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  />
                </div>

                <div className="sesion-field">
                  <label>Hasta</label>
                  <input
                    type="date"
                    className="excel-input"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto rounded-xl border border-[#eee] bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f0f7]">
                    <tr className="text-left text-[#6d5c6d]">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Observaciones</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesionesFiltradas.map((s) => (
                      <tr key={s.id} className="border-t border-[#f0e8f0]">
                        <td className="px-4 py-3">{s.fecha}</td>
                        <td className="px-4 py-3">{s.descripcion}</td>
                        <td className="px-4 py-3">{s.observaciones}</td>
                        <td className="px-4 py-3">Bs. {Number(s.monto || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => abrirEdicionSesion(s)}
                              className="btn btn-clear flex items-center justify-center"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => eliminarSesion(s.id, pacienteDetalle.id)}
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

                    {!loading && sesionesFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          No hay sesiones para el rango seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/40 modal-smooth flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto modal-card">
            <div className="ficha-header flex justify-between items-center">
              <div className="ficha-title">EDITAR PACIENTE</div>
              <button type="button" onClick={cerrarEdicion} className="btn btn-clear flex items-center gap-2">
                <X size={14} />
                Cerrar
              </button>
            </div>

            <div className="section-header">DATOS PERSONALES</div>
            <div className="form-grid">
              <div className="form-row">
                <label>Nombre:</label>
                <input
                  className={`excel-input ${erroresEdit.nombre ? 'input-error' : ''}`}
                  value={form.nombre || ''}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, nombre: e.target.value }));
                    setErroresEdit((prev) => ({ ...prev, nombre: undefined }));
                  }}
                />
                {erroresEdit.nombre && <span className="field-error">{erroresEdit.nombre}</span>}
              </div>
              <div className="form-row">
                <label>Sexo:</label>
                <select
                  className="excel-input"
                  value={form.sexo || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, sexo: e.target.value }))}
                >
                  <option value="">Seleccionar</option>
                  <option>Femenino</option>
                  <option>Masculino</option>
                </select>
              </div>
              <div className="form-row">
                <label>Fecha Nacimiento:</label>
                <input
                  type="date"
                  className="excel-input"
                  value={form.fecha_nacimiento || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label>Teléfono:</label>
                <input
                  className="excel-input"
                  value={form.nro_telefono || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, nro_telefono: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <label>Edad:</label>
                <input
                  className="excel-input"
                  value={form.edad ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      edad: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="form-row">
                <label>Nro Hijos:</label>
                <input
                  className="excel-input"
                  value={form.nro_hijos ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      nro_hijos: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="form-row col-span-2">
                <label>Ocupación:</label>
                <input
                  className="excel-input"
                  value={form.ocupacion || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, ocupacion: e.target.value }))}
                />
              </div>
            </div>

            <div className="section-header">ANTECEDENTES CLÍNICOS</div>
            <div className="form-grid">
              <div className="form-row"><label>Enfermedades:</label><input className="excel-input" value={form.enfermedades || ''} onChange={(e) => setForm((prev) => ({ ...prev, enfermedades: e.target.value }))} /></div>
              <div className="form-row"><label>Alergias:</label><input className="excel-input" value={form.alergias || ''} onChange={(e) => setForm((prev) => ({ ...prev, alergias: e.target.value }))} /></div>
              <div className="form-row"><label>Cirugías:</label><input className="excel-input" value={form.cirugias || ''} onChange={(e) => setForm((prev) => ({ ...prev, cirugias: e.target.value }))} /></div>
              <div className="form-row"><label>Medicamentos:</label><input className="excel-input" value={form.medicamentos || ''} onChange={(e) => setForm((prev) => ({ ...prev, medicamentos: e.target.value }))} /></div>
              <div className="form-row"><label>Anticonceptivos:</label><input className="excel-input" value={form.anticonceptivos || ''} onChange={(e) => setForm((prev) => ({ ...prev, anticonceptivos: e.target.value }))} /></div>
              <div className="form-row"><label>Procedimientos Estéticos:</label><input className="excel-input" value={form.procedimientos_esteticos || ''} onChange={(e) => setForm((prev) => ({ ...prev, procedimientos_esteticos: e.target.value }))} /></div>
              <div className="form-row"><label>Hace cuánto tiempo:</label><input className="excel-input" value={form.tiempo_procedimientos || ''} onChange={(e) => setForm((prev) => ({ ...prev, tiempo_procedimientos: e.target.value }))} /></div>
              <div className="form-row col-span-2">
                <label>Observación clínica:</label>
                <textarea className="text-area" value={form.observacion_clinica || ''} onChange={(e) => setForm((prev) => ({ ...prev, observacion_clinica: e.target.value }))} />
              </div>
            </div>

            <div className="section-header">HÁBITOS</div>
            <div className="form-grid">
              <div className="form-row">
                <label>Actividad Física:</label>
                <select className="excel-input" value={form.actividad_fisica || ''} onChange={(e) => setForm((prev) => ({ ...prev, actividad_fisica: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option>Poca</option>
                  <option>Regular</option>
                  <option>Mucha</option>
                </select>
              </div>
              <div className="form-row">
                <label>Fuma:</label>
                <select className="excel-input" value={form.fuma || ''} onChange={(e) => setForm((prev) => ({ ...prev, fuma: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option>Si</option>
                  <option>No</option>
                </select>
              </div>
              <div className="form-row">
                <label>Consumo de Agua:</label>
                <select className="excel-input" value={form.consumo_agua || ''} onChange={(e) => setForm((prev) => ({ ...prev, consumo_agua: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option>Poca</option>
                  <option>Regular</option>
                  <option>Mucha</option>
                </select>
              </div>
              <div className="form-row">
                <label>Consumo de Alcohol:</label>
                <select className="excel-input" value={form.alcohol || ''} onChange={(e) => setForm((prev) => ({ ...prev, alcohol: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option>No</option>
                  <option>A veces</option>
                  <option>Frecuentemente</option>
                </select>
              </div>
              <div className="form-row">
                <label>Periodo de Sueño:</label>
                <select className="excel-input" value={form.sueño || ''} onChange={(e) => setForm((prev) => ({ ...prev, sueño: e.target.value }))}>
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
                <select className="excel-input" value={form.sol || ''} onChange={(e) => setForm((prev) => ({ ...prev, sol: e.target.value }))}>
                  <option value="">Seleccionar</option>
                  <option>Poca</option>
                  <option>Media</option>
                  <option>Mucha</option>
                </select>
              </div>
              <div className="form-row col-span-2"><label>Productos que utiliza para cuidarse el rostro:</label><input className="excel-input" value={form.productos_rostro || ''} onChange={(e) => setForm((prev) => ({ ...prev, productos_rostro: e.target.value }))} /></div>
            </div>

            <div className="section-header">ANÁLISIS ESTÉTICO</div>
            <div className="p-6 flex flex-wrap gap-3">
              {analisisOpciones.map((item: string) => (
                <button key={item} type="button" onClick={() => toggleBiotipo(item)} className={`badge ${biotipoSeleccionado.includes(item) ? 'active' : ''}`}>
                  {item}
                </button>
              ))}
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Fototipo:</label>
                <input className="excel-input" value={form.fototipo || ''} onChange={(e) => setForm((prev) => ({ ...prev, fototipo: e.target.value }))} />
              </div>
            </div>

            <div className="section-header">LESIONES</div>
            <div className="p-6 flex flex-wrap gap-3">
              {lesionesOpciones.map((item: string) => (
                <button key={item} type="button" onClick={() => toggleLesion(item)} className={`badge ${lesionesSeleccionadas.includes(item) ? 'active' : ''}`}>
                  {item}
                </button>
              ))}
            </div>

            <div className="section-header">MOTIVO DE CONSULTA</div>
            <div className="p-6">
              <textarea className="text-area" value={form.motivo_consulta || ''} onChange={(e) => setForm((prev) => ({ ...prev, motivo_consulta: e.target.value }))} />
            </div>

            <div className="section-header">TRATAMIENTO PRIMARIO</div>
            <div className="p-6">
              <textarea className="text-area" value={form.tratamiento_primario || ''} onChange={(e) => setForm((prev) => ({ ...prev, tratamiento_primario: e.target.value }))} />
            </div>

            <div className="btn-group">
              <button type="button" onClick={cerrarEdicion} className="btn btn-clear" disabled={loading}>
                Cancelar
              </button>
              <button type="button" onClick={guardarEdicion} className="btn btn-save flex items-center gap-2" disabled={loading}>
                <Save size={14} />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editandoSesion && (
        <div className="fixed inset-0 bg-black/40 modal-smooth flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden modal-card">
            <div className="ficha-header flex justify-between items-center">
              <div className="ficha-title">EDITAR SESIÓN</div>
              <button type="button" onClick={cerrarEdicionSesion} className="btn btn-clear flex items-center gap-2">
                <X size={14} />
                Cerrar
              </button>
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Fecha:</label>
                <input
                  type="date"
                  className="excel-input"
                  value={sesionForm.fecha || ''}
                  onChange={(e) => setSesionForm((prev) => ({ ...prev, fecha: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <label>Monto:</label>
                <input
                  className="excel-input"
                  value={sesionForm.monto ?? ''}
                  onChange={(e) =>
                    setSesionForm((prev) => ({
                      ...prev,
                      monto: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                />
              </div>

              <div className="form-row col-span-2">
                <label>Descripción:</label>
                <textarea
                  className="text-area"
                  value={sesionForm.descripcion || ''}
                  onChange={(e) => setSesionForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>

              <div className="form-row col-span-2">
                <label>Observaciones:</label>
                <textarea
                  className="text-area"
                  value={sesionForm.observaciones || ''}
                  onChange={(e) => setSesionForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>
            </div>

            <div className="btn-group">
              <button type="button" onClick={cerrarEdicionSesion} className="btn btn-clear" disabled={loading}>
                Cancelar
              </button>
              <button type="button" onClick={guardarEdicionSesion} className="btn btn-save flex items-center gap-2" disabled={loading}>
                <Save size={14} />
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmData.open && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <div className="confirm-card-body">
              <div className="confirm-card-title">{confirmData.title}</div>
              <div className="confirm-card-text">{confirmData.text}</div>
            </div>

            <div className="confirm-card-actions">
              <button type="button" className="btn btn-clear" onClick={cerrarConfirmacion}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-save"
                style={{ background: '#b55f6a' }}
                onClick={() => confirmData.onConfirm?.()}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPacientes;