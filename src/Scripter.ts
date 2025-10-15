/** Common scripting interface. */
export interface Scripter<T> {
	eval(client: T, lua: string, keys: string[], ...args: (string | number)[]): Promise<unknown>;
	evalsha(client: T, sha1: string, keys: string[], ...args: (string | number)[]): Promise<unknown>;
}

/** Minimal [ioredis](https://github.com/redis/ioredis) client. */
export interface IoClient {
	eval(...args: [lua: string, numkeys: number, args: string[]]): Promise<unknown>;
	evalsha(...args: [sha1: string, numkeys: number, args: string[]]): Promise<unknown>;
}

export const IoScripter: Scripter<IoClient> = {
	eval(client: IoClient, lua: string, keys: string[], ...args: (string | number)[]): Promise<unknown> {
		return client.eval(lua, keys.length, [...keys, ...args.map(String)]);
	},
	evalsha(client: IoClient, sha1: string, keys: string[], ...args: (string | number)[]): Promise<unknown> {
		return client.evalsha(sha1, keys.length, [...keys, ...args.map(String)]);
	}
};

/** Minimal [node-redis](https://github.com/redis/node-redis) client. */
export interface NodeClient {
	eval(lua: string, options?: { keys?: string[]; arguments?: string[]; }): Promise<unknown>;
	evalSha(sha1: string, options?: { keys?: string[]; arguments?: string[]; }): Promise<unknown>;
}

export const NodeScripter: Scripter<NodeClient> = {
	eval(client: NodeClient, lua: string, keys: string[], ...args: (string | number)[]): Promise<unknown> {
		return client.eval(lua, { keys, arguments: args.map(String) });
	},
	evalsha(client: NodeClient, sha1: string, keys: string[], ...args: (string | number)[]): Promise<unknown> {
		return client.evalSha(sha1, { keys, arguments: args.map(String) });
	}
};
