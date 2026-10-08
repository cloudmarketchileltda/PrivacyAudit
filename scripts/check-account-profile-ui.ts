import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startFixture } from './ui-fixture';

const fixture = await startFixture();
const base = 'http://127.0.0.1:3032';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3032'],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54331',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
      APP_URL: base,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
server.stdout.on('data', (chunk) => (logs += chunk));
server.stderr.on('data', (chunk) => (logs += chunk));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
await mkdir('artifacts/ui', { recursive: true });
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(base + '/api/health')).ok) break;
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const login = async (email: string, password = 'FixturePassword123') => {
    await page.goto(base + '/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  };
  await login('client@example.test');
  await page.goto(base + '/account');
  await page.getByLabel('Nombre completo', { exact: true }).fill('Cliente con datos');
  await page.getByLabel('Dirección', { exact: true }).fill('Calle de prueba 123');
  await page.getByLabel('Teléfono', { exact: true }).fill('+56 9 1234 5678');
  await page.getByLabel('Ciudad', { exact: true }).fill('Santiago');
  await page.getByLabel('País', { exact: true }).fill('Chile');
  await page.getByRole('button', { name: 'Guardar datos de cuenta', exact: true }).click();
  await page.getByText('Datos de cuenta actualizados.', { exact: true }).waitFor();
  await page.reload();
  assert.equal(await page.getByLabel('Ciudad', { exact: true }).inputValue(), 'Santiago');
  const passwords = page
    .getByRole('heading', { name: 'Cambiar contraseña', exact: true })
    .locator('..');
  await passwords.getByLabel('Contraseña actual', { exact: true }).fill('IncorrectPassword123');
  await passwords
    .getByLabel('Nueva contraseña (10 a 128 caracteres)', { exact: true })
    .fill('NewPassword123!');
  await passwords.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('NewPassword123!');
  await passwords.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await passwords.getByRole('alert').waitFor();
  assert.match(await passwords.getByRole('alert').innerText(), /actual no es correcta/);
  await passwords.getByLabel('Contraseña actual', { exact: true }).fill('FixturePassword123');
  await passwords
    .getByLabel('Nueva contraseña (10 a 128 caracteres)', { exact: true })
    .fill('NewPassword123!');
  await passwords
    .getByLabel('Confirmar nueva contraseña', { exact: true })
    .fill('DifferentPassword123!');
  await passwords.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await page.waitForTimeout(300);
  assert.match(await passwords.getByRole('alert').innerText(), /confirme/);
  await passwords.getByLabel('Contraseña actual', { exact: true }).fill('FixturePassword123');
  await passwords
    .getByLabel('Nueva contraseña (10 a 128 caracteres)', { exact: true })
    .fill('NewPassword123!');
  await passwords.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('NewPassword123!');
  await passwords.getByRole('button', { name: 'Guardar nueva contraseña' }).click();
  await passwords
    .getByText('Contraseña actualizada. Use la nueva contraseña en su próximo inicio de sesión.', {
      exact: true,
    })
    .waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login('client@example.test', 'NewPassword123!');
  await page.goto(base + '/account');
  await page
    .getByLabel('Nuevo correo electrónico', { exact: true })
    .fill('client-new@example.test');
  await page
    .getByLabel('Contraseña actual para cambiar el correo', { exact: true })
    .fill('NewPassword123!');
  await page.getByRole('button', { name: 'Solicitar cambio de correo', exact: true }).click();
  await page.getByText(/Cambio solicitado\. Revise el correo actual/).waitFor();
  await page.reload();
  assert.ok(await page.getByText(/Cambio pendiente: client-new@example.test/).isVisible());
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
  }
  await page.screenshot({ path: 'artifacts/ui/account-profile.png', fullPage: true });
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login('admin@example.test');
  await page.goto(base + '/users');
  const create = page
    .getByRole('heading', { name: 'Crear cuenta de usuario', exact: true })
    .locator('..');
  await create.getByLabel('Nombre completo', { exact: true }).fill('Cuenta con contacto');
  await create
    .getByLabel('Correo electrónico', { exact: true })
    .fill('created-contact@example.test');
  await create
    .getByLabel('Contraseña inicial (10 a 128 caracteres)', { exact: true })
    .fill('CreatedPassword123!');
  await create.getByLabel('Dirección', { exact: true }).fill('Dirección inicial');
  await create.getByLabel('Teléfono', { exact: true }).fill('+56 2 1234 5678');
  await create.getByLabel('Ciudad', { exact: true }).fill('Concepción');
  await create.getByLabel('País', { exact: true }).fill('Chile');
  await create.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await create.getByText(/Cuenta creada y habilitada/).waitFor();
  await page.reload();
  await page
    .getByRole('button', { name: 'Modificar cuenta: Cuenta con contacto', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Modificar cuenta', exact: true });
  assert.equal(await dialog.getByLabel('Ciudad', { exact: true }).inputValue(), 'Concepción');
  await dialog.getByLabel('Ciudad', { exact: true }).fill('Valdivia');
  await dialog.getByRole('button', { name: 'Modificar cuenta', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page
    .getByRole('button', { name: 'Modificar cuenta: Cuenta con contacto', exact: true })
    .click();
  assert.equal(await dialog.getByLabel('Ciudad', { exact: true }).inputValue(), 'Valdivia');
  await page.screenshot({ path: 'artifacts/ui/admin-account-contact.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    'Account UI passed: saved contact, current password verification, confirmation mismatch, password change and next login, pending email, administrative creation/edit and responsive layouts. Isolated Auth fixture; no real email delivery tested.',
  );
} catch (error) {
  await writeFile('artifacts/ui/account-profile-server.log', logs);
  await browser
    ?.contexts()[0]
    ?.pages()[0]
    ?.screenshot({ path: 'artifacts/ui/account-profile-failure.png', fullPage: true });
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
