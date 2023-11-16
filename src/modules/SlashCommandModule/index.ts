import { ChatInputCommandInteraction } from "discord.js";
import { BaseCommand, CommandResponse } from "../../baseClasses/BaseCommand";
import { CommandParser, ParserInteractionCommand } from "../../../libs/CommandParser";
import { BotCLient } from "../../Client";
import { BaseModule } from "../../baseClasses/BaseModule";
import { loadSlashCommands } from "../../utils/Loaders";
import { LavalinkNodeOptions, Manager } from "lavacord/dist/discord.js";
import { config } from "../../../config/config";
import * as ModuleConfig from "./config/config";
export class SlashCommandModule extends BaseModule {
	commands: Map<string, BaseCommand>;
	commandParser: CommandParser;
	nodes: LavalinkNodeOptions[];
	manager: Manager;
	constructor(client: BotCLient) {
		super(client, "SlashCommandModule");
		this.commands = new Map();
		this.commandParser = new CommandParser(client);
		this.nodes = ModuleConfig.config.lavaLinkNodes;
		this.manager = new Manager(this.client, this.nodes, {
			"user": config.botId
		});
	}
	public async init(): Promise<boolean> {
		await this.manager.connect();
		await loadSlashCommands(this.client);
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