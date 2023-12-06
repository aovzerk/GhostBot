import { GuildMember } from "discord.js";
import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { MusicPlayer } from "../libs/MusicPlayer";
const descriptionCommand: CommandDescription = {
	"name": "changedj",
	"load": true,
	"desc": "``/changedj`` - сменить DJ в плеере"
};

export default class Сhangedj implements BaseCommand {
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
			const oldPlayer = MusicPlayer.instances.get(params.interaction.guild!.id);
			if (!oldPlayer) {
				await params.interaction.reply({
					"ephemeral": true, "content": "На сервере не воспроизводится музыка"
				});
				return this.succsess();
			}
			if (oldPlayer.member.user.id !== params.interaction.member!.user.id) {
				await params.interaction.reply({
					"ephemeral": true, "content": "Вы не DJ"
				});
				return this.succsess();
			}
			await params.interaction.deferReply();
			const memberParams = params.interaction.options.getMember("user") as GuildMember;
			if (!memberParams) {
				await params.interaction.editReply({
					"content": "Упс, не предвиденная ошибка, юзер не найден"
				});
				return this.succsess();
			}
			oldPlayer.member = memberParams;
			await params.interaction.editReply({
				"content": `<@${memberParams.user.id}> Теперь DJ`
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