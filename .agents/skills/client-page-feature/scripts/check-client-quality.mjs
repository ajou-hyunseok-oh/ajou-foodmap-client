import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checks = new Map([
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['test', ['test']],
  ['build', ['run', 'build']],
]);
const requested = process.argv.slice(2);
const usage = 'Usage: node check-client-quality.mjs <typecheck | lint | test | build> [...]';

if (requested.length === 1 && requested[0] === '--help') {
  console.log(usage);
  process.exit(0);
}
if (requested.length === 0 || requested.some((name) => !checks.has(name))) {
  console.error(usage);
  process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = fs.existsSync(path.join(process.cwd(), 'package.json'))
  ? process.cwd()
  : path.resolve(scriptDir, '../../../..');

if (!fs.existsSync(path.join(root, 'node_modules'))) {
  console.error('Missing node_modules in repository root. Run `npm ci` (or `npm install`) before running quality checks.');
  process.exit(1);
}

const selected = new Set(requested);
if (selected.has('build')) selected.delete('typecheck');
const isWindows = process.platform === 'win32';

for (const name of selected) {
  const args = checks.get(name);
  console.log(`\n> npm ${args.join(' ')}`);
  const command = isWindows ? 'cmd.exe' : 'npm';
  const commandArgs = isWindows ? ['/d', '/c', 'npm.cmd', ...args] : args;
  const res = spawnSync(command, commandArgs, { cwd: root, stdio: 'inherit' });
  if (res.error) {
    console.error(`Could not run npm ${args.join(' ')}: ${res.error.message}`);
    process.exit(1);
  }
  if (res.status !== 0) {
    console.error(`Step failed: npm ${args.join(' ')} (exit ${res.status ?? 1})`);
    process.exit(res.status ?? 1);
  }
}

console.log(`\nSelected client checks PASSED (${[...selected].join(', ')}).`);
