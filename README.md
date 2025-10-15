# @da440dil/rset

[![CI](https://github.com/da440dil/js-rset/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/da440dil/js-rset/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/da440dil/js-rset/badge.svg?branch=main)](https://coveralls.io/github/da440dil/js-rset?branch=main)

Redis sorted set with size limit within time frame.

Supports [ioredis](https://github.com/redis/ioredis) and [node-redis](https://github.com/redis/node-redis).

[Example](./examples/push.ts) `push` usage with [ioredis](https://github.com/redis/ioredis):
```typescript
import { setTimeout } from 'node:timers/promises';
import Redis from 'ioredis';
import { RSet } from '@da440dil/rset';

const client = new Redis();
// Create RSet with size limit of 3 values per key and value TTL of 500ms.
const rset = RSet.io(client, 3, 500);

async function main() {
	const user = '42';
	// Push token, pop if limit exceeded.
	for (let i = 0; i < 4; i++) {
		const v = `1${i}`;
		console.log(`PUSH: ${v} => ${await rset.push(user, v)}`);
		await setTimeout(100);
	}
	console.log(`GET: [${await rset.get(user)}]`);

	// Replace token if exists.
	for (let i = 0; i < 3; i++) {
		const [v1, v2] = [`1${i}`, `2${i}`];
		console.log(`REPLACE: ${v1} -> ${v2} => ${await rset.replace(user, v1, v2)}`);
		await setTimeout(100);
	}
	console.log(`GET: [${await rset.get(user)}]`);

	await setTimeout(100);
	console.log('TIMEOUT');
	console.log(`REPLACE: 13 -> 23 => ${await rset.replace(user, '13', '23')}`);
	console.log(`GET: [${await rset.get(user)}]`);
	console.log(`PUSH: 21 => ${await rset.push(user, '21')}`);
	console.log(`GET: [${await rset.get(user)}]`);
	// Output:
	// PUSH: 10 => 2
	// PUSH: 11 => 1
	// PUSH: 12 => 0
	// PUSH: 13 => -1
	// GET: [11,12,13]
	// REPLACE: 10 -> 20 => false
	// REPLACE: 11 -> 21 => true
	// REPLACE: 12 -> 22 => true
	// GET: [13,21,22]
	// TIMEOUT
	// REPLACE: 13 -> 23 => false
	// GET: [21,22]
	// PUSH: 21 => 1
	// GET: [22,21]
	await client.quit();
}

main().catch(console.error);
```

```
npm run file examples/push.ts
```

[Example](./examples/add.ts) `add` usage with [node-redis](https://github.com/redis/node-redis):
```typescript
import { setTimeout } from 'node:timers/promises';
import { createClient } from 'redis';
import { RSet } from '@da440dil/rset';

const client = createClient();
// Create RSet with size limit of 3 values per key and value TTL of 500ms.
const rset = RSet.node(client, 3, 500);

async function main() {
	await client.connect();
	const user = '42';
	// Add token if limit not reached.
	for (let i = 0; i < 4; i++) {
		const v = `1${i}`;
		console.log(`ADD: ${v} => ${await rset.add(user, v)}`);
		await setTimeout(100);
	}
	console.log(`GET: [${await rset.get(user)}]`);

	// Replace token if exists.
	for (let i = 0; i < 2; i++) {
		const [v1, v2] = [`1${i}`, `2${i}`];
		console.log(`REPLACE: ${v1} -> ${v2} => ${await rset.replace(user, v1, v2)}`);
		await setTimeout(100);
	}
	console.log(`REPLACE: 13 -> 23 => ${await rset.replace(user, '13', '23')}`);
	console.log(`GET: [${await rset.get(user)}]`);

	await setTimeout(100);
	console.log('TIMEOUT');
	console.log(`REPLACE: 12 -> 22 => ${await rset.replace(user, '12', '22')}`);
	console.log(`GET: [${await rset.get(user)}]`);
	console.log(`ADD: 20 => ${await rset.add(user, '20')}`);
	console.log(`GET: [${await rset.get(user)}]`);
	// Output:
	// ADD: 10 => true
	// ADD: 11 => true
	// ADD: 12 => true
	// ADD: 13 => false
	// GET: [10,11,12]
	// REPLACE: 10 -> 20 => true
	// REPLACE: 11 -> 21 => true
	// REPLACE: 13 -> 23 => false
	// GET: [12,20,21]
	// TIMEOUT
	// REPLACE: 12 -> 22 => false
	// GET: [20,21]
	// ADD: 20 => true
	// GET: [21,20]
	await client.quit();
}

main().catch(console.error);
```

```
npm run file examples/add.ts
```
