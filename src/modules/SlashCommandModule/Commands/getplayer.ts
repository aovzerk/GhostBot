import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
import { MusicPlayer } from "../libs/MusicPlayer";
const descriptionCommand: CommandDescription = {
	"name": "getplayer",
	"load": true
};

export default class Ping implements BaseCommand {
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
			await oldPlayer.sendEmbedPlayer(oldPlayer.nowPlaying!, params.interaction);
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