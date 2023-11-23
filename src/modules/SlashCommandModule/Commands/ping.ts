import { BotCLient } from "../../../Client";
import { BaseCommand, CommandDescription, CommandInteractionArgs, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
const descriptionCommand: CommandDescription = {
	"name": "ping",
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
			await params.interaction.reply({
				"content": `Pong! ( ${ Date.now() - params.interaction.createdTimestamp }ms )`
			});
			return {
				"state": CommandState.OK,
				"message": `Команда ${this.description.name} ввыполнена успешно`
			};
		} catch (error) {
			return {
				"state": CommandState.ERROR,
				"message": `Команда ${this.description.name} звершилась с ошибкой`,
				"error": error
			};
		}
	}
}