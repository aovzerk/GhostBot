/* eslint-disable @typescript-eslint/no-explicit-any */
import { getGuildDb } from "../../../../libs/GuildDB";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
import { Routes } from "discord.js";
const descriptionCommand: CommandDescription = {
	"name": "disabadvcommand",
	"load": true,
	"desc": "``/disabadvcommand`` - выключить доп. команды",
	"isVisible": true
};

export default class DisabAdvCommand implements BaseCommand {
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
				if (guildDB.guildInfo.enabledAdvCommand === false) {
					await params.interaction.editReply({
						"content": "У вас не включены доп. команды"
					});
					return this.succsess();
				}
				guildDB.guildInfo.enabledAdvCommand = false;
				await guildDB.save();
				const commands = (await this.client.slashCommandModule.rest.get(Routes.applicationGuildCommands(this.client.application!.id, params.interaction.guild!.id))) as any[];
				const promises = [];
				for (const command of commands) {
					promises.push(this.client.slashCommandModule.rest.delete(Routes.applicationGuildCommand(this.client.application!.id, params.interaction.guild!.id, command.id)));
				}
				await Promise.all(promises);
			}

			await params.interaction.editReply({
				"content": "Команды успешно удалены"
			});
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