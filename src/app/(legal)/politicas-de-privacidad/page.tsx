import type { Metadata } from 'next';
import { LegalDocument } from '@/components/legal-document';

export const metadata: Metadata = { title: 'Políticas de Privacidad' };

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Políticas de Privacidad"
      introduction="Esta política describe el tratamiento de información en PrivacyAudit, una plataforma de gestión y diagnóstico de programas de protección de datos. Esta versión inicial se actualizará con la identificación del operador, su canal de contacto y las condiciones definitivas del servicio."
      sections={[
        {
          title: '1. Información utilizada',
          text: 'La plataforma utiliza datos de cuenta, como nombre, correo electrónico y rol; información de las organizaciones y sus integrantes; evaluaciones, tratamientos, hallazgos, tareas, comentarios y archivos aportados por usuarios autorizados. También conserva eventos de actividad y auditoría necesarios para la trazabilidad. Las organizaciones deben limitar los datos incluidos en documentos y evidencias a lo necesario para su trabajo.',
        },
        {
          title: '2. Finalidades',
          text: 'La información se utiliza para autenticar usuarios, administrar cuentas y permisos, gestionar el trabajo de cada organización, almacenar y revisar evidencias, mostrar notificaciones internas y registrar operaciones relevantes. Las credenciales y sesiones permiten mantener el acceso autenticado. Los correos de autenticación se destinan a los procesos de acceso y recuperación de cuenta.',
        },
        {
          title: '3. Acceso y proveedores',
          text: 'El acceso depende del rol y las membresías vigentes. Los archivos se almacenan de forma privada y se descargan con autorización. El servicio utiliza Supabase para autenticación, base de datos y almacenamiento. La identificación completa de los proveedores, sus ubicaciones y las condiciones de tratamiento y transferencias se incorporará a la versión definitiva de esta política.',
        },
        {
          title: '4. Conservación y eliminación',
          text: 'Los registros operativos y las evidencias mantienen su historia durante el trabajo de la organización. El administrador puede eliminar de forma confirmada una organización y todos sus datos y archivos relacionados; las cuentas de usuario y el catálogo global se conservan. La eliminación individual de una cuenta está sujeta a sus relaciones de negocio e historial protegido. Los plazos y criterios definitivos de conservación se detallarán en la versión aprobada.',
        },
        {
          title: '5. Solicitudes sobre datos personales',
          text: 'Para consultas, correcciones u otras solicitudes relacionadas con sus datos, contacte al administrador que habilitó su cuenta. Si la consulta se refiere a datos incorporados por una organización, diríjala también al responsable de esa organización. El operador deberá publicar su identificación y un canal específico para estas solicitudes en la versión definitiva.',
        },
        {
          title: '6. Sesiones y enlaces externos',
          text: 'La aplicación utiliza cookies de sesión para la autenticación. Los enlaces a redes sociales y al sitio oficial de la ley abren servicios externos con sus propias políticas de privacidad. Visitar esos enlaces queda a elección del usuario.',
        },
        {
          title: '7. Actualizaciones',
          text: 'Las modificaciones se publicarán en esta página con su fecha de actualización. La versión definitiva deberá precisar el responsable del servicio, las bases de tratamiento, los proveedores y los canales y procedimientos aplicables.',
        },
      ]}
    />
  );
}
