export type LegalFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  reference: string;
  page: number;
};

// Síntesis editorial del PDF versionado; no son respuestas generadas por IA.
// Los artículos citados pertenecen a la Ley 19.628 reformada salvo indicación expresa.
export const legalFaqs: readonly LegalFaq[] = [
  {
    id: 'vigencia',
    category: 'Marco normativo',
    question: '¿Cuándo entra en vigor el nuevo régimen?',
    answer:
      'Las modificaciones principales comienzan a regir el 1 de diciembre de 2026. Antes de esa fecha, esta biblioteca sirve para preparar la adaptación y no sustituye las obligaciones actualmente aplicables. El PDF identifica su versión y las disposiciones transitorias.',
    reference: 'Ley 21.719, artículo primero transitorio; portada del PDF',
    page: 53,
  },
  {
    id: 'leyes',
    category: 'Marco normativo',
    question: '¿Qué relación existe entre las leyes 19.628 y 21.719?',
    answer:
      'La Ley 21.719 modifica la Ley 19.628. El PDF muestra la reforma; para leer las disposiciones integradas conviene consultar también el texto consolidado de la Ley 19.628, seleccionando la versión correspondiente a la fecha del caso.',
    reference: 'Ley 21.719, artículo primero permanente',
    page: 1,
  },
  {
    id: 'datos',
    category: 'Conceptos',
    question: '¿Qué es un dato personal y qué es un dato sensible?',
    answer:
      'Un dato personal permite identificar a una persona natural, directamente o al combinarlo con otros antecedentes. Los datos sensibles se refieren a aspectos especialmente protegidos de su vida, como salud, biometría, creencias u orientación sexual. Debe revisarse la definición completa antes de clasificar los datos de una organización.',
    reference: 'Ley 19.628 reformada, artículo 2, letras f) y g)',
    page: 2,
  },
  {
    id: 'roles',
    category: 'Conceptos',
    question: '¿Quién es responsable y quién es encargado del tratamiento?',
    answer:
      'El responsable decide los fines y medios del tratamiento. El encargado trata datos por cuenta del responsable y conforme al encargo. La intervención de un proveedor no elimina por sí sola las responsabilidades de la organización.',
    reference: 'Ley 19.628 reformada, artículo 2, letras n) y x); artículo 15 bis',
    page: 3,
  },
  {
    id: 'principios',
    category: 'Obligaciones',
    question: '¿Qué principios orientan el tratamiento de datos?',
    answer:
      'El régimen reformado contempla licitud y lealtad, finalidad, proporcionalidad, calidad, responsabilidad, seguridad, transparencia e información y confidencialidad. Estos principios deben considerarse en cada tratamiento, junto con sus reglas específicas.',
    reference: 'Ley 19.628 reformada, artículo 3',
    page: 5,
  },
  {
    id: 'consentimiento',
    category: 'Obligaciones',
    question: '¿Siempre se necesita consentimiento?',
    answer:
      'El consentimiento es una base de licitud, pero el régimen reformado contempla otras fuentes, como obligación legal, contrato e interés legítimo bajo sus condiciones. No basta con elegir una etiqueta: hay que justificar la base aplicable y revisar las reglas especiales del tratamiento.',
    reference: 'Ley 19.628 reformada, artículos 12 y 13',
    page: 11,
  },
  {
    id: 'derechos',
    category: 'Derechos de titulares',
    question: '¿Qué derechos reconoce el nuevo régimen?',
    answer:
      'Reconoce acceso, rectificación, supresión, oposición, portabilidad y bloqueo, con requisitos y excepciones particulares. La organización debe contar con un procedimiento para recibir y tramitar solicitudes; la procedencia se analiza según el derecho ejercido y los antecedentes del caso.',
    reference: 'Ley 19.628 reformada, artículos 4 a 11',
    page: 6,
  },
  {
    id: 'supresion',
    category: 'Derechos de titulares',
    question: '¿Toda solicitud de supresión obliga a borrar inmediatamente?',
    answer:
      'La supresión tiene causales y excepciones. Por ejemplo, puede existir una obligación legal de conservación o una necesidad vinculada a reclamaciones. Se debe analizar la solicitud y responder conforme al procedimiento aplicable; no asumir que toda conservación está permitida o que toda solicitud exige borrar sin evaluación.',
    reference: 'Ley 19.628 reformada, artículo 7',
    page: 7,
  },
  {
    id: 'seguridad',
    category: 'Seguridad y proveedores',
    question: '¿Qué medidas de seguridad debe adoptar una organización?',
    answer:
      'Las medidas deben ser apropiadas al riesgo y al contexto del tratamiento, considerando la naturaleza de los datos y los factores que indica la ley. El artículo contempla medidas técnicas y organizativas; no establece una única lista que garantice cumplimiento para todas las organizaciones.',
    reference: 'Ley 19.628 reformada, artículo 14 quinquies',
    page: 15,
  },
  {
    id: 'incidentes',
    category: 'Seguridad y proveedores',
    question: '¿La ley fija un plazo general de 72 horas para reportar incidentes?',
    answer:
      'El artículo 14 sexies exige reportar a la Agencia sin dilaciones indebidas cuando se cumplen sus condiciones de riesgo; no fija un plazo general de 72 horas. También deben revisarse sus supuestos de comunicación a titulares y las reglas sectoriales aplicables.',
    reference: 'Ley 19.628 reformada, artículo 14 sexies',
    page: 15,
  },
  {
    id: 'proveedores',
    category: 'Seguridad y proveedores',
    question: '¿Qué revisar al contratar un proveedor que trata datos?',
    answer:
      'Debe definirse el encargo, sus instrucciones y las condiciones contractuales previstas en la ley. Conviene identificar qué datos recibe el proveedor, para qué los utiliza y qué medidas aplica. Un contrato genérico no sustituye la revisión del tratamiento concreto.',
    reference: 'Ley 19.628 reformada, artículo 15 bis',
    page: 17,
  },
  {
    id: 'impacto',
    category: 'Obligaciones',
    question: '¿Cuándo se requiere una evaluación de impacto?',
    answer:
      'El nuevo régimen exige una evaluación previa cuando sea probable que el tratamiento produzca un alto riesgo para los derechos de las personas y en los supuestos que enumera el artículo. La evaluación de PrivacyAudit no equivale automáticamente a esta evaluación de impacto.',
    reference: 'Ley 19.628 reformada, artículo 15 ter',
    page: 18,
  },
];

export function normalizeLegalSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}

export function filterLegalFaqs(query: string, category: string) {
  const terms = normalizeLegalSearch(query).split(/\s+/).filter(Boolean);
  return legalFaqs.filter((faq) => {
    const text = normalizeLegalSearch(
      `${faq.question} ${faq.answer} ${faq.reference} ${faq.category}`,
    );
    return (!category || faq.category === category) && terms.every((term) => text.includes(term));
  });
}
