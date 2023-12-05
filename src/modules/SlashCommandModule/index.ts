/* eslint-disable no-await-in-loop */
import { ChatInputCommandInteraction } from "discord.js";
import { BaseCommand, CommandResponse } from "../../baseClasses/BaseCommand";
import { CommandParser, ParserInteractionCommand } from "../../../libs/CommandParser";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { LavalinkNodeOptions, Manager } from "lavacord/dist/discord.js";
import { config } from "../../../config/config";
import * as ModuleConfig from "./config/config";
import fs from "fs";
import path from "path";
export class SlashCommandModule extends BaseModule {
	commands: Map<string, BaseCommand>;
	commandParser: CommandParser;
	nodes: LavalinkNodeOptions[];
	managerLavalink: Manager;
	constructor(client: BotCLient) {
		super(client, "SlashCommandModule");
		this.commands = new Map();
		this.commandParser = new CommandParser(client);
		this.nodes = ModuleConfig.config.lavaLinkNodes;
		this.managerLavalink = new Manager(this.client, this.nodes, {
			"user": this.client.isDevBot ? config.dev_botId : config.botId
		});
	}
	private async loadSlashCommands(client: BotCLient) {
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
	public async init(): Promise<boolean> {
		this.managerLavalink.once("ready", () => {
			console.log("lavalink connected");
		});
		this.managerLavalink.on("error", (msg) => {
			console.log(msg);
		});
		await this.managerLavalink.connect();
		await this.loadSlashCommands(this.client);
		const callback = async (message: ChatInputCommandInteraction) => {
			const commandParser = this.commandParser.getParser(message) as ParserInteractionCommand | null;
			if (commandParser == null) return;
			const commandParsed = commandParser.parse();
			if (commandParsed == undefined) {
				this.client.logger.addLog({
					"guildId": message.guild?.id,
					"guildName": message.guild?.name,
					"data": `Команда не найдена ${message.commandName}`
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
		this.regCallback("interactionCreate", callback);
		return true;
	}
}