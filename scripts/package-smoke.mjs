import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directory = await mkdtemp(path.join(tmpdir(), 'opject-smoke-'));
process.env.OPJECT_SERVER_BASE_PATH = directory;
const require = createRequire(import.meta.url);
const format = process.argv[2];
const Client = format === 'cjs' ? require('@plurid/opject-client') : (await import('@plurid/opject-client')).default;
const Server = format === 'cjs' ? require('@plurid/opject-server') : (await import('@plurid/opject-server')).default;
assert.equal(typeof Client, 'function');
assert.equal(typeof Server, 'function');
const server = new Server({ verifyToken: async (token) => token === 'test', options: { quiet: true } });
const listener = server.start(0);
await once(listener, 'listening');

try {
    const client = new Client({ url: `http://127.0.0.1:${listener.address().port}`, token: 'test' });
    const source = "class Example { read() { return require('node:path').basename('/a/b'); } }";
    assert.equal(await client.register('test', source, []), true);
    assert.equal((await client.require('test')).read(), 'b');
    assert.equal(await client.remove('test'), true);

    // Exercise dependency installation and resolution in the consumer directory,
    // including a path with spaces that must remain a single command argument.
    const dependency = path.join(directory, 'dependency fixture');
    await mkdir(dependency);
    await writeFile(path.join(dependency, 'package.json'), JSON.stringify({ name: 'opject-smoke-dependency', version: '1.0.0', main: 'index.cjs' }));
    await writeFile(path.join(dependency, 'index.cjs'), 'module.exports = 12;');
    await writeFile('.npmrc', 'audit=false\nfund=false\n');
    assert.equal(await client.register('dependency', "class Example { read() { return require('opject-smoke-dependency'); } }", [`file:${dependency}`]), true);
    assert.equal((await client.require('dependency', { useCache: true })).read(), 12);
    assert.equal(await client.remove('dependency'), true);
    console.log(`${format.toUpperCase()} installed package round trip passed.`);
} finally {
    const closed = once(listener, 'close');
    server.stop();
    await closed;
    await rm(directory, { recursive: true, force: true });
}
