import { createHash } from 'node:crypto';
import { Scripter } from './Scripter';

export class Script<T> {
	private lua: string;
	private sha1: string;

	constructor(lua: string) {
		this.lua = lua;
		this.sha1 = createHash('sha1').update(lua).digest('hex');
	}

	/**
	 * Run optimistically uses [EVALSHA](https://redis.io/commands/evalsha) to run the script.
	 * If script does not exist it is retried using [EVAL](https://redis.io/commands/eval).
	 */
	public async run(client: T, s: Scripter<T>, keys: string[], ...args: (string | number)[]): Promise<unknown> {
		try {
			return await s.evalsha(client, this.sha1, keys, ...args);
		} catch (err) {
			if (err instanceof Error && err.message.startsWith('NOSCRIPT')) {
				return s.eval(client, this.lua, keys, ...args);
			}
			throw err;
		}
	}
}
