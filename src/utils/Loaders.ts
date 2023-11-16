/* eslint-disable no-await-in-loop */
import fs from "fs";
import path from "path";
import { BotCLient } from "../Client";
import { BaseHandler } from "../baseClasses/BaseHandler";
import { BaseCommand } from "../baseClasses/BaseCommand";

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

export async function loadChatCommands(client: BotCLient) {
	const files = fs.readdirSync(`${path.resolve()}/src/modules/ChatCommandModule/Commands`).filter(el => (el.endsWith(".ts") || el.endsWith(".js")) && !el.endsWith(".d.ts"));
	const promises: Promise<boolean>[] = [];
	for (const fileName of files) {
		try {
			const commandFile = await import(`${path.resolve()}/src/modules/ChatCommandModule/Commands/${fileName}`);
			const command = new commandFile.default(client) as BaseCommand;
			client.chatCommandModule.commands.set(command.description.name, command);
		} catch (error) {
			console.log(`ChatCommand ${fileName} not loaded!`);
			console.log(error);
		}
	}
	await Promise.all(promises);
}

export async function loadSlashCommands(client: BotCLient) {
	const files = fs.readdirSync(`${path.resolve()}/src/modules/SlashCommandModule/Commands`).filter(el => (el.endsWith(".ts") || el.endsWith(".js")) && !el.endsWith(".d.ts"));
	const promises: Promise<boolean>[] = [];
	for (const fileName of files) {
		try {
			const commandFile = await import(`${path.resolve()}/src/modules/SlashCommandModule/Commands/${fileName}`);
			const command = new commandFile.default(client) as BaseCommand;
			client.slashCommandModule.commands.set(command.description.name, command);
		} catch (error) {
			console.log(`SlashCommand ${fileName} not loaded!`);
			console.log(error);
		}
	}
	await Promise.all(promises);
}