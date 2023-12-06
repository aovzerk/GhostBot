import { EmbedBuilder } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
const descriptionCommand: CommandDescription = {
	"name": "help",
	"load": true,
	"desc": "``/help`` - список команд"
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
				.setTitle("Команды");
			let desc = "";
			for (const command of this.client.slashCommandModule.commands) {
				desc = `${desc}${command[1].description.desc}\n`;
			}
			embed.setDescription(desc);
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