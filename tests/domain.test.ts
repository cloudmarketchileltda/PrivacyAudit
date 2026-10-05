import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validRut, organizationSchema } from '../src/features/organizations/schemas';
import { evaluationMetrics } from '../src/features/assessments/model';
import { responseSchema } from '../src/features/assessments/schemas';
import { safeNext } from '../src/lib/config';
test('Métricas cuentan trabajo evaluado y manejan cero controles', () => {
  assert.equal(evaluationMetrics([]).progress, 0);
  const m = evaluationMetrics([
    { status: 'PENDING' },
    { status: 'CONFORM' },
    { status: 'NON_CONFORM' },
    { status: 'NOT_APPLICABLE' },
  ]);
  assert.equal(m.progress, 75);
  assert.equal(m.evaluated, 3);
  assert.equal(m.counts.NON_CONFORM, 1);
});
test('No aplica exige motivo y no acepta un estado desconocido', () => {
  const base = {
    id: '10000000-0000-4000-8000-000000000001',
    auditor_comment: '',
    applicability_reason: '',
    status: 'NOT_APPLICABLE',
  };
  assert.equal(responseSchema.safeParse(base).success, false);
  assert.equal(
    responseSchema.safeParse({ ...base, applicability_reason: 'No realiza esta actividad' })
      .success,
    true,
  );
  assert.equal(responseSchema.safeParse({ ...base, status: 'LEGAL_COMPLIANCE' }).success, false);
});
test('RUT con módulo 11 y rechazo de entradas inválidas', () => {
  assert.equal(validRut('76.123.456-0'), true);
  assert.equal(validRut('76123456-1'), false);
  assert.equal(organizationSchema.shape.rut.parse('76.123.456-0'), '76123456-0');
});
test('Redirecciones aceptan solo destinos relativos seguros', () => {
  assert.equal(safeNext('https://evil.test'), '/dashboard');
  assert.equal(safeNext('//evil.test'), '/dashboard');
  assert.equal(safeNext('/\t/evil.test'), '/dashboard');
  assert.equal(safeNext('/\\evil.test'), '/dashboard');
  assert.equal(safeNext('/invite?token=abc'), '/invite?token=abc');
});
