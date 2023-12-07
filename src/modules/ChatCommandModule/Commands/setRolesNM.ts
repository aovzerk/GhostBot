/* eslint-disable no-await-in-loop */
import { PermissionsBitField } from "discord.js";
import { getGuildDb } from "../../../../libs/GuildDB";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandArgs, CommandDescription, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
const descriptionCommand: CommandDescription = {
	"name": "setRolesNM",
	"load": true,
	"desc": "``setRolesNM`` - ``@role1 @role2...``выдавать роли новым юзерам",
	"isVisible": true
};

export default class SetRolesNM implements BaseCommand {
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
			if (params.args.length == 0) {
				const msg = await params.message.reply({
					"content": "Аргументы команды не могут быть пустыми"
				});
				deleteMsgAfterTimeout(msg, 4000);
				return this.succsess();
			}
			const roles = params.args.map(el => el.replace("<", "").replace("@", "").replace("&", "").replace(">", ""));
			const invalidRole = [];
			for (const role of roles) {
				const isValid = await params.message.guild!.roles.fetch(role);
				if (isValid === null) invalidRole.push(role);
			}
			if (invalidRole.length !== 0) {
				let desc = "";
				for (const role of invalidRole) {
					desc = `${desc}${role}\n`;
				}
				const msg = await params.message.reply({
					"content": `Этих ролей нет на сервере \n\n${desc}`
				});
				deleteMsgAfterTimeout(msg, 5000);
				return this.succsess();
			}
			const guildDB = await getGuildDb(params.message.guild!.id);
			if (guildDB !== null) {
				if (guildDB.guildInfo.rolesNewUsers !== null) {
					const msg = await params.message.reply({
						"content": "На сервере уже установлена выдача ролей при входе"
					});
					deleteMsgAfterTimeout(msg, 5000);
					return this.succsess();
				}
				guildDB.guildInfo.rolesNewUsers = roles;
				await guildDB.save();
			}
			const msg = await params.message.reply({
				"content": "Роли успешно установлены"
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