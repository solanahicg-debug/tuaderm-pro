import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* =========================
   📊 EXPORTAR A EXCEL
========================= */
export const exportarExcel = (
  nombreArchivo: string,
  nombreHoja: string,
  data: any[]
) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
};

/* =========================
   📄 EXPORTAR A PDF
========================= */
export const exportarPdfTabla = ({
  titulo,
  nombreArchivo,
  columnas,
  filas,
  resumen = [],
}: {
  titulo: string;
  nombreArchivo: string;
  columnas: string[];
  filas: any[][];
  resumen?: string[];
}) => {
  const doc = new jsPDF();

  doc.setFontSize(14);
  doc.text(titulo, 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [columnas],
    body: filas,
  });

  let y = (doc as any).lastAutoTable.finalY + 10;

  resumen.forEach((linea) => {
    doc.setFontSize(10);
    doc.text(linea, 14, y);
    y += 6;
  });

  doc.save(`${nombreArchivo}.pdf`);
};

/* =========================
   🧾 MAPEO INGRESOS
========================= */
export const mapIngresosExcel = (sesiones: any[], otros: any[]) => {
  return [
    ...sesiones.map((s) => ({
      Tipo: 'Sesión',
      Fecha: s.fecha,
      Concepto: 'Sesión clínica',
      Monto: Number(s.monto || 0),
    })),
    ...otros.map((o) => ({
      Tipo: 'Otro ingreso',
      Fecha: o.fecha,
      Concepto: o.concepto || '',
      Monto: Number(o.monto || 0),
    })),
  ];
};

export const mapIngresosPdf = (sesiones: any[], otros: any[]) => {
  return [
    ...sesiones.map((s) => [
      'Sesión',
      s.fecha,
      'Sesión clínica',
      `Bs. ${Number(s.monto || 0).toFixed(2)}`,
    ]),
    ...otros.map((o) => [
      'Otro ingreso',
      o.fecha,
      o.concepto || '',
      `Bs. ${Number(o.monto || 0).toFixed(2)}`,
    ]),
  ];
};

/* =========================
   💸 MAPEO EGRESOS
========================= */
export const mapEgresosExcel = (egresos: any[]) => {
  return egresos.map((e) => ({
    Fecha: e.fecha,
    Concepto: e.concepto,
    Descripción: e.descripcion,
    Monto: Number(e.monto || 0),
  }));
};

export const mapEgresosPdf = (egresos: any[]) => {
  return egresos.map((e) => [
    e.fecha,
    e.concepto,
    e.descripcion,
    `Bs. ${Number(e.monto || 0).toFixed(2)}`,
  ]);
};