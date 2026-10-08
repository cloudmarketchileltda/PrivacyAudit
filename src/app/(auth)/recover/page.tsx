import { ActionForm, Field } from '@/components/forms';
import { recover } from '@/features/auth/actions';
export default function Page() {
  return (
    <>
      <h1 className="page-title mb-6">Recuperar acceso</h1>
      <ActionForm action={recover} label="Solicitar enlace" variant="default">
        <Field label="Email" name="email" type="email" required />
      </ActionForm>
    </>
  );
}
