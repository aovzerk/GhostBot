import { EmbedBuilder, GuildMember } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { deleteMsgAfterTimeout } from "../../../utils/etc";
const descriptionCommand: CommandDescription = {
	"name": "avatar",
	"load": true
};

export default class Ping implements BaseCommand {
	description: CommandDescription = descriptionCommand;
	client: BotCLient;
	constructor(client: BotCLient) {
		this.client = client;
	}
	public async run(params: CommandInteractionArgs): Promise<CommandResponse> {
		try {
			await params.interaction.deferReply();
			let member = params.interaction.member! as GuildMember;
			const memberInOption = params.interaction.options.getMember("user") as GuildMember | null;
			if (memberInOption) member = memberInOption;
			const avatarUser = member.user.avatarURL({
				"size": 4096
			});
			/* const avatarUserGuild = member.avatarURL({
				"size": 4096
			});
			console.log(avatarUserGuild); */
			if (avatarUser === null) {
				throw new Error("Аватар не найден");
			}
			const embed = new EmbedBuilder()
				.setDescription(`Аватар юзера <@${member.id}>`)
				.setImage(avatarUser);
			await params.interaction.editReply({
				"embeds": [embed]
			});

			return {
				"state": CommandState.OK,
				"message": `Команда ${this.description.name} ввыполнена успешно`
			};
		} catch (error) {
			const msg = await params.interaction.editReply({
				"content": "Упс, ошибка создании ссылка аватарки, возможно у юзера нет аватарки =)"
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