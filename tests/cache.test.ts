import { afterEach, describe, expect, it, vi } from 'vitest';
import Cacher from '../packages/javascript/opject-client/source/objects/Cacher/index';
import { resolveCaching } from '../packages/javascript/opject-client/source/utilities/caching/index';

afterEach(() => vi.useRealTimers());

describe('object cache', () => {
    it('retains dependencies and expires at the configured time in seconds', () => {
        vi.useFakeTimers();
        const cache = new Cacher();
        cache.set('test', 'class Example {}', 2, ['dependency']);
        expect(cache.get('test')).toEqual({ object: 'class Example {}', dependencies: ['dependency'] });
        vi.advanceTimersByTime(2000);
        expect(cache.get('test')).toBeUndefined();
    });

    it('can disable caching explicitly', () => {
        expect(resolveCaching(0)).toBe(0);
        expect(resolveCaching('none')).toBe(0);
        expect(resolveCaching()).toBe(86400);
        expect(resolveCaching('default')).toBe(86400);
        const cache = new Cacher();
        cache.set('test', 'source', 0);
        expect(cache.get('test')).toBeUndefined();
    });

    it('supports invalidation and reset', () => {
        const cache = new Cacher();
        cache.set('first', 'source', 60);
        cache.set('second', 'source', 60);
        cache.unset('first');
        expect(cache.get('first')).toBeUndefined();
        expect(cache.get('second')).toBeDefined();
        cache.reset();
        expect(cache.get('second')).toBeUndefined();
    });
});
