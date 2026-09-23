import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import spawn from 'cross-spawn';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(path.join(tmpdir(), 'opject-packages-'));
const npm = 'npm';

function run(command, args, cwd = directory) {
    const result = spawn.sync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        process.stderr.write(result.stdout ?? '');
        throw new Error(`${command} ${args.join(' ')} failed (${result.status})`);
    }
    return result.stdout;
}

try {
    const archives = [];
    for (const name of ['client', 'server']) {
        const folder = path.join(root, `packages/javascript/opject-${name}`);
        const [packed] = JSON.parse(run(npm, ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], folder));
        assert(packed.files.every(({ path }) => !path.includes('__tests__') && !path.startsWith('source/')));
        for (const file of ['index.mjs', 'index.cjs', 'index.d.mts', 'index.d.cts']) {
            assert(packed.files.some(({ path }) => path === `distribution/${file}`), `Missing ${name}/${file}`);
        }
        archives.push(path.join(directory, packed.filename));
    }
    await writeFile(path.join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    // Install the actual tarballs outside the workspace: undeclared runtime
    // dependencies cannot be accidentally supplied by development dependencies.
    run(npm, ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', path.join(root, '.cache/npm'), ...archives]);

    const smoke = await readFile(new URL('./package-smoke.mjs', import.meta.url), 'utf8');
    await writeFile(path.join(directory, 'smoke.mjs'), smoke);
    for (const format of ['esm', 'cjs']) {
        process.stdout.write(run(process.execPath, ['smoke.mjs', format]));
    }

    await writeFile(path.join(directory, 'types.mts'), `
import Client, { type OpjectClientOptions } from '@plurid/opject-client';
import Server, { type OpjectServerConfiguration } from '@plurid/opject-server';
const options: OpjectClientOptions = { url: 'http://localhost', token: 'test' };
const configuration: OpjectServerConfiguration = { verifyToken: async () => true };
new Client(options);
new Server(configuration).instance().get('/test', (_request, response) => response.end());
`);
    await writeFile(path.join(directory, 'types.cts'), `
import Client = require('@plurid/opject-client');
import Server = require('@plurid/opject-server');
import type { OpjectClientOptions } from '@plurid/opject-client';
import type { OpjectServerConfiguration } from '@plurid/opject-server';
const options: OpjectClientOptions = { url: 'http://localhost', token: 'test' };
const configuration: OpjectServerConfiguration = { verifyToken: async () => true };
new Client(options);
new Server(configuration);
`);
    await writeFile(path.join(directory, 'tsconfig.json'), JSON.stringify({
        compilerOptions: {
            strict: true, noEmit: true, target: 'ES2023', module: 'NodeNext',
            moduleResolution: 'NodeNext', esModuleInterop: true,
        },
        include: ['types.mts', 'types.cts'],
    }));
    process.stdout.write(run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']));
    console.log('Packed ESM/CommonJS packages, runtime dependencies, and consumer types passed.');
} finally {
    await rm(directory, { recursive: true, force: true });
}
