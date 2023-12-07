import { EmbedBuilder } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
const descriptionCommand: CommandDescription = {
	"name": "help",
	"load": true,
	"desc": "``/help`` - список команд",
	"isVisible": true
};

export default class Help implements BaseCommand {
	description: CommandDescription = descriptionCommand;
	client: BotCLient;
	constructor(client: BotCLient) {
		this.client = client;
	}
	private succsess(): CommandResponse {
		return {
			"state": CommandState.OK,
			"message": `Команда ${this.description.name} ввыполнена успешно`
		};
	}
	public async run(params: CommandInteractionArgs): Promise<CommandResponse> {
		try {
			const embed = new EmbedBuilder()
				.setTitle(`Команды. Префикс(только для чат команд) - ${this.client.prefix}`);
			let desc = "```Слеш команды```\n";
			for (const command of this.client.slashCommandModule.commands) {
				if (!command[1].description.isVisible) continue;
				desc = `${desc}${command[1].description.desc}\n`;
			}
			let desc2 = "```Чат команды```\n";
			for (const command of this.client.chatCommandModule.commands) {
				if (!command[1].description.isVisible) continue;
				desc2 = `${desc2}${command[1].description.desc}\n`;
			}
			embed.setDescription(`${desc}\n${desc2}`);
			await params.interaction.reply({
				"embeds": [embed]
			});
			return this.succsess();
		} catch (error) {
			return {
				"state": CommandState.ERROR,
				"message": `Команда ${this.description.name} звершилась с ошибкой`,
				"error": error
			};
		}
	}
}