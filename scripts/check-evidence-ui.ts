import { checkEvidenceFlow } from './evidence-ui-flow';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startFixture } from './ui-fixture';
const fixture = await startFixture();
const base = 'http://127.0.0.1:3015';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3015'],
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
server.stdout.on('data', (chunk) => {
  logs += chunk;
});
server.stderr.on('data', (chunk) => {
  logs += chunk;
});
await mkdir('artifacts/ui', { recursive: true });
async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
    } catch {
      /* Server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server unavailable\n${logs}`);
}
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await waitReady();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors: string[] = [];
  const results: unknown[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill('a@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await checkEvidenceFlow(page, base, fixture, results);
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/ui/evidence-results.json',
    JSON.stringify(
      {
        backend: 'Isolated PostgreSQL and file fixture; not live Supabase Auth/Storage',
        checks: results,
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Phase 5 browser workflow passed.');
} catch (error) {
  await writeFile('artifacts/ui/server.log', logs);
  if (browser) {
    const pages = browser.contexts().flatMap((c) => c.pages());
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `artifacts/ui/failure-${i}.png`, fullPage: true });
      await writeFile(`artifacts/ui/failure-${i}.txt`, await pages[i].locator('body').innerText());
    }
  }
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
