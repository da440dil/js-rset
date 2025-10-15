import { setTimeout } from 'node:timers/promises';
import Redis from 'ioredis';
import { createClient } from 'redis';
import { IoClient, NodeClient } from './Scripter';
import { RSet } from './RSet';

const io = new Redis({ lazyConnect: true });
const node = createClient();

type Test<T> = {
	name: string; rset: RSet<T>;
	before: jest.Lifecycle; after: jest.Lifecycle; flushdb: jest.Lifecycle;
	zrange: (key: string) => Promise<string[]>;
};

const tests: [Test<IoClient>, Test<NodeClient>] = [
	{
		name: 'ioredis', rset: RSet.io(io, 2, 200),
		before: async () => {
			await io.connect();
			await io.flushdb();
			await io.script('FLUSH');
		},
		after: async () => {
			await io.script('FLUSH');
			await io.quit();
		},
		flushdb: async () => {
			await io.flushdb();
		},
		zrange: (key: string) => io.zrange(key, 0, -1)
	},
	{
		name: 'node-redis', rset: RSet.node(node, 2, 200),
		before: async () => {
			await node.connect();
			await node.flushDb();
			await node.scriptFlush();
		},
		after: async () => {
			await node.scriptFlush();
			await node.quit();
		},
		flushdb: async () => {
			await node.flushDb();
		},
		zrange: (key: string) => node.zRange(key, 0, -1)
	}
];

describe.each(tests)('', ({ name, rset, before, after, flushdb, zrange }) => {
	describe(name, () => {
		beforeAll(before);
		afterAll(after);

		describe('push', () => {
			afterAll(flushdb);

			it('should push', async () => {
				await expect(rset.push('k1', 'v1')).resolves.toBe(1);
				await expect(zrange('k1')).resolves.toEqual(['v1']);

				await expect(rset.push('k1', 'v2')).resolves.toBe(-0);
				await expect(zrange('k1')).resolves.toEqual(['v1', 'v2']);
			});

			it('should pop if limit exceeded', async () => {
				await expect(rset.push('k1', 'v3')).resolves.toBe(-1);
				await expect(zrange('k1')).resolves.toEqual(['v2', 'v3']);

				await setTimeout(100);

				await expect(rset.push('k1', 'v4')).resolves.toBe(-1);
				await expect(zrange('k1')).resolves.toEqual(['v3', 'v4']);
			});

			it('should remove expired', async () => {
				await setTimeout(100);

				await expect(rset.push('k1', 'v5')).resolves.toBe(-0);
				await expect(zrange('k1')).resolves.toEqual(['v4', 'v5']);
			});
		});

		describe('add', () => {
			afterAll(flushdb);

			it('should add if limit not reached', async () => {
				await expect(rset.add('k1', 'v1')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v1']);

				await setTimeout(100);

				await expect(rset.add('k1', 'v2')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v1', 'v2']);
			});

			it('should not add if limit reached', async () => {
				await expect(rset.add('k1', 'v3')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual(['v1', 'v2']);
			});

			it('should remove expired', async () => {
				await setTimeout(100);

				await expect(rset.add('k1', 'v3')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v2', 'v3']);

				await expect(rset.add('k1', 'v4')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual(['v2', 'v3']);

				await setTimeout(100);

				await expect(rset.add('k1', 'v4')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v3', 'v4']);
			});
		});

		describe('get', () => {
			afterAll(flushdb);

			it('should get values', async () => {
				await rset.add('k1', 'v1');
				await rset.add('k1', 'v2');

				await expect(rset.get('k1')).resolves.toEqual(['v1', 'v2']);
				await expect(rset.get('kx')).resolves.toEqual([]);
			});

			it('should remove expired', async () => {
				await setTimeout(200);

				await expect(rset.get('k1')).resolves.toEqual([]);
				await expect(zrange('k1')).resolves.toEqual([]);
			});
		});

		describe('replace', () => {
			afterAll(flushdb);

			it('should replace if value exists', async () => {
				await rset.add('k1', 'v1');

				await expect(rset.replace('k1', 'v1', 'v2')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v2']);
			});

			it('should not replace if value not exist', async () => {
				await expect(rset.replace('k1', 'vx', 'vy')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual(['v2']);
			});

			it('should remove expired', async () => {
				await setTimeout(200);

				await expect(rset.replace('k1', 'v2', 'v3')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual([]);
			});
		});

		describe('deladd', () => {
			afterAll(flushdb);

			it('should delete key and add value', async () => {
				await rset.add('k1', 'v1');
				await rset.add('k1', 'v2');

				await rset.deladd('k1', 'v3');
				await expect(zrange('k1')).resolves.toEqual(['v3']);
			});
		});

		describe('rem', () => {
			afterAll(flushdb);

			it('should remove if value exists', async () => {
				await rset.add('k1', 'v1');
				await rset.add('k1', 'v2');

				await expect(rset.rem('k1', 'v1')).resolves.toBe(true);
				await expect(zrange('k1')).resolves.toEqual(['v2']);
			});

			it('should not remove if value not exist', async () => {
				await expect(rset.rem('k1', 'vx')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual(['v2']);
			});

			it('should remove expired', async () => {
				await setTimeout(200);

				await expect(rset.rem('k1', 'v2')).resolves.toBe(false);
				await expect(zrange('k1')).resolves.toEqual([]);
			});
		});
	});
});
