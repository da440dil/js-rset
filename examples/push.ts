import { setTimeout } from 'node:timers/promises';
import Redis from 'ioredis';
import { RSet } from '../src';

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
