/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
import { getGuildDb } from "../../../../libs/GuildDB";
import { config } from "../config/config";
const descriptionCommand: CommandDescription = {
	"name": "enabadvcommand",
	"load": true,
	"desc": "``/enabadvcommand`` - включить доп. команды",
	"isVisible": true
};

export default class EnabAdvCommand implements BaseCommand {
	description: CommandDescription = descriptionCommand;
	client: BotCLient;
	constructor(client: BotCLient) {
		this.client = client;
	}
	succsess() {
		return {
			"state": CommandState.OK,
			"message": `Команда ${this.description.name} ввыполнена успешно`
		};
	}
	public async run(params: CommandInteractionArgs): Promise<CommandResponse> {
		try {
			await params.interaction.deferReply({ "ephemeral": true });
			const guildDB = await getGuildDb(params.interaction.guild!.id);
			if (guildDB !== null) {
				if (guildDB.guildInfo.enabledAdvCommand === true) {
					await params.interaction.editReply({
						"content": "Дополнительные команды уже включены"
					});
					return this.succsess();
				}
				guildDB.guildInfo.enabledAdvCommand = true;
				await guildDB.save();
				await this.client.slashCommandModule.rest.put(
					Routes.applicationGuildCommands(this.client.application!.id, params.interaction.guild!.id),
					{ "body": config.advCommand }
				);
				await params.interaction.editReply({
					"content": "Команды успешно созданы"
				});
			} else {
				await params.interaction.editReply({
					"content": "Что-то пошло не так"
				});
			}

			return this.succsess();
		} catch (error) {
			const msg = await params.interaction.editReply({
				"content": "Упс, непредвиденная ошибка"
			});
			deleteMsgAfterTimeout(msg, 7000);
			return {
				"state": CommandState.ERROR,
				"message": `Команда ${this.description.name} звершилась с ошибкой`,
				"error": error
			};
		}
	}
}