import { Message } from "discord.js";
import { BotCLient } from "../../Client";
import { BaseCommand, CommandResponse } from "../../baseClasses/BaseCommand";
import { BaseModule } from "../../baseClasses/BaseModule";
import { loadChatCommands } from "../../utils/Loaders";
import { CommandParser, ParserMsgCommand } from "../../../libs/CommandParser";
export class ChatCommandModule extends BaseModule {
	commands: Map<string, BaseCommand> = new Map<string, BaseCommand>;
	commandParser: CommandParser;
	constructor(client: BotCLient) {
		super(client, "ChatCommandModule");
		this.commandParser = new CommandParser(client);
	}
	public async init(): Promise<boolean> {
		await loadChatCommands(this.client);
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