import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import Client from '../packages/javascript/opject-client/source/index';
import type OpjectServer from '../packages/javascript/opject-server/source/index';

const token = 'opject-tests';
const source = 'class Example { read() { return 12; } }';

describe('client/server protocol', () => {
    let directory: string;
    let server: Server;
    let opject: OpjectServer;
    let url: string;
    let client: Client;
    const originalPath = process.env.OPJECT_SERVER_BASE_PATH;

    beforeAll(async () => {
        directory = await mkdtemp(path.join(tmpdir(), 'opject-test-'));
        process.env.OPJECT_SERVER_BASE_PATH = directory;
        const { default: Server } = await import('../packages/javascript/opject-server/source/index');
        opject = new Server({
            verifyToken: async (value) => value === token,
            options: { quiet: true },
        });
        server = opject.start(0);
        await once(server, 'listening');
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        client = new Client({ url, token });
    });

    afterAll(async () => {
        if (server) {
            const closed = once(server, 'close');
            opject.stop();
            await closed;
        }
        if (directory) await rm(directory, { recursive: true, force: true });
        if (originalPath === undefined) delete process.env.OPJECT_SERVER_BASE_PATH;
        else process.env.OPJECT_SERVER_BASE_PATH = originalPath;
    });

    const post = (route: string, body: unknown, auth: string | undefined = token) => fetch(url + route, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        },
        body: JSON.stringify(body),
    });

    it('registers, checks, instantiates and removes an object on a fresh filesystem', async () => {
        expect(await client.register('round-trip', source)).toBe(true);
        expect(await readFile(path.join(directory, 'objects/round-trip'), 'utf8')).toBe(source + '\n');
        expect((await client.require('round-trip')).read()).toBe(12);
        expect(await client.remove('round-trip')).toBe(true);
        await expect(client.require('round-trip')).rejects.toThrow('404');
    });

    it('runs a trusted object in a VM with caller-supplied context', async () => {
        await client.register('vm', 'class Example { read() { return input + 1; } }');
        expect(await client.require('vm', {
            useVM: true,
            vmContext: { input: 11 },
            vmInstantiation: '\nnew Example().read()',
        })).toBe(12);
    });

    it('restores serialized state', async () => {
        await client.register('state', 'class Example { loadSereal(value) { this.value = value; } }');
        expect((await client.require('state', { serealState: { count: 4 } })).value).toEqual({ count: 4 });
    });

    it('resolves Node dependencies inside a downloaded object', async () => {
        await client.register('dependency', "class Example { read() { return require('node:path').basename('/a/b'); } }");
        expect((await client.require('dependency')).read()).toBe('b');
    });

    it('rejects missing and invalid credentials', async () => {
        expect((await post('/register', { id: 'unauthorized', data: source }, '')).status).toBe(401);
        expect((await post('/register', { id: 'forbidden', data: source }, 'wrong')).status).toBe(403);
        await expect(new Client({ url, token: 'wrong' }).register('forbidden', source)).rejects.toThrow('403');
    });

    it('accepts legacy tokens in the request body', async () => {
        expect(await (await post('/register', { id: 'body-token', data: source, token }, '')).json()).toEqual({ registered: true });
    });

    it('rejects incomplete requests and invalid hashes', async () => {
        expect((await post('/register', { id: 'incomplete' })).status).toBe(400);
        await client.register('hash', source);
        expect(await (await post('/check', { id: 'hash', sha: 'invalid' })).json()).toEqual({ checked: false });
        const sha = createHash('sha256').update(source + '\n').digest('hex');
        expect(await (await post('/check', { id: 'hash', sha })).json()).toEqual({ checked: true });
    });

    it('replaces cached code if the server has changed it', async () => {
        await client.register('cache', source);
        await post('/register', { id: 'cache', data: 'class Replacement {}' });
        expect((await client.require('cache', { useCache: true })).constructor.name).toBe('Replacement');
    });

    it('caches required objects, not only registered ones', async () => {
        await client.register('require-cache', source);
        const reader = new Client({ url, token });
        await reader.require('require-cache', { useCache: true, skipCheck: true });
        await post('/remove', { id: 'require-cache' });
        expect((await reader.require('require-cache', { useCache: true, skipCheck: true })).read()).toBe(12);
    });

    it('keeps filesystem storage inside its directories', async () => {
        expect(await (await post('/register', { id: '../escaped', data: source })).json()).toEqual({ registered: false });
        await expect(readFile(path.join(directory, 'escaped'))).rejects.toMatchObject({ code: 'ENOENT' });
        expect((await post('/require', { id: '../../package.json' })).status).toBe(404);
        expect(await (await post('/remove', { id: '../objects' })).json()).toEqual({ removed: false });
    });

    it('supports nested object IDs', async () => {
        expect(await client.register('scope/nested', source)).toBe(true);
        expect((await client.require('scope/nested')).read()).toBe(12);
        expect(await client.remove('scope/nested')).toBe(true);
    });

    it('reports removal of a missing object without failing', async () => {
        expect(await client.remove('never-registered')).toBe(false);
    });

    it('handles bodiless requests and content types with parameters', async () => {
        const bodiless = await fetch(url + '/require', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        expect(bodiless.status).toBe(400);
        await client.register('charset', source);
        const response = await fetch(url + '/require', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: 'charset' }),
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ object: source + '\n' });
    });

    it('persists dependency metadata and clears it when replaced', async () => {
        await client.register('metadata', source, ['some-package@1.0.0']);
        expect(await (await post('/require', { id: 'metadata' })).json()).toMatchObject({ dependencies: ['some-package@1.0.0'] });
        await client.register('metadata', source);
        expect(await (await post('/require', { id: 'metadata' })).json()).toMatchObject({ dependencies: [] });
        expect(await client.remove('metadata')).toBe(true);
        await expect(readFile(path.join(directory, 'metadata/metadata'))).rejects.toMatchObject({ code: 'ENOENT' });
    });

    it('allows custom storage callbacks without creating signal handlers', async () => {
        const { default: Server } = await import('../packages/javascript/opject-server/source/index');
        const signals = process.listenerCount('SIGINT');
        const objects = new Map<string, string>();
        const custom = new Server({
            verifyToken: async (value) => value === token,
            getObject: async (id) => objects.get(id),
            getMetadata: async () => undefined,
            registerObject: async (id, data) => { objects.set(id, data); return true; },
            registerMetadata: async () => true,
            removeObject: async (id) => objects.delete(id),
            options: { quiet: true },
        });
        expect(process.listenerCount('SIGINT')).toBe(signals);
        const listener = custom.start(0);
        await once(listener, 'listening');
        try {
            const customClient = new Client({ url: `http://127.0.0.1:${(listener.address() as AddressInfo).port}`, token });
            expect(await customClient.register('custom', source)).toBe(true);
            expect((await customClient.require('custom')).read()).toBe(12);
            expect(await customClient.remove('custom')).toBe(true);
        } finally {
            const closed = once(listener, 'close');
            custom.stop();
            await closed;
        }
    });
});
