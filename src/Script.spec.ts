import Redis from 'ioredis';
import { createClient } from 'redis';
import { Script } from './Script';
import { Scripter, IoClient, IoScripter, NodeClient, NodeScripter } from './Scripter';

const io = new Redis({ lazyConnect: true });
const node = createClient();

type Test<T> = {
	name: string; client: T; scripter: Scripter<T>;
	before: jest.Lifecycle; after: jest.Lifecycle; flushdb: jest.Lifecycle;
	load: (lua: string) => Promise<void>;
};

const tests: [Test<IoClient>, Test<NodeClient>] = [
	{
		name: 'ioredis', client: io, scripter: IoScripter,
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
		load: async (lua) => {
			await io.script('LOAD', lua);
		}
	},
	{
		name: 'node-redis', client: node, scripter: NodeScripter,
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
		load: async (lua) => {
			await node.scriptLoad(lua);
		}
	}
];

describe.each(tests)('', ({ name, client, scripter, before, after, flushdb, load }) => {
	describe(name, () => {
		beforeAll(before);
		afterAll(after);
		afterEach(flushdb);

		it('should run script with ([key], [arg])', async () => {
			const lua = 'return redis.call("incrby", KEYS[1], ARGV[1])';
			const script = new Script(lua);

			await expect(script.run(client, scripter, ['k1'], 2)).resolves.toBe(2);
			await expect(script.run(client, scripter, ['k1'], 3)).resolves.toBe(5);
		});

		it('should run script with ([key], [arg, arg])', async () => {
			const lua = 'return redis.call("incrby", KEYS[1], ARGV[1]) + redis.call("incrby", KEYS[1], ARGV[2])';
			const script = new Script(lua);

			await expect(script.run(client, scripter, ['k1'], 2, 3)).resolves.toBe(7);
			await expect(script.run(client, scripter, ['k1'], 4, 5)).resolves.toBe(23);
		});

		it('should run script with ([key, key], [arg])', async () => {
			const lua = 'return redis.call("incrby", KEYS[1], ARGV[1]) + redis.call("incrby", KEYS[2], ARGV[1])';
			const script = new Script(lua);

			await expect(script.run(client, scripter, ['k1', 'k2'], 2)).resolves.toBe(4);
			await expect(script.run(client, scripter, ['k1', 'k2'], 3)).resolves.toBe(10);
		});

		it('should run script with ([key, key], [arg, arg])', async () => {
			const lua = 'return redis.call("incrby", KEYS[1], ARGV[1]) + redis.call("incrby", KEYS[2], ARGV[2])';
			const script = new Script(lua);

			await expect(script.run(client, scripter, ['k1', 'k2'], 2, 3)).resolves.toBe(5);
			await expect(script.run(client, scripter, ['k1', 'k2'], 4, 5)).resolves.toBe(14);
		});

		it('should throw with broken script', async () => {
			const lua = 'if 1 > ARGV[1] then return 1 end return 0';
			await load(lua);
			const script = new Script(lua);
			await expect(() => script.run(client, scripter, [], 1)).rejects.toThrow();
		});
	});
});
