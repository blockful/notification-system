const { spawnSync } = require('node:child_process');

function hasRuntime(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'ignore',
  });

  return result.status === 0;
}

const runtimeAvailable =
  hasRuntime('docker', ['info']) ||
  hasRuntime('podman', ['info']);

if (!runtimeAvailable) {
  console.log('[integrated-tests] Skipping integration tests: no Docker/Podman runtime available for Testcontainers.');
  process.exit(0);
}

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(process.execPath, [jestBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
