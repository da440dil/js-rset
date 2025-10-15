import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from './Script';
import { Scripter, IoClient, IoScripter, NodeClient, NodeScripter } from './Scripter';

const push = new Script(readFileSync(resolve(__dirname, '../lua/push.lua')).toString());
const add = new Script(readFileSync(resolve(__dirname, '../lua/add.lua')).toString());
const get = new Script(readFileSync(resolve(__dirname, '../lua/get.lua')).toString());
const replace = new Script(readFileSync(resolve(__dirname, '../lua/replace.lua')).toString());
const deladd = new Script(readFileSync(resolve(__dirname, '../lua/deladd.lua')).toString());
const rem = new Script(readFileSync(resolve(__dirname, '../lua/rem.lua')).toString());

export class RSet<T> {
	/**
	 * Creates `RSet` to use with [ioredis](https://github.com/redis/ioredis) client.
	 * @param client Minimal [ioredis](https://github.com/redis/ioredis) client.
	 * @param limit Size limit.
	 * @param ttl TTL of a value in milliseconds.
	 */
	public static io(client: IoClient, limit: number, ttl: number): RSet<IoClient> {
		return new RSet(client, IoScripter, limit, ttl);
	}
	/**
	 * Creates `RSet` to use with [node-redis](https://github.com/redis/node-redis) client.
	 * @param client Minimal [node-redis](https://github.com/redis/node-redis) client.
	 * @param limit Size limit.
	 * @param ttl TTL of a value in milliseconds.
	 */
	public static node(client: NodeClient, limit: number, ttl: number): RSet<NodeClient> {
		return new RSet(client, NodeScripter, limit, ttl);
	}

	private c: T;
	private s: Scripter<T>;
	private limit: number;
	private ttl: number;

	constructor(client: T, scripter: Scripter<T>, limit: number, ttl: number) {
		this.c = client;
		this.s = scripter;
		this.limit = limit;
		this.ttl = ttl * 1000;
	}

	/**
	 * Adds value. Returns difference between size limit and actual size after add.
	 * Removes oldest value if limit exceeded.
	 */
	public async push(key: string, value: string): Promise<number> {
		const v = await push.run(this.c, this.s, [key], value, this.ttl, this.limit);
		return -(v as number);
	}

	/** Adds value if limit not reached. Returns `true` if succeeded. */
	public async add(key: string, value: string): Promise<boolean> {
		const v = await add.run(this.c, this.s, [key], value, this.ttl, this.limit);
		return v === 1;
	}

	/** Gets values. */
	public get(key: string): Promise<string[]> {
		return get.run(this.c, this.s, [key], this.ttl) as Promise<string[]>;
	}

	/** Replaces old value with new value. Returns `true` if succeeded. */
	public async replace(key: string, oldValue: string, newValue: string): Promise<boolean> {
		const v = await replace.run(this.c, this.s, [key], oldValue, newValue, this.ttl);
		return v === 1;
	}

	/** Removes key and adds single value. */
	public async deladd(key: string, value: string): Promise<void> {
		await deladd.run(this.c, this.s, [key], value);
	}

	/** Removes value. Returns `true` if succeeded. */
	public async rem(key: string, value: string): Promise<boolean> {
		const v = await rem.run(this.c, this.s, [key], value, this.ttl);
		return v !== 0;
	}
}
