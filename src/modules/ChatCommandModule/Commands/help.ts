import { BotCLient } from "../../../Client";
import { BaseCommand, CommandArgs, CommandDescription, CommandResponse, CommandState } from "../../../baseClasses/BaseCommand";
const descriptionCommand: CommandDescription = {
	"name": "help",
	"load": true
};

export default class Help implements BaseCommand {
	description: CommandDescription = descriptionCommand;
	client: BotCLient;
	constructor(client: BotCLient) {
		this.client = client;
	}
	public async run(params: CommandArgs): Promise<CommandResponse> {
		try {
			console.log(params);
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