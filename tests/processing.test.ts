import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processingSchema, processingInput } from '../src/features/processing/schemas';
const valid = {
  name: 'Gestión de clientes',
  area: 'Comercial',
  owner: 'Ventas',
  purpose: 'Gestión de relaciones comerciales',
  data_subject_categories: ['CLIENTS'],
  personal_data_categories: ['CONTACT'],
  sensitive_data: 'UNKNOWN',
  source: 'Formulario',
  legal_basis: 'UNDETERMINED',
  legal_basis_details: '',
  systems: 'CRM',
  recipients: '',
  processors: '',
  international_transfer: 'UNKNOWN',
  international_transfer_details: '',
  retention_period: '',
  retention_criteria: '',
  security_measures: '',
  notes: '',
  status: 'DRAFT',
};
test('Tratamientos: categorías múltiples en FormData y explicación condicional', () => {
  const data = new FormData();
  for (const [k, v] of Object.entries(valid))
    for (const value of Array.isArray(v) ? v : [v]) data.append(k, value);
  data.append('data_subject_categories', 'EMPLOYEES');
  const parsed = processingSchema.parse(processingInput(data));
  assert.deepEqual(parsed.data_subject_categories, ['CLIENTS', 'EMPLOYEES']);
  assert.equal(
    processingSchema.safeParse({ ...valid, international_transfer: 'YES' }).success,
    false,
  );
  assert.equal(
    processingSchema.safeParse({
      ...valid,
      international_transfer: 'YES',
      international_transfer_details: 'Proveedor en otro país',
    }).success,
    true,
  );
  assert.equal(processingSchema.safeParse({ ...valid, legal_basis: 'OTHER' }).success, false);
  assert.equal(
    processingSchema.safeParse({
      ...valid,
      legal_basis: 'OTHER',
      legal_basis_details: 'Explicación pendiente de revisión',
    }).success,
    true,
  );
  for (const bad of [
    { data_subject_categories: [] },
    { personal_data_categories: ['INVALID'] },
    { purpose: ' ' },
    { notes: 'x'.repeat(10001) },
    { status: 'COMPLETED' },
  ])
    assert.equal(processingSchema.safeParse({ ...valid, ...bad }).success, false);
});
