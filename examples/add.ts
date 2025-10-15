import { setTimeout } from 'node:timers/promises';
import { createClient } from 'redis';
import { RSet } from '../src';

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
