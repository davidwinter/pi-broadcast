import {Bonjour} from 'bonjour-service';
import type {Service} from 'bonjour-service';
import exitHook from 'exit-hook';
import Docker from 'dockerode';
import logger from 'debug';

const debug = logger('pi-broadcast');

const docker = new Docker({socketPath: '/var/run/docker.sock'});
const bonjour = new Bonjour();

type Broadcasts = Record<string, Service>;
const broadcasts: Broadcasts = {};

console.log('📢 pi-broadcast starting...');

setInterval(async () => {
	console.log('🔎 Scanning Docker containers for hostnames');

	const rules = await findRules(docker);
	const hosts = scanRulesForHosts(rules);

	const toRemove = Object.keys(broadcasts).filter(x => !hosts.includes(x));

	broadcastHosts(hosts);

	for (const item of toRemove) {
		stopBroadcastForHost(item);
	}
}, 10 * 1000);

async function findRules(docker: Docker) {
	const containers = await docker.listContainers();

	let rules: string[] = [];

	for (const container of containers) {
		debug(container.Labels['com.docker.compose.project']);

		for (const key in container.Labels) {
			if (key.startsWith('traefik.http.routers')) {
				rules = rules.concat(container.Labels[key]);
			}
		}
	}

	return rules;
}

function scanRulesForHosts(rules: string[]) {
	const regex = /Host\(([^)]+)\)/gm;

	let hosts: string[] = [];

	for (const rule of rules) {
		const found = [...rule.matchAll(regex)];

		for (const item of found) {
			hosts = hosts.concat(item[1].replaceAll(/[` ]/g, '').split(','));
		}
	}

	hosts = [...new Set(hosts)];

	return hosts;
}

function broadcastHosts(hosts: string[]) {
	for (const item of hosts) {
		if (item in broadcasts) {
			console.log(`👍 Already broadcasting: ${item}`);
		} else {
			broadcasts[item] = bonjour.publish({
				name: `pi-broadcast: ${item}`,
				host: item,
				type: 'http',
				port: 80,
			});

			console.log(`✅ Now broadcasting ${item}`);
		}
	}
}

function stopBroadcastForHost(host: string) {
	if (Object.hasOwn(broadcasts, host)) {
		/* eslint-disable @typescript-eslint/no-unsafe-call */
		broadcasts[host].stop();
		/* eslint-enable @typescript-eslint/no-unsafe-call */

		/* eslint-disable @typescript-eslint/no-dynamic-delete */
		delete broadcasts[host];
		/* eslint-enable @typescript-eslint/no-dynamic-delete */

		console.log(`✋ Stopped broadcasting: ${host}`);
	}
}

exitHook(() => {
	console.log('🛑 Exiting pi-broadcast');

	for (const key in broadcasts) {
		if (Object.hasOwn(broadcasts, key)) {
			stopBroadcastForHost(key);
		}
	}
});
