import { BotCLient } from "../../../Client";
import { BaseCommand, CommandArgs, CommandDescription, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import fs from "fs";
import path from "path";
const descriptionCommand: CommandDescription = {
	"name": "reload_slash_cmd",
	"load": true
};

export default class ReloadSlashCmd implements BaseCommand {
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
	public async run(params: CommandArgs): Promise<CommandResponse> {
		try {
			const cmdName = params.args[0];
			const command = this.client.slashCommandModule.commands.get(cmdName);
			if (command === null) {
				await params.message.reply({
					"content": "Команда не найдена"
				});
				return this.succsess();
			}
			this.client.slashCommandModule.commands.delete(cmdName);

			const files = fs.readdirSync(`${path.resolve()}/src/modules/SlashCommandModule/Commands`).filter(el => (el.endsWith(".ts") || el.endsWith(".js")) && !el.endsWith(".d.ts"));
			const file = files.find(el => el.includes(cmdName));
			delete require.cache[`${path.resolve()}/src/modules/SlashCommandModule/Commands/${file}`];
			const commandFile = await import(`${path.resolve()}/src/modules/SlashCommandModule/Commands/${file}`);
			const commandNew = new commandFile.default(this.client) as BaseCommand;
			this.client.slashCommandModule.commands.set(commandNew.description.name, commandNew);
			await params.message.reply({
				"content": `Команда перезагружена ${file}`
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