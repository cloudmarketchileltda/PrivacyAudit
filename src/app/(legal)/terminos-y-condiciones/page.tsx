import type { Metadata } from 'next';
import { generalConfig } from '@/config/general';
import { LegalDocument } from '@/components/legal-document';

export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function TermsPage() {
  return (
    <LegalDocument
      title="Términos y condiciones"
      introduction="Estos términos iniciales describen el uso previsto de PrivacyAudit. Las condiciones comerciales, la identificación del prestador y los canales de soporte se incorporarán posteriormente."
      sections={[
        {
          title: '1. Objeto del servicio',
          text: 'PrivacyAudit permite registrar evaluaciones, actividades de tratamiento, hallazgos, tareas y evidencias, y dar seguimiento a un programa de protección de datos. Los resultados representan el trabajo registrado por los usuarios y requieren interpretación profesional; no constituyen una certificación legal ni una garantía de cumplimiento.',
        },
        {
          title: '2. Cuentas y acceso',
          text: 'El registro público está cerrado. Solo el administrador habilita cuentas de clientes y consultores y asigna sus permisos. Cada usuario debe proteger sus credenciales, utilizar su propia cuenta y comunicar al administrador cualquier sospecha de acceso indebido. El acceso a organizaciones depende de las membresías vigentes.',
        },
        {
          title: '3. Uso autorizado',
          text: 'Los usuarios deben aportar información pertinente y contar con autorización para registrar o cargar datos y documentos. No deben intentar acceder a otras organizaciones sin permiso, compartir credenciales, introducir contenido malicioso ni interferir con la seguridad o el funcionamiento del servicio.',
        },
        {
          title: '4. Contenido y revisión',
          text: 'Cada organización y sus usuarios son responsables de la exactitud, pertinencia y autorización de uso de la información aportada. Los consultores revisan evaluaciones y evidencias conforme a su trabajo profesional. El catálogo y las referencias normativas pueden actualizarse; las evaluaciones conservan copias históricas de sus controles.',
        },
        {
          title: '5. Administración y eliminación',
          text: `Política ${generalConfig.retention.policyVersion}. El administrador puede archivar una organización para conservarla en consulta y reactivarla posteriormente. Antes de eliminar puede generar una exportación ZIP de la organización archivada con registros, historial, informes y archivos, acompañada de un índice de tamaños y SHA-256. La exportación es opcional: no bloquea la eliminación confirmada. El destinatario debe verificar y conservar el paquete de forma segura; su preparación o descarga no acredita recepción ni conservación. El borrado definitivo elimina los datos de la organización y sus archivos de la base activa y Storage, conservando cuentas y catálogo global. ${generalConfig.retention.audit} ${generalConfig.retention.backups} La restauración de copias se realiza de forma aislada y exige excluir organizaciones eliminadas antes de reabrir el servicio. Las cuentas con relaciones de negocio protegidas no pueden eliminarse individualmente.`,
        },
        {
          title: '6. Disponibilidad y soporte',
          text: 'El servicio puede requerir mantenimiento y depender de proveedores de infraestructura. No se establece en este texto inicial un compromiso de disponibilidad ni un tiempo de respuesta de soporte. Esas condiciones se definirán en los acuerdos y en la versión definitiva de los términos.',
        },
        {
          title: '7. Modificaciones y consultas',
          text: 'Las versiones actualizadas se publicarán en esta página. Las consultas operativas deben dirigirse al administrador que habilitó la cuenta. Las condiciones contractuales, económicas y de resolución de controversias deberán completarse antes de aprobar el texto definitivo.',
        },
      ]}
    />
  );
}
