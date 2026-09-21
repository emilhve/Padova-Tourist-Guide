import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const root = process.cwd();
const server = spawn(process.execPath, [resolve(root, 'scripts/serve-dist.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) throw new Error('Test server exited before it was ready.');

    try {
      const response = await fetch('http://127.0.0.1:4321');
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await delay(100);
  }

  throw new Error('Timed out waiting for the test server.');
}

async function stopServer() {
  if (server.exitCode !== null) return;

  server.kill();
  await Promise.race([
    once(server, 'exit'),
    delay(2_000).then(() => {
      if (server.exitCode === null) server.kill('SIGKILL');
    }),
  ]);
}

try {
  await waitForServer();

  const playwright = spawn(
    process.execPath,
    [resolve(root, 'node_modules/@playwright/test/cli.js'), 'test'],
    { cwd: root, stdio: 'inherit' },
  );

  const [exitCode] = await once(playwright, 'exit');
  process.exitCode = typeof exitCode === 'number' ? exitCode : 1;
} finally {
  await stopServer();
}
