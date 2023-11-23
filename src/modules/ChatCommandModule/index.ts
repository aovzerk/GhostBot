/* eslint-disable no-await-in-loop */
import { Message } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseCommand, CommandResponse } from "../../baseClasses/BaseCommand";
import { BaseModule } from "../../baseClasses/BaseModule";
import { CommandParser, ParserMsgCommand } from "../../../libs/CommandParser";
import fs from "fs";
import path from "path";
export class ChatCommandModule extends BaseModule {
	commands: Map<string, BaseCommand> = new Map<string, BaseCommand>;
	commandParser: CommandParser;
	constructor(client: BotCLient) {
		super(client, "ChatCommandModule");
		this.commandParser = new CommandParser(client);
	}
	private async loadChatCommands(client: BotCLient) {
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
	public async init(): Promise<boolean> {
		await this.loadChatCommands(this.client);
		const callback = async (message: Message) => {
			if (message.author.id == this.client.user!.id) return;
			if (!message.content.startsWith(this.client.prefix)) return;
			const commandParser = this.commandParser.getParser(message) as ParserMsgCommand | null;
			if (commandParser == null) return;
			const commandParsed = commandParser.parse();
			if (commandParsed == undefined) {
				this.client.logger.addLog({
					"guildId": message.guild?.id,
					"guildName": message.guild?.name,
					"data": `Команда не найдена ${message.content}`
				});
				return;
			}
			const response = await commandParsed.command.run(commandParsed.args) as CommandResponse;
			this.client.logger.addLog({
				"guildId": message.guild?.id,
				"guildName": message.guild?.name,
				"data": JSON.stringify(response)
			});
		};
		this.regCallback("messageCreate", callback);
		return true;
	}
}