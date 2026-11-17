// Points both apps at the local backend: writes apps/mobile/.env.local and apps/admin/.env.local.
// The parishioner app uses this computer's Wi-Fi address, so a phone on the same Wi-Fi can reach it; run
// this again if that address changes.   npm run backend:env
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf8' })) as Record<string, string>;
const port = new URL(status.API_URL).port;

const lan = Object.entries(networkInterfaces())
  .filter(([name]) => !/vEthernet|WSL|Docker|VirtualBox|VMware|Loopback/i.test(name))
  .flatMap(([, addresses]) => addresses ?? [])
  .find((a) => a.family === 'IPv4' && !a.internal)?.address;

const file = (url: string) =>
  `# Written by npm run backend:env for the local backend. Not committed.\nEXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${status.PUBLISHABLE_KEY}\n`;

const root = join(__dirname, '..');
writeFileSync(join(root, 'apps/mobile/.env.local'), file(`http://${lan ?? '127.0.0.1'}:${port}`));
writeFileSync(join(root, 'apps/admin/.env.local'), file(status.API_URL));
console.log(`Parishioner app → http://${lan ?? '127.0.0.1'}:${port}${lan ? '' : ' (no Wi-Fi address found; phones cannot reach it)'}`);
console.log(`Office app → ${status.API_URL}`);
