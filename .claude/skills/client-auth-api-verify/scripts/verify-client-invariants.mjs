import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = fs.existsSync(path.join(process.cwd(), 'package.json'))
  ? process.cwd()
  : path.resolve(scriptDir, '../../../..');

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function walkFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// 1. Check for known server-only markers in source, tests, and public entry files.
const forbiddenTokens = [
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NAVER_CLIENT_SECRET',
  'sb_secret_',
];
const scanTargets = [
  ...walkFiles(path.join(root, 'src')),
  ...walkFiles(path.join(root, 'tests')),
  path.join(root, 'index.html'),
  path.join(root, '.env.example'),
];
for (const file of scanTargets) {
  const text = fs.readFileSync(file, 'utf8');
  for (const token of forbiddenTokens) {
    check(!text.includes(token), `Forbidden server secret token "${token}" found in ${path.relative(root, file)}`);
  }
}

// 2. .env.example VITE_API_BASE_URL must not end with /api
const envExample = read('.env.example');
const apiBaseLine = envExample.split(/\r?\n/).find((line) => line.startsWith('VITE_API_BASE_URL='));
check(Boolean(apiBaseLine), '.env.example must define VITE_API_BASE_URL');
if (apiBaseLine) {
  check(!/\/api\/?$/.test(apiBaseLine.trim()), '.env.example VITE_API_BASE_URL must not end with /api');
}

// 3. Supabase browser PKCE config
const supabaseTs = read('src/config/supabase.ts');
check(supabaseTs.includes("flowType: 'pkce'") || supabaseTs.includes('flowType: "pkce"'),
  'src/config/supabase.ts must keep flowType: pkce');
check(supabaseTs.includes("window.location.pathname !== '/auth/callback'"),
  'src/config/supabase.ts must disable detectSessionInUrl on /auth/callback');

// 4. App.tsx callback before HashRouter + provider nesting + vercel.json rewrite
const appTsx = read('src/App.tsx');
const callbackIdx = appTsx.indexOf("window.location.pathname === '/auth/callback'");
const routerIdx = appTsx.indexOf('<HashRouter>');
check(callbackIdx !== -1 && routerIdx !== -1 && callbackIdx < routerIdx,
  'src/App.tsx must handle /auth/callback before mounting HashRouter');
const queryIdx = appTsx.indexOf('<QueryClientProvider');
const authIdx = appTsx.indexOf('<AuthProvider>');
check(queryIdx !== -1 && authIdx !== -1 && queryIdx < authIdx,
  'src/App.tsx must place QueryClientProvider outside AuthProvider');
const { rewrites } = JSON.parse(read('vercel.json'));
check(Array.isArray(rewrites) && rewrites.some((rewrite) =>
  rewrite?.source === '/(.*)' && rewrite.destination === '/index.html'),
  'vercel.json must keep the catch-all SPA rewrite to /index.html');

// 5. AuthCallbackHandler single-use ref guard
const callbackTsx = read('src/components/AuthCallbackHandler.tsx');
check(callbackTsx.includes('useRef'), 'AuthCallbackHandler.tsx must keep useRef guard against duplicate PKCE exchanges');

// 6. http.ts Bearer injection & withCredentials: false
const httpTs = read('src/services/http.ts');
check(httpTs.includes('withCredentials: false'), 'src/services/http.ts must keep withCredentials: false');
check(httpTs.includes('Bearer ${data.session.access_token}'),
  'src/services/http.ts must attach Bearer access_token on authApi');

// 7. Check direct publicApi write-method references, including in new service modules.
for (const file of walkFiles(path.join(root, 'src/services'))) {
  if (!file.endsWith('.ts')) continue;
  const source = fs.readFileSync(file, 'utf8');
  check(!/\bpublicApi\s*\.\s*(post|put|patch|delete)\b/.test(source),
    `${path.relative(root, file)} must not use write HTTP methods via publicApi`);
}

if (failures.length > 0) {
  console.error('Client auth/API invariant check FAILED:');
  for (const item of failures) console.error(` - ${item}`);
  process.exit(1);
}

console.log('Client auth/API static checks PASSED (7 check groups).');
