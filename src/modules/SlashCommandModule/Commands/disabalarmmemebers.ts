/* eslint-disable @typescript-eslint/no-explicit-any */
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
import { getGuildDb } from "../../../../libs/GuildDB";
const descriptionCommand: CommandDescription = {
	"name": "disabalarmmemebers",
	"load": true,
	"desc": "``/disabalarmmemebers`` - Выключить оповещени о входах/выходах юзеров (доп команда)",
	"isVisible": true
};

export default class DisabAlarmMemebers implements BaseCommand {
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
				if (guildDB.guildInfo.channelNewUsers === null) {
					await params.interaction.editReply({
						"content": "На этом сервере уже выключены оповещения о входе/выходе"
					});
					return this.succsess();
				}
				guildDB.guildInfo.channelNewUsers = null;
				await guildDB.save();
			} else {
				await params.interaction.editReply({
					"content": "Что-то пошло не так"
				});
			}
			await params.interaction.editReply({
				"content": "оповещения успешно выключены"
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