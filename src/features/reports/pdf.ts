import PDFDocument from 'pdfkit';
import path from 'node:path';
import { controlLabels, controlStatuses, assessmentLabels } from '@/features/assessments/model';
import {
  findingCode,
  findingLabels,
  taskLabels,
  severityLabels,
  calendarDate,
} from '@/features/workflow/schemas';
import { reviewLabels } from '@/features/evidence/schemas';
import {
  subjectLabels,
  dataLabels,
  basisLabels,
  tristateLabels,
  statusLabels,
} from '@/features/processing/schemas';
import { reportSnapshotSchema, reportMetrics, reportDate, reportDisclaimer } from './model';

/** Server-only Node renderer. It uses the saved snapshot, never current business rows. */
export async function renderReportPdf(report: { id: string; title: string; snapshot: unknown }) {
  const s = reportSnapshotSchema.parse(report.snapshot);
  const metrics = reportMetrics(s);
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 64, bottom: 64, left: 54, right: 54 },
    bufferPages: true,
    info: {
      Title: report.title,
      Author: s.author,
      Subject: 'Informe de diagnóstico de protección de datos',
      CreationDate: new Date(s.captured_at),
    },
  });
  const buffers: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
  const fontRoot = path.join(process.cwd(), 'src/features/reports/fonts');
  doc.registerFont('Body', path.join(fontRoot, 'NotoSans-Regular.ttf'));
  doc.registerFont('Strong', path.join(fontRoot, 'NotoSans-Bold.ttf'));
  const width = doc.page.width - 108;
  const body = (value: string) => {
    doc
      .font('Body')
      .fontSize(10)
      .fillColor('#334155')
      .text(value || 'Sin información registrada.', 54, doc.y, { width, lineGap: 3 });
    doc.moveDown(0.7);
  };
  const ensure = (height = 70) => {
    if (doc.y + height > doc.page.height - 64) doc.addPage();
  };
  const heading = (value: string, requiredHeight = 70) => {
    ensure(requiredHeight);
    doc.font('Strong').fontSize(14).fillColor('#0f766e').text(value, 54, doc.y, { width });
    doc.moveDown(0.6);
  };
  const section = (value: string) => {
    doc.addPage();
    heading(value);
  };
  const field = (label: string, value: string | null | undefined) =>
    body(`${label}: ${value || 'Sin información registrada.'}`);
  const table = (headers: string[], rows: string[][], ratios: number[]) => {
    const widths = ratios.map((r) => r * width);
    const draw = (cells: string[], header = false) => {
      doc.font(header ? 'Strong' : 'Body').fontSize(header ? 8 : 9);
      const height =
        Math.max(
          ...cells.map((v, i) => doc.heightOfString(v, { width: widths[i] - 14, lineGap: 2 })),
        ) + 18;
      // Very long cells use flowing text instead of a table row, so content is never clipped.
      if (height > doc.page.height - 150) {
        ensure();
        cells.forEach((v, i) => field(headers[i], v));
        return;
      }
      if (doc.y + height > doc.page.height - 64) {
        doc.addPage();
        if (!header) draw(headers, true);
      }
      const y = doc.y;
      let x = 54;
      doc.rect(x, y, width, height).fill(header ? '#0f766e' : '#f1f5f9');
      cells.forEach((v, i) => {
        doc
          .font(header ? 'Strong' : 'Body')
          .fontSize(header ? 8 : 9)
          .fillColor(header ? '#ffffff' : '#334155')
          .text(v, x + 7, y + 8, { width: widths[i] - 14, lineGap: 2 });
        x += widths[i];
      });
      doc.y = y + height + 3;
      doc.x = 54;
    };
    doc.font('Body').fontSize(9);
    const firstHeight = rows.length
      ? Math.max(
          ...rows[0].map((v, i) => doc.heightOfString(v, { width: widths[i] - 14, lineGap: 2 })),
        ) + 18
      : 0;
    ensure(Math.min(firstHeight + 55, doc.page.height - 128));
    draw(headers, true);
    for (const row of rows) draw(row);
    doc.moveDown();
  };
  doc.rect(0, 0, doc.page.width, 18).fill('#0f766e');
  doc.y = 115;
  doc.font('Strong').fontSize(32).fillColor('#0f172a').text('PrivacyAudit', 54, doc.y, { width });
  doc.moveDown();
  doc.fontSize(24).text('Informe de diagnóstico de protección de datos', 54, doc.y, { width });
  doc.moveDown(1.2);
  heading(s.organization.legal_name);
  field('RUT', s.organization.rut);
  field('Informe', report.title);
  field('Evaluación', s.assessment.name);
  field('Fecha de corte', reportDate(s.captured_at));
  field('Consultor de la evaluación', s.consultant);
  field('Publicado por', s.author);
  field('Estado de evaluación', assessmentLabels[s.assessment.status]);
  body(
    'Documento confidencial para los miembros autorizados de la organización. Los datos corresponden a la fecha de corte; cada nueva publicación conserva una versión independiente.',
  );
  body(reportDisclaimer);
  section('1. Resumen ejecutivo');
  body(s.executive_summary);
  table(
    ['Controles evaluados', 'Avance de evaluación', 'Hallazgos abiertos', 'Tareas vencidas'],
    [
      [
        `${metrics.evaluated} / ${metrics.total}`,
        `${metrics.progress}%`,
        String(metrics.open),
        String(metrics.overdue),
      ],
    ],
    [0.25, 0.25, 0.25, 0.25],
  );
  body(
    'El avance cuenta controles con estado distinto de Pendiente, incluidos los No aplica con justificación. No expresa un porcentaje de cumplimiento legal.',
  );
  section('2. Alcance');
  body(s.scope);
  field('Evaluación seleccionada', s.assessment.name);
  field('Alcance registrado en la evaluación', s.assessment.description);
  body(
    'Los controles, hallazgos y tareas corresponden a esta evaluación. Los tratamientos incluyen todo el registro de la organización, con su estado. Las evidencias revisadas incluyen las asociadas a esta evaluación y los documentos generales de la organización; se conservan las entregas anteriores. Se excluyen cargas incompletas y entregas pendientes de revisión.',
  );
  section('3. Metodología');
  body(
    'Diagnóstico basado en los estados y observaciones registrados por el consultor sobre las copias históricas de los controles. Se presentan métricas objetivas, hallazgos por severidad y acciones correctivas. Las bases de licitud y referencias normativas requieren valoración profesional; la plataforma no las valida automáticamente.',
  );
  body(
    'Las evidencias se enumeran con su decisión de revisión y trazabilidad; no se incorporan los archivos originales al PDF. Aceptar una evidencia no certifica su contenido ni aprueba automáticamente una tarea. El progreso de acciones cuenta únicamente tareas aprobadas.',
  );
  section('4. Avance de evaluación');
  table(
    ['Estado', 'Controles'],
    controlStatuses.map((k) => [controlLabels[k], String(metrics.counts[k])]),
    [0.75, 0.25],
  );
  field('Avance de evaluación', `${metrics.progress}%`);
  if (!metrics.total)
    body('Esta evaluación no contiene controles. No es posible calcular un avance significativo.');
  section('5. Resultados por categoría');
  const categories = [...new Set(s.controls.map((c) => c.snapshot.category))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  for (const category of categories) {
    heading(category, 230);
    const cs = s.controls.filter((c) => c.snapshot.category === category);
    body(
      controlStatuses
        .map(
          (status) => `${controlLabels[status]}: ${cs.filter((c) => c.status === status).length}`,
        )
        .join(' · '),
    );
    table(
      ['Código / Control', 'Estado', 'Referencia normativa'],
      cs.map((c) => [
        `${c.snapshot.code} - ${c.snapshot.title}`,
        controlLabels[c.status],
        `${c.snapshot.normative_reference || 'Sin referencia'}\n${c.snapshot.legal_review_status === 'PENDING' ? 'Pendiente de revisión jurídica' : 'Revisión jurídica registrada'}`,
      ]),
      [0.48, 0.18, 0.34],
    );
    for (const c of cs) {
      if (c.auditor_comment || c.applicability_reason) {
        heading(c.snapshot.code);
        if (c.auditor_comment) field('Observación del consultor', c.auditor_comment);
        if (c.applicability_reason) field('Motivo de no aplicabilidad', c.applicability_reason);
      }
    }
  }
  if (!categories.length) body('No hay resultados por categoría.');
  section('6. Hallazgos');
  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const) {
    heading(`Severidad ${severityLabels[severity].toLowerCase()}`);
    const findings = s.findings.filter((f) => f.severity === severity);
    if (!findings.length) body('Sin hallazgos registrados en esta severidad.');
    for (const f of findings) {
      heading(`${findingCode(f.code)} - ${f.title}`);
      field('Estado', findingLabels[f.status]);
      field('Responsable', f.assignee_name);
      field('Fecha objetivo', calendarDate(f.due_date));
      field('Área', f.area);
      const c = s.controls.find((c) => c.id === f.control_id);
      field(
        'Control histórico',
        c ? `${c.snapshot.code} - ${c.snapshot.title}` : 'Sin control asociado',
      );
      field('Descripción', f.description);
      field('Recomendación', f.recommendation);
      if (f.closure_note) field('Justificación de cierre / riesgo', f.closure_note);
    }
  }
  section('7. Plan de acción');
  if (!s.findings.length) body('No hay acciones asociadas a esta evaluación.');
  for (const f of s.findings) {
    heading(`${findingCode(f.code)} - ${f.title}`);
    const tasks = s.tasks.filter((t) => t.finding_id === f.id);
    const done = tasks.filter((t) => t.status === 'DONE').length;
    body(
      `Prioridad: ${severityLabels[f.severity]} · Responsable: ${f.assignee_name} · Fecha: ${calendarDate(f.due_date)} · Estado: ${findingLabels[f.status]}`,
    );
    body(
      tasks.length
        ? `Progreso: ${done} de ${tasks.length} tareas aprobadas (${Math.round((done / tasks.length) * 100)}%).`
        : 'Sin tareas registradas.',
    );
    if (tasks.length)
      table(
        ['Tarea', 'Responsable', 'Prioridad / Estado', 'Fecha objetivo'],
        tasks.map((t) => [
          t.title,
          t.assignee_name,
          `${severityLabels[t.priority]} / ${taskLabels[t.status]}`,
          calendarDate(t.due_date),
        ]),
        [0.35, 0.23, 0.25, 0.17],
      );
    for (const t of tasks) {
      if (t.description || t.reviewer_comment) {
        heading(t.title);
        if (t.description) field('Descripción', t.description);
        if (t.reviewer_comment) field('Observaciones de revisión', t.reviewer_comment);
      }
    }
  }
  section('8. Actividades de tratamiento registradas');
  if (!s.processing.length) body('No hay actividades de tratamiento registradas.');
  for (const p of s.processing) {
    heading(p.name);
    field('Estado', statusLabels[p.status]);
    field('Área / Responsable', `${p.area || 'Sin área'} / ${p.owner || 'Sin responsable'}`);
    field('Finalidad', p.purpose);
    field('Titulares', p.data_subject_categories.map((k) => subjectLabels[k]).join(', '));
    field('Categorías de datos', p.personal_data_categories.map((k) => dataLabels[k]).join(', '));
    field('Datos sensibles', tristateLabels[p.sensitive_data]);
    field('Origen', p.source);
    field('Base de licitud propuesta', basisLabels[p.legal_basis]);
    field('Explicación', p.legal_basis_details);
    field('Sistemas', p.systems);
    field('Destinatarios', p.recipients);
    field('Encargados / Proveedores', p.processors);
    field('Transferencias internacionales', tristateLabels[p.international_transfer]);
    field('Detalle de transferencias', p.international_transfer_details);
    field('Conservación', p.retention_period);
    field('Criterios de conservación', p.retention_criteria);
    field('Medidas de seguridad', p.security_measures);
    if (p.notes) field('Observaciones', p.notes);
  }
  section('9. Evidencias revisadas');
  if (!s.evidence.length) body('No hay evidencias revisadas dentro del alcance.');
  for (const e of s.evidence) {
    heading(e.original_filename);
    field('Entrega', e.id);
    field('Estado de revisión', reviewLabels[e.review_status]);
    field('Descripción', e.description);
    field('Revisada por', e.reviewer_name);
    field('Fecha de revisión', reportDate(e.reviewed_at));
    if (e.reviewer_comment) field('Observaciones', e.reviewer_comment);
    const f = s.findings.find((f) => f.id === e.finding_id);
    const t = s.tasks.find((t) => t.id === e.task_id);
    const c = s.controls.find((c) => c.id === e.control_id);
    field(
      'Contexto',
      [c?.snapshot.code, f ? findingCode(f.code) : null, t?.title].filter(Boolean).join(' / ') ||
        'Documento general de la organización',
    );
    if (e.previous_evidence_id) field('Corrige la entrega', e.previous_evidence_id);
  }
  section('10. Conclusiones');
  body(s.conclusions);
  body(reportDisclaimer);
  const pages = doc.bufferedPageRange();
  for (let i = pages.start; i < pages.start + pages.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .font('Body')
      .fontSize(7)
      .fillColor('#64748b')
      .text(
        `PrivacyAudit · Confidencial · ${report.id.slice(0, 8)} · ${i + 1} / ${pages.count}`,
        54,
        doc.page.height - 36,
        { width, align: 'right', lineBreak: false },
      );
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  return completed;
}
