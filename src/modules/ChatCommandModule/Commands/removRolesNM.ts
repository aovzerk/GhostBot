/* eslint-disable no-await-in-loop */
import { PermissionsBitField } from "discord.js";
import { getGuildDb } from "../../../../libs/GuildDB";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandArgs, CommandDescription, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
const descriptionCommand: CommandDescription = {
	"name": "removRolesNM",
	"load": true,
	"desc": "``removRolesNM`` - Выключить выдачу ролей новым юзерам",
	"isVisible": true
};

export default class RemovRolesNM implements BaseCommand {
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
			deleteMsgAfterTimeout(params.message, 5000);
			const hasAdmin = params.message.member!.permissions.has(PermissionsBitField.Flags.Administrator);
			if (!hasAdmin) {
				const msg = await params.message.reply({
					"content": "У вас нет прав администратора"
				});
				deleteMsgAfterTimeout(msg, 5000);
				return this.succsess();
			}
			const guildDB = await getGuildDb(params.message.guild!.id);
			if (guildDB !== null) {
				if (guildDB.guildInfo.rolesNewUsers === null) {
					const msg = await params.message.reply({
						"content": "На сервере уже выключена выдача ролей при входе"
					});
					deleteMsgAfterTimeout(msg, 5000);
					return this.succsess();
				}
				guildDB.guildInfo.rolesNewUsers = null;
				await guildDB.save();
			}
			const msg = await params.message.reply({
				"content": "Выдача ролей при входе успешно выключена"
			});
			deleteMsgAfterTimeout(msg, 5000);
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