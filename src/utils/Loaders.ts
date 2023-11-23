/* eslint-disable no-await-in-loop */
import fs from "fs";
import path from "path";
import { BotCLient } from "../Client";
import { BaseHandler } from "../baseClasses/BaseHandler";

export async function loadAllHandlers(client: BotCLient) {
	const files = fs.readdirSync(`${path.resolve()}/src/handlers`).filter(el => (el.endsWith(".ts") || el.endsWith(".js")) && !el.endsWith(".d.ts"));
	const promises: Promise<boolean>[] = [];
	for (const fileName of files) {
		try {
			const handlersFile = await import(`${path.resolve()}/src/handlers/${fileName}`);
			const handlers = new handlersFile.default(client) as BaseHandler;
			promises.push(handlers.load());
			client.auroraHandlers.push(handlers);
		} catch (error) {
			console.log(`Handler ${fileName} not loaded!`);
			console.log(error);
		}
	}
	await Promise.all(promises);
}

