import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { MusicPlayer } from "../libs/MusicPlayer";
const descriptionCommand: CommandDescription = {
	"name": "play",
	"load": true,
	"desc": "``/play`` - воспроизвести трек или добавить его в очередь",
	"isVisible": true
};

export default class Play implements BaseCommand {
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
			const member = await params.interaction.guild?.members.fetch(params.interaction.member!.user.id);
			if (!member) {
				await params.interaction.reply({
					"content": "Упс, не предвиденная ошибка, юзер не найден"
				});
				return this.succsess();
			}
			if (!member!.voice.channelId) {
				await params.interaction.reply({
					"content": "Вы не находитесь в голсоов канале"
				});
				return this.succsess();
			}
			const oldPlayer = MusicPlayer.instances.get(member.guild.id);
			if (oldPlayer) {
				await oldPlayer.addSong(params.interaction);
				return this.succsess();
			}
			const player = new MusicPlayer(this.client, params.interaction, member);
			await player.init();
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