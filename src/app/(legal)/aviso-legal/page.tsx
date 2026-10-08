import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';
import { generalConfig } from '@/config/general';

export const metadata: Metadata = { title: 'Aviso Legal' };

export default function LegalNoticePage() {
  return (
    <>
      <LegalDocument
        title="Aviso Legal"
        introduction="PrivacyAudit es una herramienta de apoyo a la gestión, diagnóstico, seguimiento y preparación de evidencias de programas de protección de datos. Este aviso contiene un texto inicial que se completará con los datos del titular del servicio."
        sections={[
          {
            title: '1. Identificación del titular',
            text: 'Nombre del servicio: PrivacyAudit. La razón social del operador, RUT, domicilio y correo de contacto están pendientes de incorporación. Para consultas operativas durante esta etapa, contacte al administrador que habilitó su cuenta.',
          },
          {
            title: '2. Alcance de la información',
            text: 'Las evaluaciones, métricas y referencias normativas sirven de apoyo al trabajo de consultores y organizaciones. Una evaluación completada, un control evaluado o una evidencia aceptada no equivalen por sí mismos a cumplimiento jurídico. El análisis legal y profesional corresponde a los responsables de cada revisión.',
          },
          {
            title: '3. Contenidos y derechos',
            text: 'Los usuarios deben respetar los derechos de terceros al incorporar documentos, imágenes u otra información. Las marcas de redes sociales y los contenidos de sitios externos pertenecen a sus respectivos titulares. Los derechos sobre los materiales aportados por cada organización se rigen por las autorizaciones y acuerdos correspondientes.',
          },
          {
            title: '4. Enlaces externos',
            text: 'Los enlaces a redes sociales permiten visitar sus sitios externos. El enlace a la nueva ley de privacidad conduce al texto de la Ley 21.719 publicado por la Biblioteca del Congreso Nacional de Chile. Las condiciones y contenidos de esos sitios corresponden a sus respectivos administradores.',
          },
          {
            title: '5. Actualización y contacto',
            text: 'Este aviso podrá modificarse para reflejar la identificación del operador, sus canales oficiales y las condiciones del servicio. La información normativa y contractual deberá revisarse antes de aprobar la versión definitiva.',
          },
        ]}
      />
      <p className="text-sm leading-6 text-slate-600">
        Consulte el texto oficial de la{' '}
        <a
          href={generalConfig.site.privacyLaw.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-800 underline"
        >
          Ley 21.719 en la Biblioteca del Congreso Nacional (abre en una nueva pestaña)
        </a>
        .
      </p>
    </>
  );
}
